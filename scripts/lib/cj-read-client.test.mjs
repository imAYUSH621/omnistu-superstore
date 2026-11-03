import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyCjResponse, createCjReadClient } from './cj-read-client.mjs';
for (const [status, body, expected] of [
  [429, {code:1600200,pointsInfo:{remaining:120}}, 'RATE_LIMIT'],
  [429, {code:429,pointsInfo:{remaining:0}}, 'QUOTA'],
  [200, {code:1600201}, 'QUOTA'],
  [200, {code:16900500}, 'QUOTA'],
  [429, {}, 'THROTTLED_UNKNOWN'],
  [200, {code:1600014}, 'SUSPENDED'],
  [200, {code:1600001}, 'AUTH'],
  [503, {}, 'SERVER'],
  [200, {result:true,code:200}, null],
]) test(`classifies ${status}/${body.code} as ${expected}`,()=>assert.equal(classifyCjResponse(status,body),expected));
test('quota/suspension/rate/auth failures stop this run with no retries or token refresh',async()=>{
 for(const code of [1600200,1600201,1600014,1600001]){
  let calls=0;const call=createCjReadClient({sleep:async()=>{},fetchImpl:async()=>{calls++;return {status:429,json:async()=>({code})}}});
  await assert.rejects(call('/product/list','secret'));
  await assert.rejects(call('/product/list','secret'),{kind:'STOPPED'});
  assert.equal(calls,1);
 }
});
test('all calls including auth are paced; tokens and response messages do not enter errors',async()=>{
 let t=1000;const waits=[];const call=createCjReadClient({now:()=>t,sleep:async ms=>{waits.push(ms);t+=ms},fetchImpl:async()=>({status:200,json:async()=>({result:true,data:{}})})});
 await call('/authentication/getAccessToken',null,{apiKey:'secret'});await call('/product/list','secret');
 assert.deepEqual(waits,[0,1100]);
 const bad=createCjReadClient({sleep:async()=>{},fetchImpl:async()=>({status:401,json:async()=>({code:1600001,message:'secret'})})});
 await assert.rejects(bad('/x','secret'),e=>!e.message.includes('secret'));
});
test('auth responses are absent from the tracked deployment tree',async()=>{
 const {execFileSync}=await import('node:child_process');
 const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0');
 assert.equal(files.includes('.cache/cj/auth.json'),false);
});
