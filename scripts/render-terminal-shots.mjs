import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const OUT_DIR = path.resolve("docs/images");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const SHOTS = [
  {
    name: "step1-discovery-interview.png",
    title: "1. /setup - Interactive Discovery & Taxonomy Interview",
    command: "agy /setup",
    lines: [
      { type: "prompt", text: "➜ dev/project-pseudo (main) $ agy /setup" },
      { type: "info", text: "🏷️  [gtm-tag-architect] Initializing interactive setup runbook..." },
      { type: "question", text: "? Select site type & primary business model:" },
      { type: "choice-active", text: "  ❯ Technical Portfolio & Peer Engagement (Reading depth, credentials, GitHub repos, telemetry)" },
      { type: "choice", text: "    E-Commerce (Cart, checkout, product impressions, dynamic remarketing)" },
      { type: "choice", text: "    SaaS / Product (Self-serve signup, subscription tiers, activation events)" },
      { type: "choice", text: "    B2B Lead Generation (Contact forms, meetings, case studies)" },
      { type: "empty", text: "" },
      { type: "question", text: "? Select platform architecture & tech stack:" },
      { type: "choice-active", text: "  ❯ Next.js 16 (App Router) + TypeScript" },
      { type: "choice", text: "    PHP (WordPress / Symfony / Laravel)" },
      { type: "choice", text: "    Static HTML / Vanilla JS" },
      { type: "empty", text: "" },
      { type: "question", text: "? Select privacy & Consent Mode strategy:" },
      { type: "choice-active", text: "  ❯ Direct / Unrestricted Firing (bypass_opt_out: tags fire immediately without CMP blocker)" },
      { type: "choice", text: "    Enforce Consent Mode v2 (Strict GDPR/EEA: default 'denied' requiring CMP consent)" },
      { type: "empty", text: "" },
      { type: "success", text: "✓ Configuration saved. Connecting to GTM container 'GTM-TZPWP67V'..." }
    ]
  },
  {
    name: "step2-diagnostic-audit.png",
    title: "2. gtm_audit_container - Deep Container Diagnostics",
    command: "npx gtm-tag-architect audit ./fixtures/sample-ecommerce-container.json",
    lines: [
      { type: "prompt", text: "➜ dev/gtm-tag-architect (master) $ npm run audit-fixture" },
      { type: "header", text: "================================================================================" },
      { type: "header", text: "🏷️  GTM TAG ARCHITECT - DIAGNOSTIC AUDIT & CONTAINER INSPECTION" },
      { type: "header", text: "================================================================================" },
      { type: "empty", text: "" },
      { type: "info", text: "[Phase 1: Initial Container Audit]" },
      { type: "metric", text: "> Container: Acme Retail Web Container (GTM-MOCK101)" },
      { type: "danger-score", text: "> Health Score: 5 / 100 [CRITICAL DEFECTS DETECTED]" },
      { type: "metric", text: "> Total Findings: 5" },
      { type: "empty", text: "" },
      { type: "critical", text: "  ✗ [CRITICAL] Duplicate GA4 Configuration Tags (G-ABC1234567)" },
      { type: "dim", text: "    Affected: GA4 - Global Site Tag, GA4 - Duplicate Config Tag" },
      { type: "dim", text: "    Impact: Duplicate pageviews and inflated session counts in analytics" },
      { type: "critical", text: "  ✗ [CRITICAL] Duplicate Meta Pixel Initialization (987654321)" },
      { type: "dim", text: "    Affected: Meta Pixel - Base Code, Meta Pixel - Extra Init on Checkout" },
      { type: "warning", text: "  ⚠ [WARNING] Orphaned Tags (No Firing Triggers)" },
      { type: "dim", text: "    Affected: Hotjar Tracking Script (Orphaned)" },
      { type: "critical", text: "  ✗ [CRITICAL] Missing Consent Mode v2 Checks on Marketing Tags" },
      { type: "dim", text: "    Affected: Meta Pixel, Hotjar Tracking Script" },
      { type: "warning", text: "  ⚠ [WARNING] Synchronous / Render-Blocking Custom HTML Tags" }
    ]
  },
  {
    name: "step3-automated-remediation.png",
    title: "3. gtm_deduplicate_tags & gtm_apply_consent_mode - Automated Remediation",
    command: "gtm-mcp apply --dedup --consent bypass_opt_out",
    lines: [
      { type: "prompt", text: "➜ dev/gtm-tag-architect (master) $ gtm-mcp apply --dedup --consent bypass_opt_out" },
      { type: "info", text: "[Phase 2: Tag Deduplication & Optimization Engine]" },
      { type: "success", text: "  ✓ Pruned 1 duplicate tags: GA4 - Duplicate Config Tag" },
      { type: "success", text: "  ✓ Consolidated firing rules into primary base: GA4 - Global Site Tag" },
      { type: "success", text: "  ✓ Applied Consent Mode Strategy: bypass_opt_out" },
      { type: "dim", text: "    Updated consent status to NOT_NEEDED across 4 marketing tags" },
      { type: "empty", text: "" },
      { type: "info", text: "[Phase 3: Post-Optimization Re-Audit]" },
      { type: "success-score", text: "> New Container Health Score: 55 / 100 (+50 points)" },
      { type: "metric", text: "> Remaining Critical Findings: 0" },
      { type: "success", text: "✓ Container graph cleaned and optimized for production deployment." }
    ]
  },
  {
    name: "step4-typed-contracts.png",
    title: "4. gtm_generate_datalayer_types - Typed Event Contracts",
    command: "gtm-mcp generate-types --industry portfolio --framework typescript",
    lines: [
      { type: "prompt", text: "➜ dev/gtm-tag-architect (master) $ gtm-mcp generate-types --industry portfolio" },
      { type: "info", text: "✓ Generated TypeScript dataLayer definitions (src/lib/analytics.ts):" },
      { type: "code", text: "export interface PortfolioTrackingEvents {" },
      { type: "code", text: "  section_viewed: { section_name: string; dwell_time_seconds?: number };" },
      { type: "code", text: "  credential_verified: { cert_title: string; verify_url: string };" },
      { type: "code", text: "  external_project_clicked: { project_name: string; destination_url: string };" },
      { type: "code", text: "  contact_form_submitted: { form_id: string; success: boolean };" },
      { type: "code", text: "  article_reading_milestone: { post_slug: string; milestone_percent: 25 | 50 | 75 | 100 };" },
      { type: "code", text: "  article_code_copied: { post_slug: string; code_language?: string };" },
      { type: "code", text: "}" },
      { type: "empty", text: "" },
      { type: "success", text: "✓ Safe for SSR. Binding frontend UI events to GTM with zero runtime type drift." }
    ]
  }
];

