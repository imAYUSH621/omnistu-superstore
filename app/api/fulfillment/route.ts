import {NextResponse} from 'next/server';
import {auth} from '@/auth';
import {dispatchPersistedSupplierOrder} from '@/lib/bound-supplier-dispatch';
/** Operator entry uses the same persisted paid-order plan as automatic settlement.
 * No customer address, provider ID, variant, SKU, method or price is accepted here. */
export async function POST(req:Request){
 const session=await auth();if(session?.user?.role!=='admin')return NextResponse.json({success:false,message:'Admin access required.'},{status:403});
 const body=await req.json().catch(()=>null);
 if(!body||Object.keys(body).some(k=>k!=='order_id')||typeof body.order_id!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.order_id))return NextResponse.json({success:false,message:'One existing order_id is required. Supplier mapping overrides are not accepted.'},{status:400});
 try{const result=await dispatchPersistedSupplierOrder(body.order_id);return NextResponse.json({success:result.status==='SUPPLIER_ORDER_CREATED_UNPAID',receipt:result},{status:result.status==='SUPPLIER_ORDER_CREATED_UNPAID'?200:409})}
 catch{return NextResponse.json({success:false,message:'Persisted order approval requires review; nothing is confirmed dispatched.'},{status:409})}
}
