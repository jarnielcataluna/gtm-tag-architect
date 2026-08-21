# GTM Tagging & Governance Rules

When configuring Google Tag Manager containers or writing event tracking code:

1. **Strict dataLayer Schema:** Always push structured events matching standard GA4 or Meta schemas. Never push nested arbitrary objects that pollute the global dataLayer namespace.
2. **Ecommerce Object Cleansing:** Always clear the `ecommerce` property (`window.dataLayer.push({ ecommerce: null })`) before pushing any ecommerce event to avoid attribute bleeding between views.
3. **No PII in Tracking:** Never push raw email addresses, phone numbers, passwords, or government IDs into dataLayer or tag parameters. Always hash values using SHA-256 before transmission.
4. **Consent Mode v2 Compliance:** Ensure all advertising and analytics tags have explicit consent requirements mapped to `ad_storage`, `ad_user_data`, `ad_personalization`, or `analytics_storage`.
5. **Non-Blocking Tags:** Never use `document.write` or synchronous blocking scripts in Custom HTML tags. All third-party pixels must load with `async` attributes.
