import {prisma} from '@/db/prisma';
import {currentCustomer} from './current-customer-server';
import {ACCOUNT_ACTIVITY_LIMIT,resolveAccountActivity} from './account-activity';
/** Existing Auth.js/Prisma identity and tables only. Read-only, bounded, self-only. */
export async function currentAccountActivity(){
 return resolveAccountActivity(await currentCustomer(),{
  orders:userId=>prisma.order.findMany({where:{userId},orderBy:{createdAt:'desc'},take:ACCOUNT_ACTIVITY_LIMIT,select:{id:true,userId:true,createdAt:true,totalPrice:true,isPaid:true,paymentMethod:true,paymentNote:true}}),
  support:userId=>prisma.serviceEnquiry.findMany({where:{userId},orderBy:{createdAt:'desc'},take:ACCOUNT_ACTIVITY_LIMIT,select:{id:true,userId:true,createdAt:true,serviceSlug:true,status:true,message:true}}),
 });
}
