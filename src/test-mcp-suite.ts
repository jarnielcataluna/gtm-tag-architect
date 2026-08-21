import fs from "node:fs";
import path from "node:path";
import { auditContainer } from "./gtm/audit.js";
import { deduplicateTags, applyConsentModeV2, addTagRecipe } from "./gtm/optimizer.js";
import { generateDataLayerDefinitions } from "./gtm/datalayer.js";
import { generateMarkdownReport, generateHtmlReport } from "./gtm/report.js";
import {
  GtmContainerExport,
  GtmAuditContainerInputSchema,
  GtmApplyConsentModeInputSchema,
  GtmGenerateDataLayerTypesInputSchema,
  GtmExportAuditReportInputSchema,
} from "./types/gtm.js";

console.log("================================================================================");
console.log("🧪  GTM TAG ARCHITECT - AUTOMATED INTEGRATION & COMPLIANCE TEST SUITE");
console.log("================================================================================\n");

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    failed++;
  }
}

// Test 1: Zod Schema Validation & Input Boundaries
console.log("[Test Suite 1: Strict Zod Input Validation]");
try {
  const validAuditArgs = GtmAuditContainerInputSchema.parse({ containerPath: "./fixtures/sample-ecommerce-container.json" });
  assert(validAuditArgs.containerPath === "./fixtures/sample-ecommerce-container.json", "Valid audit args parsed cleanly");
} catch {
  assert(false, "Valid audit args parsed cleanly");
}

try {
  GtmApplyConsentModeInputSchema.parse({ mode: "invalid_mode_name" as any });
  assert(false, "Invalid consent mode rejected by Zod");
} catch {
  assert(true, "Invalid consent mode rejected by Zod");
}

try {
  const phpGenArgs = GtmGenerateDataLayerTypesInputSchema.parse({ industry: "portfolio", framework: "php" });
  assert(phpGenArgs.framework === "php", "Valid framework and industry parsed cleanly");
} catch {
  assert(false, "Valid framework and industry parsed cleanly");
}

try {
  const reportArgs = GtmExportAuditReportInputSchema.parse({ format: "html" });
  assert(reportArgs.format === "html", "Valid report export args parsed cleanly");
} catch {
  assert(false, "Valid report export args parsed cleanly");
}
console.log();

// Test 2: Audit Engine Precision & Defect Heuristics
console.log("[Test Suite 2: Diagnostic Audit Engine & PII Checks]");
const samplePath = path.resolve("fixtures/sample-ecommerce-container.json");
const raw = fs.readFileSync(samplePath, "utf-8");
const sampleContainer: GtmContainerExport = JSON.parse(raw);

const auditReport = auditContainer(sampleContainer);
assert(auditReport.healthScore === 5, "Calculated expected baseline health score (5/100)");
assert(auditReport.findings.some(f => f.category === "duplicates"), "Detected duplicate GA4 tags");
assert(auditReport.findings.some(f => f.category === "consent"), "Detected missing consent mode parameters");
assert(auditReport.findings.some(f => f.category === "triggers"), "Detected orphaned tags");
assert(auditReport.findings.some(f => f.category === "performance"), "Detected synchronous blocking HTML");

// Test PII detector with a synthetic PII variable
const piiContainer: GtmContainerExport = JSON.parse(JSON.stringify(sampleContainer));
piiContainer.containerVersion.variable = [
  {
    variableId: "99",
    name: "User Email Extractor",
    type: "u",
    parameter: [{ type: "template", key: "queryKey", value: "email" }],
  },
];
const piiReport = auditContainer(piiContainer);
assert(piiReport.findings.some(f => f.id === "PRIVACY-PII-01"), "Detected sensitive PII query parameter in variables");
console.log();

// Test 3: Optimizer Engine & sGTM Recipes
console.log("[Test Suite 3: Tag Optimizer & sGTM Recipes]");
const dedupResult = deduplicateTags(sampleContainer);
assert(dedupResult.removedTags.length === 1, "Pruned duplicate GA4 configuration tag");
assert(dedupResult.consolidatedTags.length === 1, "Consolidated triggers into primary tag");

const consentOptOutResult = applyConsentModeV2(dedupResult.updatedContainer, "bypass_opt_out");
assert(consentOptOutResult.modifiedTags.length === 4, "Applied bypass_opt_out across all marketing tags");

const sgtmResult = addTagRecipe(dedupResult.updatedContainer, "sgtm_ga4_proxy", {
  measurementId: "G-PROXY12345",
  transportUrl: "https://data.clientdomain.com",
});
assert(sgtmResult.addedTag.includes("sGTM - GA4 Proxy"), "Added sGTM GA4 first-party transport proxy tag");

const testOutPath = path.resolve("fixtures/test-writeback-output.json");
fs.writeFileSync(testOutPath, JSON.stringify(sgtmResult.updatedContainer, null, 2), "utf-8");
assert(fs.existsSync(testOutPath), "Successfully wrote optimized container to disk via outputPath");
if (fs.existsSync(testOutPath)) fs.unlinkSync(testOutPath);
console.log();

// Test 4: Multi-Framework dataLayer Generators
console.log("[Test Suite 4: Multi-Framework dataLayer Generators]");
const tsCode = generateDataLayerDefinitions("portfolio", "typescript");
assert(tsCode.includes("interface PortfolioTrackingEvents"), "Generated valid TypeScript Portfolio interface");
assert(tsCode.includes("section_viewed:"), "Includes section_viewed contract");
assert(tsCode.includes("credential_verified:"), "Includes credential_verified contract");

const phpCode = generateDataLayerDefinitions("portfolio", "php");
assert(phpCode.includes("class GtmDataLayer"), "Generated native PHP GtmDataLayer class");
assert(phpCode.includes("public static function push"), "Includes static push method");
assert(phpCode.includes("public static function renderScript"), "Includes inline script renderer");
console.log();

// Test 5: Executive Report Exporters (Markdown & HTML)
console.log("[Test Suite 5: Executive Audit Report Exporters]");
const mdReport = generateMarkdownReport(auditReport);
assert(mdReport.includes("# GTM Container Audit Report"), "Generated Markdown audit report with header");
assert(mdReport.includes("Health Score:"), "Markdown report contains health score gauge");

const htmlReport = generateHtmlReport(auditReport);
assert(htmlReport.includes("<!DOCTYPE html>"), "Generated valid HTML standalone audit document");
assert(htmlReport.includes("Diagnostic Findings"), "HTML report contains styled findings section");
console.log();

console.log("================================================================================");
console.log(`🏁 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
console.log("================================================================================\n");

if (failed > 0) {
  process.exit(1);
}
