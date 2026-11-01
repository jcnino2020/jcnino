import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import logs from '../api/logs.js';
function response(){return {code:200,setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};}
test('authenticated missing audit storage never fabricates sign-in records',async()=>{
  const oldPassword=process.env.ADMIN_PASSWORD;const oldUri=process.env.MONGODB_URI;
  try{
    process.env.ADMIN_PASSWORD='test-only';delete process.env.MONGODB_URI;
    const payload=Buffer.from(JSON.stringify({expiresAt:Date.now()+60000})).toString('base64url');
    const token=`${payload}.${crypto.createHmac('sha256','test-only').update(payload).digest('base64url')}`;
    const res=response();await logs({method:'GET',headers:{authorization:`Bearer ${token}`}},res);
    assert.equal(res.code,200);assert.deepEqual(res.body,{logs:[],available:false});
    const unauthorized=response();await logs({method:'GET',headers:{}},unauthorized);assert.equal(unauthorized.code,401);
  }finally{if(oldPassword===undefined)delete process.env.ADMIN_PASSWORD;else process.env.ADMIN_PASSWORD=oldPassword;if(oldUri===undefined)delete process.env.MONGODB_URI;else process.env.MONGODB_URI=oldUri;}
});

test('both successful and failed sign-ins persist real request metadata; report totals span pages',async()=>{
 const {createAuthHandler}=await import('../api/auth.js');const {createLogsHandler}=await import('../api/logs.js');
 const previous=process.env.ADMIN_PASSWORD;process.env.ADMIN_PASSWORD='test-only';
 const records=[];let skip=0;
 const collection={async insertOne(record){records.push(record);},async countDocuments(q){return q.status?records.filter(r=>q.status.$in.includes(r.status)).length:records.length;},find(){return {sort(){return this;},skip(n){skip=n;return this;},limit(){return this;},async toArray(){return records.slice(skip,skip+50);}};}};
 try {
  const auth=createAuthHandler(async()=>collection), history=createLogsHandler(async()=>collection);
  const attempt=async password=>{const r=response();await auth({method:'POST',headers:{'user-agent':'Audit test browser','x-forwarded-for':'203.0.113.9','x-vercel-ip-city':'Bacolod%20City','x-vercel-ip-country':'PH'},body:{password}},r);return r;};
  const denied=await attempt('incorrect');assert.equal(denied.code,401);assert.equal(denied.body.auditRecorded,true);
  const allowed=await attempt('test-only');assert.equal(allowed.body.auditRecorded,true);assert.ok(allowed.body.token);
  assert.equal(records.length,2);assert.deepEqual(records.map(r=>r.status),['Failed','Success']);assert.ok(records.every(r=>r.timestamp instanceof Date));assert.equal(records[0].ip,'203.0.113.9');assert.equal(records[0].geo.city,'Bacolod City');assert.ok(!JSON.stringify(records).includes('test-only'));
  const r=response();await history({method:'GET',headers:{authorization:'Bearer '+allowed.body.token},query:{page:'2'}},r);assert.equal(r.body.available,true);assert.deepEqual(r.body.summary,{total:2,successful:1,failed:1});assert.equal(skip,50);assert.deepEqual(r.body.logs,[]);
  const unavailable=response();await createLogsHandler(async()=>{throw Error('database down');})({method:'GET',headers:{authorization:'Bearer '+allowed.body.token}},unavailable);assert.equal(unavailable.code,503);assert.equal(unavailable.body.available,false);
  const unsaved=response();await createAuthHandler(async()=>null)({method:'POST',headers:{},body:{password:'test-only'}},unsaved);assert.equal(unsaved.body.auditRecorded,false);
 }finally{if(previous===undefined)delete process.env.ADMIN_PASSWORD;else process.env.ADMIN_PASSWORD=previous;}
});
