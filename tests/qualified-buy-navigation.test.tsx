import type {ReactElement} from 'react';
const state=jest.fn(),push=jest.fn(),refresh=jest.fn(),add=jest.fn();
jest.mock('react',()=>({...jest.requireActual('react'),useState:(v:unknown)=>state(v),useTransition:()=>[false,(fn:()=>Promise<void>)=>fn()]}));
jest.mock('next/navigation',()=>({useRouter:()=>({push,refresh})}));
jest.mock('@/lib/actions/qualified-retail.actions',()=>({addQualifiedCartAction:(v:unknown)=>add(v)}));
import BuyBox from '@/components/shared/retail/qualified-buy-box';
const option={lineKey:'line',snapshotId:'snapshot',variantId:'variant',label:'Brown / L',price:'10.00',maxQty:2};
function button(node:unknown):ReactElement<{onClick:()=>Promise<void>}>|undefined {if(!node||typeof node!=='object')return;const e=node as ReactElement<{onClick?:()=>Promise<void>;children?:unknown}>;if(e.props?.onClick)return e as ReactElement<{onClick:()=>Promise<void>}>;for(const child of [e.props?.children].flat(4)){const found=button(child);if(found)return found}}
beforeEach(()=>{jest.clearAllMocks();state.mockReturnValueOnce(['line',jest.fn()]).mockReturnValueOnce([1,jest.fn()]).mockReturnValueOnce(['',jest.fn()]);});
it('successful add navigates once without racing an extra current-page refresh',async()=>{add.mockResolvedValue({success:true,message:'Added'});const tree=BuyBox({signedIn:true,options:[option]});await button(tree)!.props.onClick();expect(add).toHaveBeenCalledWith({lineKey:'line',snapshotId:'snapshot',qty:1});expect(push).toHaveBeenCalledTimes(1);expect(push).toHaveBeenCalledWith('/cart');expect(refresh).not.toHaveBeenCalled()});
it('refused add stays on the product without refreshing or navigating',async()=>{add.mockResolvedValue({success:false,message:'Review again'});await button(BuyBox({signedIn:true,options:[option]}))!.props.onClick();expect(push).not.toHaveBeenCalled();expect(refresh).not.toHaveBeenCalled()});
