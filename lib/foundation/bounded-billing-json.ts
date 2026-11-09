/** Bound the original bytes before parsing. Row limits alone do not bound an
 * upstream body, including discarded invoice components or private fields. */
export const BILLING_RESPONSE_MAX_BYTES=262144;
export async function boundedBillingJson(response:Response):Promise<unknown>{
 const length=response.headers.get('content-length');
 if(length!==null&&(!/^\d+$/.test(length)||Number(length)>BILLING_RESPONSE_MAX_BYTES)){
  await response.body?.cancel().catch(()=>{});throw Error('BILLING_RESPONSE_TOO_LARGE');
 }
 if(!response.body)throw Error('BILLING_RESPONSE_EMPTY');
 const reader=response.body.getReader(),chunks:Uint8Array[]=[];let bytes=0;
 try{
  while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>BILLING_RESPONSE_MAX_BYTES)throw Error('BILLING_RESPONSE_TOO_LARGE');chunks.push(part.value)}
 }catch(error){await reader.cancel().catch(()=>{});throw error}
 finally{reader.releaseLock()}
 const all=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.byteLength}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));
}
