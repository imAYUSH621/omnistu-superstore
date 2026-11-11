'use server';
import {auth} from '@/auth';
import {z} from 'zod';
import {prepareSupplierFundingReview} from '@/lib/supplier-funding-preparation';
import {executeSupplierFunding,reviewSupplierFundingExecution,recordSupplierFundingApproval} from '@/lib/supplier-funding-execution';
import {formatError} from '@/lib/utils';
/** Admin-only preparation, never payment. No public caller may provide a quote,
 * supplier ID, plan digest, approval or replacement account destination. */
export async function prepareSupplierFundingReviewAction(orderId:string){
 const session=await auth();if(session?.user?.role!=='admin')return {success:false as const,message:'User is not authorized'};
 try{z.string().uuid().parse(orderId);const quote=await prepareSupplierFundingReview(orderId);return {success:true as const,quote,message:'Supplier quote saved for review only. No payment made; expiry timezone and payment authority still require verification.'};}
 catch(error){return {success:false as const,message:formatError(error)};}
}
/** Records the bound owner approval for one exact reviewed quote. The caller
 * supplies only the external owner-approval evidence reference; the amount,
 * parent and plan come from server-side evidence. An admin session alone is
 * not spend authority: execution is unavailable until this record exists. */
export async function recordSupplierFundingApprovalAction(orderId:string,evidenceRef:string){
 const session=await auth();if(session?.user?.role!=='admin'||typeof session.user.id!=='string')return {success:false as const,message:'User is not authorized'};
 try{
  z.string().uuid().parse(orderId);
  const approval=await recordSupplierFundingApproval(orderId,evidenceRef,session.user.id);
  return {success:true as const,approval,message:'Owner approval recorded for exactly USD '+approval.approvedAmountUsd+' on this reviewed quote. It can be consumed once, by one execution.'};
 }catch(error){return {success:false as const,message:formatError(error)};}
}
/** Admin-only funding execution, default OFF. The caller names only the order;
 * the exact amount, parent, pair and approval all come from the bound journal.
 * No caller input can create, widen or reuse spend authority. */
export async function executeSupplierFundingAction(orderId:string){
 const session=await auth();if(session?.user?.role!=='admin')return {success:false as const,message:'User is not authorized'};
 try{
  z.string().uuid().parse(orderId);
  const result=await executeSupplierFunding(orderId);
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
