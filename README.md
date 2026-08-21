# gtm-tag-architect

A public, production-ready plugin for **Google Antigravity**, **Claude Code**, and **Cursor** that connects to Google Tag Manager via the **Model Context Protocol (MCP)**.

It provides an interactive `/setup` command that interviews developers and marketers about their site, diagnoses container defects (duplicates, missing triggers, Consent Mode v2 violations), and generates optimized tracking taxonomies and `dataLayer` contracts for both TypeScript (Next.js/React) and PHP (WordPress/Laravel/Symfony).

---

## Features

- **`/setup` Interactive Command:** Guides you through a 3-stage interview and audit workflow.
- **Deep Container Diagnostics:** Audits duplicate GA4/Meta tags, orphaned triggers, unconsented marketing pixels, and render-blocking scripts.
- **Automated Remediation:** Deduplicates tags and enforces Google Consent Mode v2 (or provides an explicit opt-out bypass for internal/US tools).
- **Multi-Framework dataLayer Contracts:** Generates typed TypeScript definitions (`dataLayer.d.ts`) or native PHP classes (`GtmDataLayer.php`) for WordPress, Laravel, Symfony, and custom backends.
- **Industry Tracking Matrices:** Pre-built taxonomy runbooks for E-Commerce, SaaS/PLG, B2B Lead Gen, and Technical Portfolios.
- **Dual-Mode MCP Server:** Runs live against Google Tag Manager REST API v2 or audits local exported container JSON files offline (Zero API setup).

---

## Documentation & Guides

- 📖 **[Complete GTM MCP Setup & Credentials Guide](./docs/mcp-setup-guide.md)**: Detailed walkthrough for obtaining Google Cloud Service Account keys, GTM container permissions, GA4 Measurement IDs, Meta Pixels, LinkedIn Insight tags, and PostHog keys.
- 🛍️ **[E-Commerce Tracking Taxonomy](./skills/setup/references/taxonomy-ecommerce.md)**
- 🚀 **[SaaS & Product Analytics Taxonomy](./skills/setup/references/taxonomy-saas.md)**
- 💼 **[Lead Generation & B2B Taxonomy](./skills/setup/references/taxonomy-leadgen.md)**
- 👨‍💻 **[Technical Portfolio & Peer Engagement Taxonomy](./skills/setup/references/taxonomy-portfolio.md)**
- 🛡️ **[Google Consent Mode v2 Reference](./skills/setup/references/consent-mode-v2.md)**

---

## Quickstart: How to Connect via MCP

### Mode 1: Offline JSON Export (Zero API Setup)
1. In GTM, go to **Admin** > **Export Container** and save as `container.json`.
2. Configure your MCP client to point to the file via `GTM_OFFLINE_CONTAINER_PATH`.

### Mode 2: Live Google Tag Manager API
1. Enable **Tag Manager API** in [Google Cloud Console](https://console.cloud.google.com/).
2. Create a Service Account, download the JSON key, and add the service account email in GTM **Admin** > **User Management** with *Read* or *Edit* permissions.
3. Set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`.

*(See the [Complete Setup Guide](./docs/mcp-setup-guide.md) for step-by-step instructions with screenshots and permission configurations.)*

---

## MCP Client Configuration

### For Google Antigravity
Clone or place this repository into your workspace or global customizations directory:

```bash
# In your project's .agents/plugins/ or ~/.gemini/config/plugins/
git clone https://github.com/jarnielcataluna/gtm-tag-architect.git
```

Antigravity will automatically discover the plugin, expose the `/setup` slash command, and register the MCP server defined in `mcp_config.json`.

### For Claude Code / Claude Desktop
Register the server in your `claude_desktop_config.json` or project MCP settings:

```json
{
  "mcpServers": {
    "gtm-tag-architect": {
      "command": "node",
      "args": ["/path/to/gtm-tag-architect/bin/gtm-mcp.js"],
      "env": {
        "GTM_OFFLINE_CONTAINER_PATH": "./fixtures/sample-ecommerce-container.json"
      }
    }
  }
}
```

### For Cursor IDE
1. Open Cursor Settings > **Features** > **MCP Servers**.
2. Click **+ Add New MCP Server**.
3. Name: `gtm-tag-architect` | Type: `command` | Command: `node /path/to/gtm-tag-architect/bin/gtm-mcp.js`

---

## Usage

### Run the `/setup` Command
Inside Antigravity or Claude Code:
```text
/setup
```

The agent will interview you about:
1. **Site Type & Industry:** E-Commerce, SaaS, Lead Gen, Content, Portfolio
2. **Framework:** Next.js/React, WordPress, Laravel, Symfony, or Vanilla PHP
3. **Required Pixels:** GA4, Meta, LinkedIn, Google Ads, PostHog
4. **Privacy Strategy:** Enforce Consent Mode v2 (Strict GDPR) vs. Opt-Out / Direct Firing

It then performs a diagnostic audit and presents you with an action menu to fix defects, apply consent rules, and export clean `dataLayer` contracts.

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
