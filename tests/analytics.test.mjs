import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import handler, {summarizeJourneys} from '../api/analytics.js';
import {localVisitorLogs} from '../api/track_visitor.js';
const res=()=>({code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(body){this.body=body;return this;}});
test('analytics requires real admin authentication, even locally',async()=>{
 process.env.ADMIN_PASSWORD='analytics-test';delete process.env.MONGODB_URI;
 for(const authorization of ['', 'Bearer local_sandbox_authorized','Bearer invalid']){const r=res();await handler({method:'GET',headers:{authorization}},r);assert.equal(r.code,401);assert.equal(r.headers['Cache-Control'],'no-store');}
});
test('full-period totals and daily buckets are independent of paginated logs; filters exclude admin',async()=>{
 const payload=Buffer.from(JSON.stringify({expiresAt:Date.now()+60000})).toString('base64url');
 const authorization='Bearer '+payload+'.'+crypto.createHmac('sha256','analytics-test').update(payload).digest('base64url');
 const request=async query=>{const r=res();await handler({method:'GET',headers:{authorization},query},r);assert.equal(r.code,200);return r.body;};
 localVisitorLogs.splice(0,localVisitorLogs.length,...Array.from({length:45},(_,i)=>({sessionId:'session-'+i%3,pageUrl:i%2?'/work':'/',createdAt:new Date(),country:'Philippines',city:'Bacolod',browser:'Safari',os:'iOS',deviceType:'Mobile',isp:'Test network'})),{sessionId:'admin',pageUrl:'/admin/',createdAt:new Date()});
 let d=await request({range:'7d',limit:'20',page:'2'});assert.equal(d.totalViews,45);assert.equal(d.uniqueVisitors,3);assert.equal(d.logs.length,20);assert.equal(d.daily.reduce((s,r)=>s+r.views,0),45);assert.equal(d.timezone,'Asia/Manila');assert.equal(d.journeys.length,3);assert.equal(d.journeys.reduce((n,j)=>n+j.total,0),45);assert.ok(d.journeys.every(j=>j.steps.length===6));assert.equal(d.mobilePct,100);assert.equal(d.topPages.reduce((n,r)=>n+r.c,0),45);assert.ok(d.topPages.every(r=>r.visitors>0&&r.lastVisited));
 d=await request({range:'today',link:'/work',search:'safari'});assert.equal(d.totalViews,22);assert.ok(d.logs.every(r=>r.pageUrl==='/work'));assert.equal(new Date(d.from).getUTCHours(),16);
 d=await request({range:'7d',visitor:'session-1',limit:'2'});assert.equal(d.totalViews,15);assert.equal(d.logs.length,2);assert.ok(d.logs.every(r=>r.sessionId==='session-1'));assert.equal(d.selectedSession,'session-1');assert.equal(d.journeys.length,1);
 d=await request({range:'all',search:'no matching result'});assert.equal(d.totalViews,0);assert.deepEqual(d.daily,[]);assert.deepEqual(d.logs,[]);
 localVisitorLogs.length=0;
});

test('journey summaries are chronological, exclude missing IDs and limit previews independently of log pages',()=>{
 const entries=Array.from({length:10},(_,i)=>({sessionId:'test-session',createdAt:new Date(2026,0,1,0,i),pageUrl:'/step-'+i}));
 entries.push({pageUrl:'/unknown',createdAt:new Date()});
 const [journey]=summarizeJourneys(entries.reverse());assert.equal(journey.total,10);assert.equal(journey.steps.length,6);assert.deepEqual(journey.steps.map(s=>s.pageUrl),['/step-4','/step-5','/step-6','/step-7','/step-8','/step-9']);
 assert.equal(summarizeJourneys(Array.from({length:12},(_,i)=>({sessionId:'session-'+i,createdAt:new Date(2026,0,i+1)}))).length,8);
});
