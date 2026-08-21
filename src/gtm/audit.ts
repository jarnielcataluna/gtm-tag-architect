import { GtmContainerExport, AuditFinding, AuditReport } from "../types/gtm.js";

export function auditContainer(container: GtmContainerExport): AuditReport {
  const version = container.containerVersion;
  const tags = version.tag || [];
  const triggers = version.trigger || [];
  const variables = version.variable || [];

  const findings: AuditFinding[] = [];
  const passedAudits: string[] = [];

  const triggerIdSet = new Set(triggers.map((t) => t.triggerId));

  // 1. Audit Duplicate Tags & Measurement IDs
  const ga4ConfigMap = new Map<string, string[]>();
  const metaPixelMap = new Map<string, string[]>();

  for (const tag of tags) {
    if (tag.paused) continue;

    // GA4 Configuration Tags (type: 'googtag' or 'gaawc')
    if (tag.type === "googtag" || tag.type === "gaawc") {
      const tagIdParam = tag.parameter?.find((p) => p.key === "tagId" || p.key === "measurementId")?.value;
      if (tagIdParam) {
        const existing = ga4ConfigMap.get(tagIdParam) || [];
        existing.push(tag.name);
        ga4ConfigMap.set(tagIdParam, existing);
      }
    }

    // Custom HTML Meta Pixels or standard templates
    if (tag.type === "html") {
      const htmlContent = tag.parameter?.find((p) => p.key === "html")?.value || "";
      const pixelMatch = htmlContent.match(/fbq\(['"]init['"],\s*['"](\d+)['"]/);
      if (pixelMatch) {
        const pixelId = pixelMatch[1];
        const existing = metaPixelMap.get(pixelId) || [];
        existing.push(tag.name);
        metaPixelMap.set(pixelId, existing);
      }
    }
  }

  for (const [measurementId, tagNames] of ga4ConfigMap.entries()) {
    if (tagNames.length > 1) {
      findings.push({
        id: "DUP-GA4-01",
        category: "duplicates",
        title: `Duplicate GA4 Configuration Tags (${measurementId})`,
        description: `Found ${tagNames.length} separate GA4 tags initialized with the identical measurement ID '${measurementId}'. This can cause double-counted pageviews and skewed session durations.`,
        affectedEntities: tagNames,
        severity: "critical",
        recommendation: `Consolidate into a single Google Tag / GA4 Configuration tag and trigger it on 'Initialization - All Pages'.`,
      });
    }
  }

  for (const [pixelId, tagNames] of metaPixelMap.entries()) {
    if (tagNames.length > 1) {
      findings.push({
        id: "DUP-META-01",
        category: "duplicates",
        title: `Duplicate Meta Pixel Initialization (${pixelId})`,
        description: `Found ${tagNames.length} tags initializing Meta Pixel '${pixelId}'. Duplicate 'init' calls inflate PageView event counts.`,
        affectedEntities: tagNames,
        severity: "critical",
        recommendation: `Prune duplicate Base Code tags and use Custom Event tags referencing a single base pixel.`,
      });
    }
  }

  if (findings.filter((f) => f.category === "duplicates").length === 0) {
    passedAudits.push("No duplicate GA4 or Meta Pixel configurations detected.");
  }

  // 2. Audit Missing Firing Triggers
  const unattachedTags: string[] = [];
  for (const tag of tags) {
    if (!tag.paused && (!tag.firingTriggerId || tag.firingTriggerId.length === 0)) {
      unattachedTags.push(tag.name);
    }
  }

  if (unattachedTags.length > 0) {
    findings.push({
      id: "TRIG-ORPHAN-01",
      category: "triggers",
      title: "Orphaned Tags (No Firing Triggers)",
      description: `${unattachedTags.length} active tags have no firing triggers assigned and will never execute.`,
      affectedEntities: unattachedTags,
      severity: "warning",
      recommendation: "Assign valid event/pageview triggers or pause/delete the unattached tags.",
    });
  } else {
    passedAudits.push("All active tags have at least one firing trigger.");
  }

  // 3. Audit Consent Mode v2 Compliance
  const unconsentedMarketingTags: string[] = [];
  for (const tag of tags) {
    if (tag.paused) continue;
    const isMarketing =
      tag.type === "html" ||
      tag.name.toLowerCase().includes("meta") ||
      tag.name.toLowerCase().includes("facebook") ||
      tag.name.toLowerCase().includes("tiktok") ||
      tag.name.toLowerCase().includes("linkedin") ||
      tag.name.toLowerCase().includes("hotjar");

    if (isMarketing) {
      const consentStatus = tag.consentSettings?.consentStatus;
      if (!consentStatus || consentStatus === "NOT_SET") {
        unconsentedMarketingTags.push(tag.name);
      }
    }
  }

  if (unconsentedMarketingTags.length > 0) {
    findings.push({
      id: "PRIVACY-CONSENT-01",
      category: "consent",
      title: "Missing Consent Mode v2 Checks on Marketing Tags",
      description: `${unconsentedMarketingTags.length} marketing/advertising tags have no explicit consent configuration (ad_storage, analytics_storage). They may fire prior to user consent.`,
      affectedEntities: unconsentedMarketingTags,
      severity: "critical",
      recommendation: "Configure explicit consent checks ('Require additional consent') for ad_storage and analytics_storage or implement a CMP template.",
    });
  } else {
    passedAudits.push("Consent Mode v2 settings configured on all marketing tags.");
  }

  // 4. Audit Performance & Core Web Vitals (TBT/LCP)
  const synchronousBlockingCustomHtml: string[] = [];
  for (const tag of tags) {
    if (tag.type === "html" && !tag.paused) {
      const html = tag.parameter?.find((p) => p.key === "html")?.value || "";
      if (html.includes("document.write") || (html.includes("<script") && !html.includes("async") && !html.includes("defer"))) {
        synchronousBlockingCustomHtml.push(tag.name);
      }
    }
  }

  if (synchronousBlockingCustomHtml.length > 0) {
    findings.push({
      id: "PERF-BLOCKING-01",
      category: "performance",
      title: "Synchronous / Render-Blocking Custom HTML Tags",
      description: `${synchronousBlockingCustomHtml.length} Custom HTML tags execute without 'async' or 'defer' or utilize document.write, degrading Total Blocking Time (TBT).`,
      affectedEntities: synchronousBlockingCustomHtml,
      severity: "warning",
      recommendation: "Ensure all external scripts include `async` or convert to community verified GTM templates.",
    });
  } else {
    passedAudits.push("No render-blocking document.write or synchronous scripts detected.");
  }

  // Calculate Health Score
  let score = 100;
  for (const finding of findings) {
    if (finding.severity === "critical") score -= 25;
    else if (finding.severity === "warning") score -= 10;
    else score -= 5;
  }
  score = Math.max(0, score);

  return {
    containerName: version.container?.name || "Unknown Container",
    publicId: version.container?.publicId || "GTM-XXXXXX",
    totalTags: tags.length,
    totalTriggers: triggers.length,
    totalVariables: variables.length,
    healthScore: score,
    findings,
    passedAudits,
  };
}
