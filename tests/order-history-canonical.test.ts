const mockRedirect=jest.fn((path:string)=>{throw Error(path)});
jest.mock('next/navigation',()=>({redirect:(path:string)=>mockRedirect(path)}));
import Page from '@/app/(root)/orders/page';
import{orderHistoryQuery}from '@/lib/order-history-query';
afterEach(()=>jest.clearAllMocks());
it.each([[undefined,'/user/orders'],['2','/user/orders?page=2'],['0','/user/orders'],['10001','/user/orders'],['1e3','/user/orders'],['2&userId=other','/user/orders']])('legacy orders URL %s uses one canonical authenticated renderer',async(page,target)=>{await expect(Page({searchParams:Promise.resolve({page})})).rejects.toThrow(target!);expect(mockRedirect).toHaveBeenCalledWith(target)});
it.each([0,-1,NaN,Infinity,1.5,10001,'2',null,{}])('direct page %p is bounded without coercion',page=>expect(orderHistoryQuery(page,3)).toEqual({page:1,take:3,skip:0}));
it.each([0,-1,NaN,Infinity,1.5,101,'3',null,{}])('direct limit %p uses safe bounded default',limit=>expect(orderHistoryQuery(2,limit,12)).toEqual({page:2,take:12,skip:12}));
it('misconfigured environment default is never an unlimited/invalid query',()=>{expect(orderHistoryQuery(undefined,undefined,Infinity)).toEqual({page:1,take:12,skip:0});expect(orderHistoryQuery(10000,100)).toEqual({page:10000,take:100,skip:999900})});
