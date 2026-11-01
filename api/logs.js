import { authenticated, prepareResponse } from '../lib/admin-session.js';
import { auditCollection } from '../lib/audit-store.js';
export function createLogsHandler(getCollection = auditCollection) {
 return async function handler(req,res) {
  if(!prepareResponse(req,res))return;
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  if(!authenticated(req))return res.status(401).json({error:'Sign in to view security history.'});
  try {
   const collection=await getCollection();
   if(!collection)return res.status(200).json({logs:[],available:false});
   const query=req.query||Object.fromEntries(new URL(req.url||'/', 'http://localhost').searchParams);
   const page=Math.max(1,parseInt(query.page,10)||1), limit=50;
   const [logs,total,successful,failed]=await Promise.all([
    collection.find({}).sort({timestamp:-1,_id:-1}).skip((page-1)*limit).limit(limit).toArray(),
    collection.countDocuments({}),collection.countDocuments({status:{$in:['Success','Authorized']}}),collection.countDocuments({status:{$in:['Failed','Denied']}})
   ]);
   return res.status(200).json({logs,available:true,source:'database',summary:{total,successful,failed},page,limit,checkedAt:new Date().toISOString()});
  }catch(error){console.error('Audit history unavailable:',error.message);return res.status(503).json({error:'Audit database unavailable. Refresh to retry.',available:false});}
 };
}
export default createLogsHandler();
