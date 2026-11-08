/** Persisted test classifications, never infer a real payment or shipment from test flags. */
export function isSimulatedOrder(order: {paymentMethod?: string | null; paymentNote?: string | null}) {
  return order.paymentMethod === 'TestPayment' || Boolean(order.paymentNote?.startsWith('QUALIFIED TEST ONLY'));
}
export function displayedOrderId(id: string) { return id; }
