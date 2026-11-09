# Shopping workflow knowledge for automated Store help

The public assistant previously treated new-checkout questions containing "order" as order tracking, and cart/address questions as catalog searches. Three source-mapped knowledge entries now explain the existing cart, new shipping address and checkout review paths in six languages. Checkout answers add the current closed/test/payment-capability disclosure. They do not imply that a guest can bypass sign-in or that unavailable methods are enabled.

Policy restrictions keep priority. Explicit tracking/status questions retain order-status guidance, including the German Bestellstatus term. Address guidance states that editing checkout does not edit an existing order. No saved address, cart contents, private order, support ticket or payment is read or changed. Product search remains the fallback for product queries. No semantic model, new service or provider activation is added.

Source paths point to existing Store pages, whose runtime guards remain authoritative. A cart does not reserve stock or guarantee price. Saving an address does not confirm shipping availability/cost/dates. The assistant explains where to review a checkout, not how to complete an unauthorized purchase. No purchase, address or order action is run by these answers.

Unit tests cover six-language retrieval, policy/status priority, closed-vs-simulation disclosure, route existence and no product/private-state lookup on help branches. Hosted API checks and actual chat/UI screenshots qualify those explanations separately from completing checkout. This is bounded rule-based knowledge retrieval, not full semantic RAG or live-model readiness.
