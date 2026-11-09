const mockAuth=jest.fn(),mockCheck=jest.fn();
jest.mock('@/auth',()=>({auth:()=>mockAuth()}));
jest.mock('@/lib/supplier-payment-reconciliation',()=>({reconcileSupplierPayment:(...a:unknown[])=>mockCheck(...a)}));
import {reconcileSupplierPaymentAction} from '@/lib/actions/supplier-payment.actions';
beforeEach(()=>{mockAuth.mockReset();mockCheck.mockReset()});
it('blocks guests and customers before account reads',async()=>{for(const s of[null,{user:{role:'user'}}]){mockAuth.mockResolvedValue(s);expect(await reconcileSupplierPaymentAction('00000000-0000-4000-8000-000000000001')).toMatchObject({success:false,message:'User is not authorized'})}expect(mockCheck).not.toHaveBeenCalled()});
it('rejects invalid order IDs before account reads',async()=>{mockAuth.mockResolvedValue({user:{role:'admin'}});expect((await reconcileSupplierPaymentAction('bad')).success).toBe(false);expect(mockCheck).not.toHaveBeenCalled()});
it('does not claim payment or retry from a successful read',async()=>{mockAuth.mockResolvedValue({user:{role:'admin'}});mockCheck.mockResolvedValue({reviewOnly:true,retryAllowed:false});expect(await reconcileSupplierPaymentAction('00000000-0000-4000-8000-000000000001')).toMatchObject({success:true,evidence:{reviewOnly:true,retryAllowed:false},message:'Supplier records saved for review. No payment, refund or retry was made or authorized.'})});
it('does not retry a failed read',async()=>{mockAuth.mockResolvedValue({user:{role:'admin'}});mockCheck.mockRejectedValue(Error('read unavailable'));expect(await reconcileSupplierPaymentAction('00000000-0000-4000-8000-000000000001')).toMatchObject({success:false,message:'read unavailable'});expect(mockCheck).toHaveBeenCalledTimes(1)});
