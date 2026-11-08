import {NextRequest,NextResponse} from 'next/server';
import {timingSafeEqual} from 'node:crypto';
import {catalogPreparationAvailable,runCatalogPreparation} from '@/lib/catalog-preparation-workflow';
export const dynamic='force-dynamic';
export const maxDuration=60;
/** Private qualification caller for the SAME manual workflow used by admin.
 * No original-input writes, no caller-supplied evidence, no publication path. */
export async function POST(req:NextRequest){
 if(process.env.VERCEL_ENV!=='preview'||!catalogPreparationAvailable())return NextResponse.json({error:'disabled'},{status:409});
 const expected=process.env.VERCEL_AUTOMATION_BYPASS_SECRET,actual=req.headers.get('x-vercel-protection-bypass');
 if(!expected||!actual||Buffer.byteLength(expected)!==Buffer.byteLength(actual)||!timingSafeEqual(Buffer.from(expected),Buffer.from(actual)))return NextResponse.json({error:'restricted test caller'},{status:403});
 let input:unknown;try{input=await req.json()}catch{return NextResponse.json({error:'invalid request'},{status:400})}
 if(!input||typeof input!=='object'||Array.isArray(input))return NextResponse.json({error:'invalid request'},{status:400});
 const body=input as Record<string,unknown>;
 if((body.action==='status'||body.action==='drain')&&Object.keys(body).length===1){
  try{return NextResponse.json(await runCatalogPreparation({action:body.action}))}catch{return NextResponse.json({error:'workflow unavailable; inspect state before retry'},{status:409})}
 }
 if(body.action==='enqueue'&&Object.keys(body).length===2&&typeof body.preparationId==='string'&&/^[a-f0-9]{64}$/.test(body.preparationId)){
  try{return NextResponse.json(await runCatalogPreparation({action:'enqueue',preparationId:body.preparationId}))}catch{return NextResponse.json({error:'workflow unavailable; inspect state before retry'},{status:409})}
 }
 return NextResponse.json({error:'invalid request'},{status:400});
}
