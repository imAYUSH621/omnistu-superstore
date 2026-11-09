'use server';
import {auth} from '@/auth';
import {z} from 'zod';
import {reconcileSupplierPayment} from '@/lib/supplier-payment-reconciliation';
import {formatError} from '@/lib/utils';
export async function reconcileSupplierPaymentAction(orderId:string){
 const session=await auth();if(session?.user?.role!=='admin')return {success:false as const,message:'User is not authorized'};
 try{z.string().uuid().parse(orderId);const evidence=await reconcileSupplierPayment(orderId);return {success:true as const,evidence,message:'Supplier records saved for review. No payment, refund or retry was made or authorized.'};}
 catch(error){return {success:false as const,message:formatError(error)};}
}
