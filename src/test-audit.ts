import fs from "fs/promises";
import path from "path";
import { auditContainer } from "./gtm/audit.js";
import { deduplicateTags, applyConsentModeV2 } from "./gtm/optimizer.js";
import { generateDataLayerDefinitions } from "./gtm/datalayer.js";
import { GtmContainerExport } from "./types/gtm.js";

async function main() {
  console.log("================================================================================");
  console.log("🏷️  GTM TAG ARCHITECT - DIAGNOSTIC AUDIT & OPTIMIZATION TEST");
  console.log("================================================================================\n");

  const fixturePath = path.resolve(process.cwd(), "fixtures/sample-ecommerce-container.json");
  const raw = await fs.readFile(fixturePath, "utf-8");
  const container = JSON.parse(raw) as GtmContainerExport;

  console.log(`[Phase 1: Initial Container Audit]`);
  const initialAudit = auditContainer(container);
  console.log(`> Container: ${initialAudit.containerName} (${initialAudit.publicId})`);
  console.log(`> Health Score: ${initialAudit.healthScore}/100`);
  console.log(`> Findings: ${initialAudit.findings.length}`);
  for (const f of initialAudit.findings) {
    console.log(`  - [${f.severity.toUpperCase()}] ${f.title}`);
    console.log(`    Affected: ${f.affectedEntities.join(", ")}`);
    console.log(`    Recommendation: ${f.recommendation}`);
  }
  console.log();

  console.log(`[Phase 2: Tag Deduplication & Consent Mode v2 Optimization]`);
  const dedupResult = deduplicateTags(container);
  console.log(`  ✓ Pruned ${dedupResult.removedTags.length} duplicate tags: ${dedupResult.removedTags.join(", ")}`);
  console.log(`  ✓ Consolidated into: ${dedupResult.consolidatedTags.join(", ")}`);

  const consentResult = applyConsentModeV2(dedupResult.updatedContainer, "denied");
  console.log(`  ✓ Applied Consent Mode v2 to ${consentResult.modifiedTags.length} tags: ${consentResult.modifiedTags.join(", ")}`);
  console.log();

  console.log(`[Phase 3: Post-Optimization Re-Audit]`);
  const postAudit = auditContainer(consentResult.updatedContainer);
  console.log(`> New Health Score: ${postAudit.healthScore}/100`);
  console.log(`> Remaining Critical Findings: ${postAudit.findings.filter(f => f.severity === 'critical').length}`);
  console.log();

  console.log(`[Phase 4: Generated TypeScript dataLayer Contract]`);
  const types = generateDataLayerDefinitions("ecommerce");
  console.log("--------------------------------------------------------------------------------");
  console.log(types.slice(0, 480) + "\n... [truncated]");
  console.log("--------------------------------------------------------------------------------\n");

  console.log("✅ Diagnostic audit and optimization completed successfully.");
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
