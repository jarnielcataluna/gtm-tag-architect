# gtm-tag-architect

A public, production-ready plugin for **Google Antigravity** and **Claude Code** that connects to Google Tag Manager via MCP.

It provides an interactive `/setup` command that interviews developers/marketers about their site, diagnoses container defects (duplicates, missing triggers, Consent Mode v2 violations), and generates optimized tracking taxonomies and `dataLayer` contracts.

---

## Features

- **`/setup` Interactive Command:** Guides you through a 3-stage interview and audit workflow.
- **Deep Container Diagnostics:** Audits duplicate GA4/Meta tags, orphaned triggers, unconsented marketing pixels, and render-blocking scripts.
- **Automated Remediation:** Deduplicates tags and enforces Google Consent Mode v2 across all tags.
- **Industry Tracking Matrices:** Pre-built taxonomy runbooks for E-Commerce, SaaS/PLG, and B2B Lead Gen.
- **Developer `dataLayer.d.ts` Generator:** Generates typed event contracts and helper push functions for React, Next.js, and vanilla apps.
- **Dual-Mode MCP Server:** Runs live against Google Tag Manager REST API v2 or audits local exported container JSON files offline.

---

## Installation & Setup

### For Google Antigravity
Clone or place this repository into your workspace or global customizations directory:

```bash
# In your project's .agents/plugins/ or ~/.gemini/config/plugins/
git clone https://github.com/jarnielcataluna/gtm-tag-architect.git
```

Antigravity will automatically discover the plugin, expose the `/setup` slash command, and register the MCP server defined in `mcp_config.json`.

### For Claude Code / Standalone MCP
Register the server in your `claude_desktop_config.json` or project MCP settings:

```json
{
  "mcpServers": {
    "gtm-tag-architect": {
      "command": "node",
      "args": ["/path/to/gtm-tag-architect/bin/gtm-mcp.js"]
    }
  }
}
```

---

## Usage

### Run the `/setup` Command
Inside Antigravity or Claude Code:
```text
/setup
```

The agent will interview you about:
1. Site Type & Industry (E-Commerce, SaaS, Lead Gen, Content)
2. Required Pixels (GA4, Meta, LinkedIn, Google Ads, PostHog)
3. Privacy Requirements (GDPR / Consent Mode v2)

It then performs a diagnostic audit and presents you with an action menu to fix defects, apply consent rules, or export a clean `dataLayer.d.ts`.

---

## Testing & Local Audit

You can run the offline diagnostic test harness against the included test fixture:

```bash
npm install
npm run audit-fixture
```

---

## License
MIT