function buildHtml(shot) {
  const lineHtml = shot.lines
    .map((l) => {
      if (l.type === "empty") return `<div class="line">&nbsp;</div>`;
      if (l.type === "prompt")
        return `<div class="line"><span class="c-prompt">${escapeHtml(l.text)}</span></div>`;
      if (l.type === "header")
        return `<div class="line c-header">${escapeHtml(l.text)}</div>`;
      if (l.type === "info")
        return `<div class="line c-info">${escapeHtml(l.text)}</div>`;
      if (l.type === "question")
        return `<div class="line c-question font-bold">${escapeHtml(l.text)}</div>`;
      if (l.type === "choice-active")
        return `<div class="line c-choice-active font-semibold">${escapeHtml(l.text)}</div>`;
      if (l.type === "choice")
        return `<div class="line c-choice">${escapeHtml(l.text)}</div>`;
      if (l.type === "metric")
        return `<div class="line c-metric">${escapeHtml(l.text)}</div>`;
      if (l.type === "danger-score")
        return `<div class="line c-danger font-bold">${escapeHtml(l.text)}</div>`;
      if (l.type === "success-score")
        return `<div class="line c-success font-bold">${escapeHtml(l.text)}</div>`;
      if (l.type === "critical")
        return `<div class="line c-danger">${escapeHtml(l.text)}</div>`;
      if (l.type === "warning")
        return `<div class="line c-warning">${escapeHtml(l.text)}</div>`;
      if (l.type === "dim")
        return `<div class="line c-dim">${escapeHtml(l.text)}</div>`;
      if (l.type === "success")
        return `<div class="line c-success">${escapeHtml(l.text)}</div>`;
      if (l.type === "code")
        return `<div class="line c-code">${escapeHtml(l.text)}</div>`;
      return `<div class="line">${escapeHtml(l.text)}</div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: #0c0d0e;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 30px;
    font-family: 'JetBrains Mono', 'IBM Plex Mono', 'Cascadia Code', Consolas, monospace;
    color: #e6edf3;
  }
  .terminal-window {
    width: 100%;
    max-width: 1100px;
    background: #161b22;
    border: 2px solid #30363d;
    border-radius: 12px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    overflow: hidden;
  }
  .title-bar {
    background: #0d1117;
    padding: 12px 18px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #30363d;
  }
  .traffic-lights {
    display: flex;
    gap: 8px;
  }
  .dot {
    width: 13px;
    height: 13px;
    border-radius: 50%;
  }
  .dot-red { background: #ff5f56; }
  .dot-yellow { background: #ffbd2e; }
  .dot-green { background: #27c93f; }
  .window-title {
    flex: 1;
    text-align: center;
    font-size: 13px;
    color: #8b949e;
    font-weight: 500;
  }
  .terminal-body {
    padding: 24px 28px;
    font-size: 15px;
    line-height: 1.6;
  }
  .line {
    white-space: pre-wrap;
    word-break: break-all;
  }
  .c-prompt { color: #58a6ff; font-weight: 600; }
  .c-header { color: #f0883e; font-weight: bold; }
  .c-info { color: #79c0ff; }
  .c-question { color: #f0883e; }
  .c-choice-active { color: #7ee787; }
  .c-choice { color: #6e7681; }
  .c-metric { color: #d2a8ff; }
  .c-danger { color: #ff7b72; }
  .c-warning { color: #d29922; }
  .c-dim { color: #8b949e; }
  .c-success { color: #3fb950; }
  .c-code { color: #e6edf3; font-family: inherit; }
</style>
</head>
<body>
  <div class="terminal-window">
    <div class="title-bar">
      <div class="traffic-lights">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
      </div>
      <div class="window-title">${escapeHtml(shot.title)}</div>
      <div style="width: 55px;"></div>
    </div>
    <div class="terminal-body">
      ${lineHtml}
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function render() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 675 },
    deviceScaleFactor: 2,
  });

  for (const shot of SHOTS) {
    const html = buildHtml(shot);
    await page.setContent(html);
    const outPath = path.join(OUT_DIR, shot.name);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`✓ Wrote terminal screenshot: ${outPath}`);
  }

  await browser.close();
}

render().catch(console.error);
