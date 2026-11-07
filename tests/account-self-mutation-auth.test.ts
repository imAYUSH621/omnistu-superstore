jest.mock('@/auth', () => ({auth:jest.fn(),signIn:jest.fn(),signOut:jest.fn()}));


jest.mock('@/lib/payment-capabilities',()=>({isPaymentMethodAvailable:()=>true}));
const lookup=jest.fn(),update=jest.fn();
jest.mock('@/db/prisma',()=>({prisma:{user:{findFirst:(...a:unknown[])=>lookup(...a),update:(...a:unknown[])=>update(...a)}}}));
import {auth} from '@/auth';
import {updateProfile,updateUserAddress,updateUserPaymentMethod} from '@/lib/actions/user.actions';
const mutations=[
 ()=>updateProfile({name:'New name',email:'ignored@example.invalid'}),
 ()=>updateUserAddress({fullName:'Local fixture',streetAddress:'1 Sample St',city:'Sample',postalCode:'10001',country:'US'}),
 ()=>updateUserPaymentMethod({type:'TestPayment'}),
];
beforeEach(()=>{lookup.mockReset();update.mockReset();lookup.mockResolvedValue({id:'first-other-account'});update.mockResolvedValue({});});
test.each([null,{}, {user:{}}, {user:{id:''}}].flatMap(session=>mutations.map((mutate,index)=>({session,mutate,index}))))('missing authenticated identity $session refuses mutation $index before lookup',async ({session,mutate})=>{
 (auth as jest.Mock).mockResolvedValue(session);
 expect(await mutate()).toMatchObject({success:false});
 expect(lookup).not.toHaveBeenCalled();expect(update).not.toHaveBeenCalled();
});
test.each(mutations.map((mutate,index)=>({mutate,index})))('signed-in mutation $index is scoped to the session owner',async({mutate})=>{
 (auth as jest.Mock).mockResolvedValue({user:{id:'owner'}});lookup.mockResolvedValue({id:'owner'});
 expect(await mutate()).toMatchObject({success:true});
 expect(lookup).toHaveBeenCalledWith({where:{id:'owner'}});
 expect(update).toHaveBeenCalledWith(expect.objectContaining({where:{id:'owner'}}));
});
test.each(mutations.map((mutate,index)=>({mutate,index})))('missing stored owner refuses mutation $index',async({mutate})=>{
 (auth as jest.Mock).mockResolvedValue({user:{id:'deleted-owner'}});lookup.mockResolvedValue(null);
 expect(await mutate()).toMatchObject({success:false});expect(update).not.toHaveBeenCalled();
});
