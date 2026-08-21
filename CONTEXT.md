# gtm-tag-architect

A public Antigravity / Claude Code plugin that connects to Google Tag Manager via MCP to audit, interview, architect, and optimize web/app tagging setups.

## Core Capabilities

1. **`/setup` Interactive Command:** Guides the developer/marketer through an interview understanding site type, industry, required analytics/ad pixels, and privacy/consent requirements.
2. **Comprehensive Container Audit:** Connects via GTM MCP to inspect tags, triggers, and variables for duplicates, broken firing rules, unconsented tracking, and performance anti-patterns.
3. **Actionable Remediation & Taxonomy Builder:** Fixes audit defects, deduplicates tags, configures Consent Mode v2, and generates clean TypeScript `dataLayer.push()` contracts for engineering teams.
4. **Dual-Mode GTM MCP Server:** Runs live against Google Tag Manager REST API v2 or operates on exported container JSON files offline.
