'use server';
import {auth} from '@/auth';
import {z} from 'zod';
import {prepareSupplierFundingReview} from '@/lib/supplier-funding-preparation';
import {formatError} from '@/lib/utils';
/** Admin-only preparation, never payment. No public caller may provide a quote,
 * supplier ID, plan digest, approval or replacement account destination. */
export async function prepareSupplierFundingReviewAction(orderId:string){
 const session=await auth();if(session?.user?.role!=='admin')return {success:false as const,message:'User is not authorized'};
 try{z.string().uuid().parse(orderId);const quote=await prepareSupplierFundingReview(orderId);return {success:true as const,quote,message:'Supplier quote saved for review only. No payment made; expiry timezone and payment authority still require verification.'};}
 catch(error){return {success:false as const,message:formatError(error)};}
}
