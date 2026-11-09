import type {SupplierOrderPlan} from './supplier-order-plan';
/** Pure provider projection. No slug, Store UUID, default SKU, default origin,
 * or guessed delivery line can choose a supplier product. Unsupported providers
 * and incomplete source modes require review instead of routing elsewhere. */
export function cjPayloadFromSupplierPlan(plan:SupplierOrderPlan){
 if(!plan.lines.length||plan.lines.some(l=>l.snapshot.provider!=='CJ'))throw Error('Unsupported supplier plan');
 const first=plan.lines[0].snapshot;
 const managed=first.version===2&&first.cjShippingMode===2;
 if(managed){if(process.env.CJ_MANAGED_ORIGIN_CHECKOUT_ENABLED!=='true')throw Error('CJ-managed origin checkout is OFF');if(first.warehouseId!==undefined||!first.originCountry||!first.managedOrigin)throw Error('Approved managed-origin source evidence required');}
 else if(!first.originCountry||first.cjShippingMode!==1||!first.warehouseId)throw Error('Exact warehouse requires approved CJ platform-logistics mode1');
 if(plan.lines.some(l=>l.snapshot.version!==first.version||l.snapshot.managedOrigin?.assignment!==first.managedOrigin?.assignment||l.snapshot.originCountry!==first.originCountry||l.snapshot.warehouseId!==first.warehouseId||l.snapshot.shippingMethod!==first.shippingMethod||l.snapshot.cjShippingMode!==first.cjShippingMode))throw Error('Separate supplier shipments need explicit reviewed split');
 const a=plan.address;
 return {orderNumber:plan.orderId,shippingZip:a.postalCode,shippingCountry:a.country,shippingCountryCode:a.country,shippingProvince:a.state,shippingCity:a.city,shippingPhone:a.phone,shippingCustomerName:a.fullName,shippingAddress:a.streetAddress,fromCountryCode:first.originCountry,logisticName:first.shippingMethod,shopLogisticsType:first.cjShippingMode,...(first.cjShippingMode===1?{storageId:first.warehouseId}:{}),payType:3,orderFlow:1,products:plan.lines.map(l=>({vid:l.snapshot.providerVariantId,quantity:l.qty,storeLineItemId:l.lineKey}))};
}
