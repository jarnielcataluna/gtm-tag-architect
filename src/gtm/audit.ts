import { GtmContainerExport, AuditFinding, AuditReport } from "../types/gtm.js";

const MARKETING_VENDOR_KEYWORDS = [
  "meta",
  "facebook",
  "tiktok",
  "linkedin",
  "pinterest",
  "twitter",
  "snapchat",
  "criteo",
  "bing",
  "clarity",
  "hotjar",
  "crazyegg",
  "klaviyo",
  "hubspot",
  "quora",
  "reddit",
];

const PII_KEYWORDS = [
  "email",
  "e-mail",
  "phone",
  "mobile",
  "ssn",
  "password",
  "pwd",
  "pass",
  "creditcard",
  "cardnumber",
  "cvv",
  "first_name",
  "last_name",
  "address",
  "zipcode",
];

export function auditContainer(container: GtmContainerExport): AuditReport {
  const version = container.containerVersion;
  const tags = version.tag || [];
  const triggers = version.trigger || [];
  const variables = version.variable || [];

  const findings: AuditFinding[] = [];
  const passedAudits: string[] = [];

  const triggerMap = new Map(triggers.map((t) => [t.triggerId, t]));

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

  // 2. Audit Missing Firing Triggers (Orphaned Tags)
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
    const tagNameLower = tag.name.toLowerCase();
    const isMarketing =
      tag.type === "html" ||
      tag.type.startsWith("__cvt_") ||
      MARKETING_VENDOR_KEYWORDS.some((kw) => tagNameLower.includes(kw));

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

  // 4. Audit PII (Personally Identifiable Information) Exposure in Variables
  const exposedPiiEntities: string[] = [];
  for (const v of variables) {
    const varNameLower = v.name.toLowerCase();
    const queryKeyParam = v.parameter?.find((p) => p.key === "queryKey" || p.key === "name")?.value;
    const queryKeyLower = typeof queryKeyParam === "string" ? queryKeyParam.toLowerCase() : "";

    const hasPiiPattern = PII_KEYWORDS.some(
      (pii) => varNameLower.includes(pii) || queryKeyLower.includes(pii)
    );

    if (hasPiiPattern) {
      exposedPiiEntities.push(v.name);
    }
  }

  if (exposedPiiEntities.length > 0) {
    findings.push({
      id: "PRIVACY-PII-01",
      category: "security",
      title: "Potential PII (Personally Identifiable Information) Exposure in Variables",
      description: `${exposedPiiEntities.length} variables capture sensitive fields (email, phone, password, address). Sending raw PII to Google Analytics or third-party ad networks violates GDPR/CCPA and GA terms of service.`,
      affectedEntities: exposedPiiEntities,
      severity: "critical",
      recommendation: "Hash identifiers using SHA-256 before transmission or use Google Analytics native data redaction / sGTM redaction gateways.",
    });
  } else {
    passedAudits.push("No unhashed PII variable capture patterns detected in variables.");
  }

  // 5. Audit Tag Firing Sequencing & Race Conditions
  const raceConditionTags: string[] = [];
  for (const tag of tags) {
    if (tag.paused || tag.type !== "gaawe") continue; // GA4 Event tag
    if (!tag.firingTriggerId) continue;

    for (const triggerId of tag.firingTriggerId) {
      const trigger = triggerMap.get(triggerId);
      if (trigger && (trigger.type === "PAGEVIEW" || trigger.type === "DOM_READY")) {
        // If firing on initial pageview before base tag initializes without sequencing
        if (trigger.name.toLowerCase().includes("all pages") || trigger.name.toLowerCase().includes("initialization")) {
          raceConditionTags.push(tag.name);
        }
      }
    }
  }

  if (raceConditionTags.length > 0) {
    findings.push({
      id: "SEQ-RACE-01",
      category: "triggers",
      title: "Potential Tag Sequencing Race Condition",
      description: `${raceConditionTags.length} GA4 Event tags are attached directly to early Pageview triggers. If an event tag executes before the base Google Tag initializes, parameters may fail to attach.`,
      affectedEntities: raceConditionTags,
      severity: "warning",
      recommendation: "Ensure base Google Tag fires on 'Initialization - All Pages' or configure Tag Sequencing ('Fire a tag before this tag fires').",
    });
  } else {
    passedAudits.push("No tag sequencing race conditions detected.");
  }

  // 6. Audit Performance & Core Web Vitals (TBT/LCP)
  const synchronousBlockingCustomHtml: string[] = [];
  for (const tag of tags) {
    if (tag.type === "html" && !tag.paused) {
      const html = tag.parameter?.find((p) => p.key === "html")?.value || "";
      if (
        html.includes("document.write") ||
        (html.includes("<script") && !html.includes("async") && !html.includes("defer"))
      ) {
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
