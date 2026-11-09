# Hosted-default privilege correction

Based on draft PR276 head f93f4c3888137376e030f0e968a23e5e036b7b11. All flags remain off; no hosted migration or provider action.

Read-only current hosted metadata showed postgres default public-table privileges grant omnistu_app SELECT,INSERT,UPDATE,DELETE. The earlier fresh/no-ACL local migration proof did not preserve those defaults. On the actual ownership/ACL/RLS-restored schema clone, the original five migrations reproduced inherited write privileges on quote evidence, reviewed fee evidence and immutable plan tables. The application runtime guard would reject that configuration, but the migrations were not safe to apply as-is. No hosted migration was performed before discovering this.

The new final migration narrows only the seven newly introduced commercial tables. It removes table and column rights for PUBLIC, anonymous/authenticated API roles and the existing backend role, then reapplies only the intended backend rights. It does not change existing core tables, memberships, role LOGIN/ownership/default privileges or activation. Reviewed terms and quotes stay read-only; offer quantity can change but publication/snapshot cannot; plan insertion is allowed but rewriting/deletion is not; durable supplier attempts cannot be erased.

A regression injects inherited table and column grants, applies the fix twice, verifies exact permitted and refused operations and unchanged core Order ACL. An actual hosted backup was restored with the original core owners, ACLs and RLS, plus relevant default privileges. All five migrations reproduced the defect and the new correction removed it; all original core owner/ACL/RLS values and original table/column row projections stayed equal. This is a clone, not a production action. Global passwords and arbitrary role memberships are not copied; role placeholders have no remote access.

Source/clone proofs do not qualify real provider reconciliation, merchant eligibility, customer offers or commercial release. 0/18 products remain commercially qualified,210variants HOLD.
