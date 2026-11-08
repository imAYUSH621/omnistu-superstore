import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/components/ui/table';
import {deleteOrder,getAllOrders} from '@/lib/actions/order.actions';
import {formatCurrency,formatId} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import Link from 'next/link';
import DeleteDialog from '@/components/shared/delete-dialog';
import {requireAdmin} from '@/lib/auth-guard';
import H from '@/components/shared/order-history-text';
import A from '@/components/shared/admin-order-text';
import {orderHistoryPage} from '@/lib/order-history-language';
import {isSimulatedOrder} from '@/lib/order-simulation';
import {adminOrderMetadata} from '@/lib/admin-order-metadata';
export const generateMetadata=adminOrderMetadata;
export default async function AdminOrdersPage({searchParams}:{searchParams:Promise<{page?:string;query?:string}>}){
 await requireAdmin();
 const params=await searchParams,page=orderHistoryPage(params.page),query=params.query??'';
 const orders=await getAllOrders({page,query}).catch(()=>null);
 const href=(n:number)=>'/admin/orders?'+new URLSearchParams({page:String(n),...(query?{query}:{})}).toString();
 return <div className='space-y-2'>
  <div className='flex flex-wrap items-center gap-3'><h1 className='h2-bold'><H name='heading'/></h1>{query&&<div><A name='filtered'/> <i>&quot;{query}&quot;</i> <Link href='/admin/orders'><Button variant='outline' size='sm'><A name='clear'/></Button></Link></div>}</div>
  <p className='text-sm text-muted-foreground'><H name='note'/></p>
  {!orders?<p role='alert' className='text-sm text-destructive'><A name='unavailable'/></p>:orders.data.length===0?<p className='rounded border p-4'><A name='empty'/></p>:<div className='overflow-x-auto'><Table><TableHeader><TableRow><TableHead><H name='id'/></TableHead><TableHead><H name='date'/></TableHead><TableHead><A name='buyer'/></TableHead><TableHead><H name='total'/></TableHead><TableHead><H name='paid'/></TableHead><TableHead><H name='delivered'/></TableHead><TableHead><H name='actions'/></TableHead></TableRow></TableHeader><TableBody>{orders.data.map(o=>{const simulated=isSimulatedOrder(o);return <TableRow key={o.id}><TableCell>{formatId(o.id)}{simulated&&<span className='block text-xs text-sky-700 dark:text-sky-300'><H name='test'/></span>}</TableCell><TableCell><H date={new Date(o.createdAt).toISOString()}/></TableCell><TableCell>{o.user.name}</TableCell><TableCell>{formatCurrency(o.totalPrice)}</TableCell><TableCell>{o.isPaid&&o.paidAt?<>{simulated&&<span className='block'><H name='testPaid'/></span>}<H date={new Date(o.paidAt).toISOString()}/></>:<H name='notPaid'/>}</TableCell><TableCell>{o.isDelivered&&o.deliveredAt?<>{simulated&&<span className='block'><H name='testDelivered'/></span>}<H date={new Date(o.deliveredAt).toISOString()}/></>:<H name='notDelivered'/>}</TableCell><TableCell><Button asChild variant='outline' size='sm'><Link href={'/order/'+o.id}><H name='details'/></Link></Button><DeleteDialog id={o.id} action={deleteOrder}/></TableCell></TableRow>})}</TableBody></Table></div>}
  {orders&&<div className='flex gap-2'>{page>1&&<Button asChild variant='outline'><Link href={href(page-1)}><H name='previous'/></Link></Button>}{page<orders.totalPages&&<Button asChild variant='outline'><Link href={href(page+1)}><H name='next'/></Link></Button>}</div>}
 </div>
}
