'use server';
import {auth} from '@/auth';
import {z} from 'zod';
import {recoverSupplierCreation} from '@/lib/supplier-creation-recovery';
import {formatError} from '@/lib/utils';
export async function recoverSupplierCreationAction(orderId:string){
 const session=await auth();if(session?.user?.role!=='admin')return {success:false as const,message:'User is not authorized'};
 try{z.string().uuid().parse(orderId);const result=await recoverSupplierCreation(orderId);return {success:true as const,result,message:'Existing supplier identity recorded. No order was resubmitted, funded, shipped or delivered.'};}
 catch(error){return {success:false as const,message:formatError(error)};}
}
