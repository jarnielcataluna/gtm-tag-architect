# SaaS & Product Analytics Taxonomy Reference

Event taxonomy for subscription apps, product-led growth (PLG), and self-serve onboarding.

## Event Sequence

1. `page_view` - Visitor lands on marketing pages.
2. `view_pricing` - Interacts with pricing table or feature comparison.
3. `start_trial` - Initiates free trial or onboarding flow.
4. `sign_up` - Account created (parameters: `method: 'google' | 'email' | 'sso'`).
5. `onboarding_completed` - Completes initial setup checklist.
6. `feature_used` - Key value moments (e.g. `module: 'export'`, `feature: 'ai_generator'`).
7. `subscription_activated` - Enters paid plan (`plan_name`, `billing_cycle`, `value`).

## Golden Rules
- Never push raw PII (emails, phone numbers, cleartext passwords) into dataLayer or analytics parameters.
- Use hashed internal IDs (`user_id_hashed`) for user cross-device attribution.
