import crypto from 'node:crypto';
import { prepareResponse } from '../lib/admin-session.js';
import { auditCollection } from '../lib/audit-store.js';
export function createAuthHandler(getCollection = auditCollection) {
 return async function handler(req,res) {
  if(!prepareResponse(req,res))return;
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const expectedPassword=process.env.ADMIN_PASSWORD;
  if(!expectedPassword)return res.status(503).json({error:'Authentication is not configured.'});
  const password=req.body?.password;
  if(typeof password!=='string'||!password)return res.status(400).json({error:'Password is required'});
  const loginSuccessful=crypto.timingSafeEqual(crypto.createHash('sha256').update(password).digest(),crypto.createHash('sha256').update(expectedPassword).digest());
  const rawCity=req.headers['x-vercel-ip-city'];let city=rawCity||'';
  try{city=decodeURIComponent(city);}catch{}
  const logEntry={timestamp:new Date(),status:loginSuccessful?'Success':'Failed',
   ip:req.headers['x-forwarded-for']?.split(',')[0].trim()||req.headers['x-real-ip']||req.socket?.remoteAddress||'',
   userAgent:req.headers['user-agent']||'',
   geo:{country:req.headers['x-vercel-ip-country']||'',region:req.headers['x-vercel-ip-country-region']||'',city},
   source:'server',event:'admin.sign_in'};
  let auditRecorded=false;
  try{const collection=await getCollection();if(collection){await collection.insertOne(logEntry);auditRecorded=true;}}
  catch(error){console.error('Sign-in audit write failed:',error.message);}
  if(!loginSuccessful)return res.status(401).json({success:false,error:'Incorrect administrator password',auditRecorded});
  const payload=Buffer.from(JSON.stringify({expiresAt:Date.now()+2*60*60*1000})).toString('base64url');
  const token=payload+'.'+crypto.createHmac('sha256',expectedPassword).update(payload).digest('base64url');
  return res.status(200).json({success:true,token,auditRecorded});
 };
}
export default createAuthHandler();
