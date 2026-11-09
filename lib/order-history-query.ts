/** Server actions can be called without the page's query parser. Bound both
 * values independently, including a misconfigured environment default. */
export function orderHistoryQuery(page:unknown,limit:unknown,defaultLimit:unknown=12){
 const fallback=typeof defaultLimit==='number'&&Number.isSafeInteger(defaultLimit)&&defaultLimit>=1&&defaultLimit<=100?defaultLimit:12;
 const take=typeof limit==='number'&&Number.isSafeInteger(limit)&&limit>=1&&limit<=100?limit:fallback;
 const selectedPage=typeof page==='number'&&Number.isSafeInteger(page)&&page>=1&&page<=10000?page:1;
 return{page:selectedPage,take,skip:(selectedPage-1)*take};
}
