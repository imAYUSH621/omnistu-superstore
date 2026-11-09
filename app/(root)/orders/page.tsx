import {redirect} from 'next/navigation';
import {orderHistoryPage} from '@/lib/order-history-language';

// One authenticated, localized order history. Do not keep a second receipt
// renderer that calls simulated records Paid or Delivered without context.
export default async function OrdersAlias({searchParams}:{searchParams:Promise<{page?:string}>}){
 const page=orderHistoryPage((await searchParams).page);
 redirect(page===1?'/user/orders':`/user/orders?page=${page}`);
}
