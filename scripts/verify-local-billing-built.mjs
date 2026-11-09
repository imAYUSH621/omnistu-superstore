/** Post-build HTTP regression. Disposable loopback DB + synthetic upstream only.
 * Does not qualify a real billing core, payment, production host or service grant. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {randomBytes,randomUUID,scryptSync} from 'node:crypto';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {PrismaClient} from '@prisma/client';
const db=new URL(process.env.DATABASE_URL||'');
assert.equal(process.env.OMNISTU_LOCAL_DB_TEST,'true');
assert.ok(!process.env.VERCEL_ENV);
assert.ok(['postgres:','postgresql:'].includes(db.protocol));
assert.ok(['localhost','127.0.0.1','[::1]'].includes(db.hostname));
assert.match(db.pathname,/^\/omnistu_test_[a-zA-Z0-9_]+$/);
const prisma=new PrismaClient(),users=[],requests=[];
let upstream,store,mode='normal',stdout='';
const accountId=randomUUID(),subscriptionId=randomUUID(),bundleId=randomUUID(),invoiceId=randomUUID();
let firstId;
const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port)));
try{
 const password=randomBytes(24).toString('base64url'),salt=randomBytes(16),key=scryptSync(password,salt,64,{N:16384,r:8,p:5,maxmem:64*1024*1024});
 const hash=['scrypt',16384,8,5,salt.toString('base64'),key.toString('base64')].join('$');
 for(let i=0;i<2;i++)users.push(await prisma.user.create({data:{email:'synthetic-built-billing-'+randomUUID()+'@example.invalid',name:'Synthetic compiled billing test',password:hash,role:'user'}}));
 firstId=users[0].id;
 upstream=createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');requests.push({method:req.method,path:url.pathname});
  assert.equal(req.method,'GET');
  res.setHeader('content-type','application/json');
  if(mode==='account-stall'&&url.pathname==='/1.0/kb/accounts'){res.write('{');return}
  if(mode==='account-chunked'&&url.pathname==='/1.0/kb/accounts'){res.write('"'+'x'.repeat(262144));res.end('x"');return}
  if(mode==='second-declared'&&url.pathname!=='/1.0/kb/accounts'){res.setHeader('content-length','262145');res.end(' '.repeat(262145));return}
  if(url.pathname==='/1.0/kb/accounts'){
   if(url.searchParams.get('externalKey')!=='authjs:'+firstId){res.statusCode=404;res.end('{}');return}
   res.end(JSON.stringify({accountId,externalKey:'authjs:'+firstId,currency:'USD',accountBalance:0,accountCBA:0,privateEmail:'never-project@example.invalid'}));return;
  }
  if(url.pathname==='/1.0/kb/accounts/'+accountId+'/invoices'){res.end(JSON.stringify([{accountId,invoiceId,invoiceDate:'2026-11-09',status:'DRAFT',currency:'USD',amount:12.34,balance:12.34,privateField:'never-project'}]));return}
  if(url.pathname==='/1.0/kb/accounts/'+accountId+'/bundles'){res.end(JSON.stringify([{accountId,bundleId,subscriptions:[{accountId,bundleId,subscriptionId,planName:'synthetic-zero',productName:'SyntheticLocal',state:'ACTIVE'}]}]));return}
  res.statusCode=404;res.end('{}');
 });
 const upstreamPort=await listen(upstream),reservation=createServer();const port=await listen(reservation);await new Promise(r=>reservation.close(r));const base='http://127.0.0.1:'+port;
 store=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{env:{...process.env,NODE_ENV:'production',AUTH_SECRET:randomBytes(32).toString('hex'),AUTH_TRUST_HOST:'true',SHARED_BILLING_LOCAL_TEST_ONLY:'true',KILLBILL_LOCAL_URL:'http://127.0.0.1:'+upstreamPort,KILLBILL_LOCAL_USERNAME:'synthetic',KILLBILL_LOCAL_PASSWORD:'ephemeral',KILLBILL_LOCAL_TENANT_KEY:'synthetic',KILLBILL_LOCAL_TENANT_SECRET:'ephemeral',ORDERS_ENABLED:'false',ORDER_CONFIRMATION_EMAILS_ENABLED:'false',FULFILLMENT_DISPATCH_ENABLED:'false'},stdio:['ignore','pipe','pipe']});
 store.stdout.on('data',x=>{stdout=(stdout+x).slice(-12000)});store.stderr.on('data',x=>{stdout=(stdout+x).slice(-12000)});
 async function http(path,options={}){return fetch(base+path,{...options,redirect:'manual',signal:AbortSignal.timeout(10000)})}
 let ready=false;for(let i=0;i<60;i++){if(store.exitCode!==null)throw Error('compiled Store exited');try{if((await http('/api/auth/session')).ok){ready=true;break}}catch{}await delay(250)}assert.ok(ready,'compiled Store readiness');
 async function login(user){let cookies='';const add=r=>{for(const c of r.headers.getSetCookie()){const v=c.split(';')[0];cookies=cookies?cookies+'; '+v:v}};let r=await http('/api/auth/csrf');add(r);const csrf=(await r.json()).csrfToken;r=await http('/api/auth/callback/credentials',{method:'POST',headers:{cookie:cookies,'Content-Type':'application/x-www-form-urlencoded','X-Auth-Return-Redirect':'1'},body:new URLSearchParams({csrfToken:csrf,email:user.email,password,callbackUrl:base+'/user/profile'})});assert.equal(r.status,200);add(r);r=await http('/api/auth/session',{headers:{cookie:cookies}});assert.equal((await r.json()).user.id,user.id);return cookies}
 const first=await login(users[0]),second=await login(users[1]);
 for(const path of['billing','entitlements']){
  let r=await http('/api/account/'+path+'?customerId='+firstId);assert.equal(r.status,401);
  r=await http('/api/account/'+path+'?customerId='+firstId+'&externalKey=authjs:'+firstId,{headers:{cookie:second}});assert.equal(r.status,200);assert.deepEqual(await r.json(),{[path]:{status:'not-linked'}});
  r=await http('/api/account/'+path+'?customerId=other',{headers:{cookie:first}});assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'private, no-store');assert.ok(r.headers.get('vary').split(/,\s*/).includes('Cookie'));const body=await r.json(),data=body[path];assert.equal(data.status,'ready');assert.equal(data.testOnly,true);assert.ok(!JSON.stringify(body).includes('never-project'));if(path==='entitlements'){assert.equal(data.serviceProvisioned,false);assert.equal(data.subscriptions[0].id,subscriptionId)}else{assert.equal(data.invoices[0].amount,'12.34');assert.equal(data.invoices[0].status,'DRAFT')}
 }
 for(const scenario of['account-chunked','second-declared','account-stall']){mode=scenario;for(const path of['billing','entitlements']){const start=Date.now(),r=await http('/api/account/'+path,{headers:{cookie:first}});assert.equal(r.status,503);assert.deepEqual(await r.json(),{[path]:{status:'unavailable'}});assert.ok(Date.now()-start<9000)}console.log('PASS compiled Store fault:',scenario)}
 assert.ok(requests.every(r=>r.method==='GET'));console.log('PASS actual compiled Store credential sessions, UUID isolation, private projection, synthetic positive DRAFT, state-not-grant, body faults and deadline. Synthetic upstream only.');
}catch(error){console.error('Compiled billing gate failed:',error);if(stdout)console.error(stdout);process.exitCode=1}
finally{
 if(store){store.kill('SIGTERM');await Promise.race([new Promise(r=>store.once('exit',r)),delay(3000)]);if(store.exitCode===null)store.kill('SIGKILL')}
 if(upstream){upstream.closeAllConnections();await new Promise(r=>upstream.close(r))}
 for(const user of users)await prisma.user.delete({where:{id:user.id}});
 await prisma.$disconnect();
}
