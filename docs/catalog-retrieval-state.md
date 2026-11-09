# Assistant catalog retrieval state

Public automated Store help now consumes a structured available/unavailable product result and the existing category availability envelope. A failed read no longer becomes a false no-match or no-category answer. Six language failure messages state that no stock, price or order was confirmed and offer existing search/contact routes. Confirmed empty and confirmed matches remain distinct. Known category display names reuse the existing locale map, retaining original product facts and links.

The legacy string findProducts wrapper remains compatible for dormant model/test consumers. No provider is activated, no private order is retrieved, no enquiry is saved and no outside model receives data. This is a public deterministic retrieval reliability fix, not semantic RAG, broad language understanding or model production readiness.

Unit qualification exercises the actual product retrieval with a mocked failing database boundary and the existing category envelope, successful recovery, original link/price and all six localized branches. Hosted healthy public empty and existing-isolated positive retrieval checks are separate. No production outage is induced to prove a failure message.
