import {auth} from '@/auth';
import {prisma} from '@/db/prisma';
import {resolveCurrentCustomer} from './current-customer';
/** Never accepts a request/form customer ID or resolves by email. */
export async function currentCustomer(){
 try{return await resolveCurrentCustomer(await auth(),id=>prisma.user.findUnique({where:{id},select:{id:true,name:true,email:true,createdAt:true}}))}
 catch{return{status:'unavailable' as const,customer:null}}
}
