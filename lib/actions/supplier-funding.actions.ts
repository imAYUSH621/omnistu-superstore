'use server';
import {auth} from '@/auth';
import {z} from 'zod';
import {prepareSupplierFundingReview} from '@/lib/supplier-funding-preparation';
import {executeSupplierFunding,reviewSupplierFundingExecution} from '@/lib/supplier-funding-execution';
import {formatError} from '@/lib/utils';
/** Admin-only preparation, never payment. No public caller may provide a quote,
 * supplier ID, plan digest, approval or replacement account destination. */
export async function prepareSupplierFundingReviewAction(orderId:string){
 const session=await auth();if(session?.user?.role!=='admin')return {success:false as const,message:'User is not authorized'};
 try{z.string().uuid().parse(orderId);const quote=await prepareSupplierFundingReview(orderId);return {success:true as const,quote,message:'Supplier quote saved for review only. No payment made; expiry timezone and payment authority still require verification.'};}
 catch(error){return {success:false as const,message:formatError(error)};}
}
/** Admin-only funding execution, default OFF. The caller supplies only the
 * order and the exact approved USD amount; the pair, parent and plan all come
 * from server-side evidence. The amount must equal the reviewed quote exactly,
 * and any regenerated quote must match it exactly again. */
export async function executeSupplierFundingAction(orderId:string,approvedAmountUsd:string){
 const session=await auth();if(session?.user?.role!=='admin'||typeof session.user.id!=='string')return {success:false as const,message:'User is not authorized'};
 try{
  z.string().uuid().parse(orderId);
  z.string().trim().regex(/^\d+(\.\d{1,2})?$/,'Exact USD amount required').parse(approvedAmountUsd);
  const result=await executeSupplierFunding(orderId,approvedAmountUsd,session.user.id);
  return {success:true as const,state:result.state,message:result.message};
 }catch(error){return {success:false as const,message:formatError(error)};}
}
/** Admin-only read-only recovery for an unconfirmed execution. Never pays. */
export async function reviewSupplierFundingExecutionAction(orderId:string){
 const session=await auth();if(session?.user?.role!=='admin')return {success:false as const,message:'User is not authorized'};
 try{
  z.string().uuid().parse(orderId);
  const result=await reviewSupplierFundingExecution(orderId);
  return {success:true as const,state:result.state,message:result.message};
 }catch(error){return {success:false as const,message:formatError(error)};}
}
