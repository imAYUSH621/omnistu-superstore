/** Bound the original decoded response bytes before parsing. Row limits alone
 * do not bound discarded invoice components or private upstream fields. */
export const BILLING_RESPONSE_MAX_BYTES=262144;
export const BILLING_RESPONSE_TIMEOUT_MS=4000;
export async function boundedBillingJson(response:Response,timeoutMs=BILLING_RESPONSE_TIMEOUT_MS):Promise<unknown>{
 const cancelBody=()=>{void response.body?.cancel().catch(()=>{})};
 const length=response.headers.get('content-length');
 if(length!==null&&(!/^\d+$/.test(length)||Number(length)>BILLING_RESPONSE_MAX_BYTES)){
  cancelBody();throw Error('BILLING_RESPONSE_TOO_LARGE');
 }
 if(!response.body)throw Error('BILLING_RESPONSE_EMPTY');
 const reader=response.body.getReader(),chunks:Uint8Array[]=[];let bytes=0;
 let timer:ReturnType<typeof setTimeout>|undefined;
 // A framework may wrap fetch's response stream without preserving the fetch
 // signal after headers. Keep an independent total body deadline, and never
 // wait for upstream cancellation to settle before failing closed.
 const deadline=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('BILLING_RESPONSE_TIMEOUT')),timeoutMs)});
 try{
  while(true){const part=await Promise.race([reader.read(),deadline]);if(part.done)break;bytes+=part.value.byteLength;if(bytes>BILLING_RESPONSE_MAX_BYTES)throw Error('BILLING_RESPONSE_TOO_LARGE');chunks.push(part.value)}
 }catch(error){void reader.cancel().catch(()=>{});throw error}
 finally{clearTimeout(timer);reader.releaseLock()}
 const all=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.byteLength}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));
}
