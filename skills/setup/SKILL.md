---
name: setup
description: >-
  Interactive setup, audit, and architecture runbook for Google Tag Manager containers.
  Use when the user types /setup or asks to audit, architect, deduplicate, or configure
  tracking tags, Consent Mode v2, and dataLayer events for their website or app.
---

# GTM Tag Architect: `/setup` Runbook

Follow this 3-stage interactive workflow to interview the user, audit their GTM container via MCP, resolve tag defects, and generate clean tracking architecture.

---

## Stage 1: Discovery & Taxonomy Interview

Ask the user these 4 targeted questions (or infer from repository context if already available):

1. **Website / App Type & Industry:**
   - E-Commerce (Shopify, WooCommerce, Custom Storefront)
   - SaaS / Product App (Self-serve signup, subscription tiers)
   - B2B / Lead Generation (Contact forms, case studies, meeting booking)
   - Content / Media / Portfolio (Articles, newsletter, reading depth)
2. **Platform & Tech Stack:**
   - Framework (Next.js App Router, React, Vue, WordPress, Static HTML)
   - Server-Side vs Client-Side rendering
3. **Required Tracking & Ad Pixels:**
   - Google Analytics 4 (GA4)
   - Meta Pixel & CAPI
   - Google Ads (Conversions & Enhanced Conversions)
   - LinkedIn Insight Tag / TikTok Pixel / PostHog / Hotjar
4. **Privacy & Regulatory Compliance:**
   - European Union / GDPR (Requires Google Consent Mode v2 default `denied`)
   - US / CCPA or Global Standard

---

## Stage 2: Container Ingestion & Deep Audit

Call the MCP tool `gtm_audit_container`:
- If connected to live Google Tag Manager, fetch the active workspace.
- If in offline mode, pass the local container export JSON path.

### Audit Inspection Checklist:
1. **Duplicate Initializations:** Multiple GA4 measurement IDs or Meta Pixel `init` calls inflating metrics.
2. **Missing Firing Triggers:** Active tags with zero triggers that waste container payload.
3. **Consent Mode v2 Compliance:** Marketing pixels firing without `ad_storage` or `ad_user_data` consent requirements.
4. **Render-Blocking HTML:** Custom HTML scripts missing `async`/`defer` or using `document.write`.

Present the **Health Score (0-100)** and a clear table of Critical vs Warning findings.

---

## Stage 3: Interactive Action Menu

Present the user with recommended actions based on the audit findings:

1. **`[Option 1]` Fix Audit Defects & Deduplicate:**
   - Call `gtm_deduplicate_tags` to prune redundant base tags and consolidate triggers.
   - Call `gtm_apply_consent_mode` to enforce Consent Mode v2 on all marketing tags.
2. **`[Option 2]` Implement Missing Industry Tracking Recipes:**
   - Call `gtm_add_tag_recipe` to add standard GA4 enhanced measurement or conversion tags.
3. **`[Option 3]` Generate Developer `dataLayer.d.ts` Contract:**
   - Call `gtm_generate_datalayer_types` with the selected industry taxonomy.
   - Deliver production-ready TypeScript types and `pushGtmEvent()` helpers.
4. **`[Option 4]` Export & Deploy:**
   - Export the optimized container JSON ready for GTM import (`Admin > Import Container`).

---

## Reference Guides

- [E-Commerce Tracking Taxonomy](./references/taxonomy-ecommerce.md)
- [SaaS & Product Tracking Taxonomy](./references/taxonomy-saas.md)
- [Lead Generation Taxonomy](./references/taxonomy-leadgen.md)
- [Consent Mode v2 Implementation](./references/consent-mode-v2.md)
