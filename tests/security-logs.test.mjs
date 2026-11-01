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
