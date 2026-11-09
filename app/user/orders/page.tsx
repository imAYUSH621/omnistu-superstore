import {isSimulatedOrder} from '@/lib/order-simulation';
import {getMyOrders} from '@/lib/actions/order.actions';
import {formatCurrency,formatId} from '@/lib/utils';
import {auth} from '@/auth';import {redirect} from 'next/navigation';import Link from 'next/link';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/components/ui/table';
import OrderText from '@/components/shared/order-history-text';import {orderHistoryPage} from '@/lib/order-history-language';import {orderHistoryMetadata} from '@/lib/order-history-metadata';
export async function generateMetadata(){return orderHistoryMetadata()}
export default async function OrdersPage({searchParams}:{searchParams:Promise<{page?:string}>}){
 const session=await auth();if(!session?.user?.id)redirect('/sign-in?callbackUrl=/user/orders');
 const page=orderHistoryPage((await searchParams).page);let orders:Awaited<ReturnType<typeof getMyOrders>>|null=null;
 try{orders=await getMyOrders({page})}catch{}
 return <div className='space-y-3'><h2 className='h2-bold'><OrderText name='heading'/></h2><p className='text-sm text-muted-foreground'><OrderText name='note'/></p>
 {!orders?<p role='alert' className='text-sm text-destructive'><OrderText name='unavailable'/></p>:<>
 {orders.data.length===0?<p className='rounded border p-3 text-sm'><OrderText name='empty'/></p>:<div className='overflow-x-auto'><Table><TableHeader><TableRow>{(['id','date','total','paid','delivered','actions']as const).map(name=><TableHead key={name}><OrderText name={name}/></TableHead>)}</TableRow></TableHeader><TableBody>{orders.data.map(order=>{const test=isSimulatedOrder(order);return <TableRow key={order.id}>
 <TableCell>{formatId(order.id)}{test?<span className='block text-xs text-muted-foreground'><OrderText name='test'/></span>:null}</TableCell><TableCell><OrderText date={order.createdAt.toISOString()}/></TableCell><TableCell>{formatCurrency(order.totalPrice)}</TableCell>
 <TableCell>{order.isPaid&&order.paidAt?<>{test?<span className='block'><OrderText name='testPaid'/></span>:null}<OrderText date={order.paidAt.toISOString()}/></>:<OrderText name='notPaid'/>}</TableCell>
 <TableCell>{order.isDelivered&&order.deliveredAt?<>{test?<span className='block'><OrderText name='testDelivered'/></span>:null}<OrderText date={order.deliveredAt.toISOString()}/></>:<OrderText name='notDelivered'/>}</TableCell>
 <TableCell><Link className='link' href={`/order/${order.id}`}><OrderText name='details'/></Link></TableCell></TableRow>})}</TableBody></Table></div>}
 {orders.totalPages>1||page>1?<nav aria-label='Pagination' className='flex gap-4 text-sm'>{page>1?<Link className='link' href={`/user/orders?page=${page-1}`}><OrderText name='previous'/></Link>:null}{page<orders.totalPages?<Link className='link' href={`/user/orders?page=${page+1}`}><OrderText name='next'/></Link>:null}</nav>:null}
 </>}
 </div>
}
