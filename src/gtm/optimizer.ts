import { GtmContainerExport, GtmTag, GtmTrigger } from "../types/gtm.js";

export function deduplicateTags(container: GtmContainerExport): {
  updatedContainer: GtmContainerExport;
  removedTags: string[];
  consolidatedTags: string[];
} {
  const version = JSON.parse(JSON.stringify(container.containerVersion));
  const tags: GtmTag[] = version.tag || [];
  const removedTags: string[] = [];
  const consolidatedTags: string[] = [];

  const seenGA4 = new Map<string, GtmTag>();
  const filteredTags: GtmTag[] = [];

  for (const tag of tags) {
    if (tag.type === "googtag" || tag.type === "gaawc") {
      const tagIdParam = tag.parameter?.find((p) => p.key === "tagId" || p.key === "measurementId")?.value;
      if (tagIdParam) {
        if (seenGA4.has(tagIdParam)) {
          // Merge triggers if needed and remove duplicate
          const primaryTag = seenGA4.get(tagIdParam)!;
          const mergedTriggers = Array.from(
            new Set([...(primaryTag.firingTriggerId || []), ...(tag.firingTriggerId || [])])
          );
          primaryTag.firingTriggerId = mergedTriggers;
          removedTags.push(tag.name);
          consolidatedTags.push(primaryTag.name);
          continue;
        } else {
          seenGA4.set(tagIdParam, tag);
        }
      }
    }
    filteredTags.push(tag);
  }

  version.tag = filteredTags;

  return {
    updatedContainer: {
      ...container,
      containerVersion: version,
    },
    removedTags,
    consolidatedTags: Array.from(new Set(consolidatedTags)),
  };
}

export function applyConsentModeV2(
  container: GtmContainerExport,
  mode: "enforce_denied" | "enforce_granted" | "bypass_opt_out" = "enforce_denied"
): {
  updatedContainer: GtmContainerExport;
  modifiedTags: string[];
} {
  const version = JSON.parse(JSON.stringify(container.containerVersion));
  const tags: GtmTag[] = version.tag || [];
  const modifiedTags: string[] = [];

  for (const tag of tags) {
    if (mode === "bypass_opt_out") {
      // Opt-out mode: Remove consent gating so tags fire unconditionally
      tag.consentSettings = {
        consentStatus: "NOT_NEEDED",
        consentType: [],
      };
      modifiedTags.push(tag.name);
      continue;
    }

    const isMarketing =
      tag.type === "html" ||
      tag.name.toLowerCase().includes("meta") ||
      tag.name.toLowerCase().includes("facebook") ||
      tag.name.toLowerCase().includes("tiktok") ||
      tag.name.toLowerCase().includes("linkedin");

    const isAnalytics =
      tag.type === "googtag" ||
      tag.type === "gaawc" ||
      tag.name.toLowerCase().includes("ga4") ||
      tag.name.toLowerCase().includes("posthog") ||
      tag.name.toLowerCase().includes("hotjar");

    if (isMarketing) {
      tag.consentSettings = {
        consentStatus: "NEEDED",
        consentType: ["ad_storage", "ad_user_data", "ad_personalization"],
      };
      modifiedTags.push(tag.name);
    } else if (isAnalytics) {
      tag.consentSettings = {
        consentStatus: "NEEDED",
        consentType: ["analytics_storage"],
      };
      modifiedTags.push(tag.name);
    }
  }

  version.tag = tags;

  return {
    updatedContainer: {
      ...container,
      containerVersion: version,
    },
    modifiedTags,
  };
}

export function addTagRecipe(
  container: GtmContainerExport,
  recipe: "ga4_core" | "meta_pixel" | "linkedin_insight" | "posthog",
  config: { measurementId?: string; pixelId?: string; partnerId?: string; posthogKey?: string }
): { updatedContainer: GtmContainerExport; addedTag: string } {
  const version = JSON.parse(JSON.stringify(container.containerVersion));
  const tags: GtmTag[] = version.tag || [];
  const triggers: GtmTrigger[] = version.trigger || [];

  let newTag: GtmTag | null = null;

  if (recipe === "ga4_core" && config.measurementId) {
    newTag = {
      tagId: `tag_${Date.now()}`,
      name: `GA4 - Configuration (${config.measurementId})`,
      type: "googtag",
      parameter: [
        { type: "template", key: "tagId", value: config.measurementId },
      ],
      firingTriggerId: ["2147479553"], // Initialization - All Pages in standard GTM
      consentSettings: {
        consentStatus: "NEEDED",
        consentType: ["analytics_storage"],
      },
    };
  } else if (recipe === "meta_pixel" && config.pixelId) {
    newTag = {
      tagId: `tag_${Date.now()}`,
      name: `Meta - Base Pixel (${config.pixelId})`,
      type: "html",
      parameter: [
        {
          type: "template",
          key: "html",
          value: `<!-- Meta Pixel Code -->\n<script>\n!function(f,b,e,v,n,t,s)\n{if(f.fbq)return;n=f.fbq=function(){n.callMethod?\nn.callMethod.apply(n,arguments):n.queue.push(arguments)};\nif(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';\nn.queue=[];t=b.createElement(e);t.async=!0;\nt.src=v;s=b.getElementsByTagName(e)[0];\ns.parentNode.insertBefore(t,s)}(window, document,'script',\n'https://connect.facebook.net/en_US/fbevents.js');\nfbq('init', '${config.pixelId}');\nfbq('track', 'PageView');\n</script>`,
        },
      ],
      firingTriggerId: ["2147479553"],
      consentSettings: {
        consentStatus: "NEEDED",
        consentType: ["ad_storage", "ad_user_data", "ad_personalization"],
      },
    };
  }

  if (newTag) {
    tags.push(newTag);
    version.tag = tags;
    return {
      updatedContainer: {
        ...container,
        containerVersion: version,
      },
      addedTag: newTag.name,
    };
  }

  return {
    updatedContainer: container,
    addedTag: "None (Invalid config or recipe)",
  };
}
