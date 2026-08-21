# E-Commerce Tracking Taxonomy Reference

Standard GA4 & Meta Pixel event mapping for online retail and checkout funnels.

## Event Sequence

1. `view_item_list` - Viewing product catalog, category grid, or recommendations.
2. `select_item` - Clicking a product card in a list.
3. `view_item` - Landing on product detail page (PDP).
4. `add_to_cart` - Adding product to cart.
5. `view_cart` - Visiting cart drawer or page.
6. `begin_checkout` - Stepping into checkout initiation.
7. `add_shipping_info` - Entering shipping tier.
8. `add_payment_info` - Selecting payment gateway.
9. `purchase` - Order confirmation & settlement.

## Golden Rules
- Always clear the `ecommerce` object before pushing a new ecommerce event (`window.dataLayer.push({ ecommerce: null })`).
- `items` array must include `item_id`, `item_name`, and `price` (number format, not string with currency symbols).
- `currency` (ISO 4217, e.g. `USD`, `PHP`) and `value` must match the transaction total.
