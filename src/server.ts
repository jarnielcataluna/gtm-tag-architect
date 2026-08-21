import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { auditContainer } from "./gtm/audit.js";
import { deduplicateTags, applyConsentModeV2, addTagRecipe } from "./gtm/optimizer.js";
import { generateDataLayerDefinitions } from "./gtm/datalayer.js";
import { generateMarkdownReport, generateHtmlReport } from "./gtm/report.js";
import {
  GtmContainerExport,
  GtmAuditContainerInputSchema,
  GtmDeduplicateTagsInputSchema,
  GtmApplyConsentModeInputSchema,
  GtmAddTagRecipeInputSchema,
  GtmGenerateDataLayerTypesInputSchema,
  GtmExportAuditReportInputSchema,
} from "./types/gtm.js";

const server = new Server(
  {
    name: "gtm-tag-architect",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

async function loadContainerJson(inputPath?: string): Promise<{ container: GtmContainerExport; filePath: string }> {
  const filePath =
    inputPath ||
    process.env.GTM_OFFLINE_CONTAINER_PATH ||
    path.resolve(process.cwd(), "fixtures/sample-ecommerce-container.json");

  const raw = await fs.readFile(filePath, "utf-8");
  return { container: JSON.parse(raw) as GtmContainerExport, filePath };
}

async function maybeWriteContainer(container: GtmContainerExport, outputPath?: string): Promise<string | null> {
  if (!outputPath) return null;
  const resolved = path.resolve(process.cwd(), outputPath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, JSON.stringify(container, null, 2), "utf-8");
  return resolved;
}

// -----------------------------------------------------------------------------
// MCP TOOLS
// -----------------------------------------------------------------------------

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "gtm_audit_container",
        description:
          "Runs a deep diagnostic audit on a Google Tag Manager container. Identifies duplicate tags, missing triggers, unconsented tracking (Consent Mode v2), and heavy blocking scripts.",
        inputSchema: {
          type: "object",
          properties: {
            containerPath: {
              type: "string",
              description: "Optional local path to container export JSON file",
            },
          },
        },
      },
      {
        name: "gtm_deduplicate_tags",
        description:
          "Deduplicates GA4 configuration and Meta Pixel tags in the GTM container, consolidating firing triggers and pruning duplicate base tags.",
        inputSchema: {
          type: "object",
          properties: {
            containerPath: {
              type: "string",
              description: "Path to container JSON file",
            },
            outputPath: {
              type: "string",
              description: "Optional path to save the cleaned container JSON file",
            },
          },
        },
      },
      {
        name: "gtm_apply_consent_mode",
        description:
          "Configures Google Consent Mode v2 on all analytics and marketing tags or bypasses consent for direct firing.",
        inputSchema: {
          type: "object",
          properties: {
            containerPath: {
              type: "string",
              description: "Path to container JSON file",
            },
            outputPath: {
              type: "string",
              description: "Optional path to save the updated container JSON file",
            },
            mode: {
              type: "string",
              enum: ["enforce_denied", "enforce_granted", "bypass_opt_out"],
              description: "Consent Mode strategy: 'enforce_denied' (GDPR strict), 'enforce_granted', or 'bypass_opt_out' (removes consent gating for unrestricted direct tag firing)",
            },
          },
        },
      },
      {
        name: "gtm_add_tag_recipe",
        description:
          "Adds a pre-configured tag recipe (GA4 Core, Meta Pixel, PostHog, or LinkedIn) to the container workspace.",
        inputSchema: {
          type: "object",
          properties: {
            containerPath: { type: "string" },
            outputPath: { type: "string", description: "Optional path to save updated container" },
            recipe: {
              type: "string",
              enum: ["ga4_core", "meta_pixel", "linkedin_insight", "posthog"],
            },
            measurementId: { type: "string" },
            pixelId: { type: "string" },
          },
          required: ["recipe"],
        },
      },
      {
        name: "gtm_generate_datalayer_types",
        description:
          "Generates production TypeScript type definitions or PHP server-side dataLayer helpers (for WordPress, Symfony, Laravel, React/Next.js, or vanilla).",
        inputSchema: {
          type: "object",
          properties: {
            industry: {
              type: "string",
              enum: ["portfolio", "ecommerce", "saas", "leadgen", "content"],
              description: "Target industry tracking taxonomy",
            },
            framework: {
              type: "string",
              enum: ["typescript", "php", "wordpress", "laravel", "symfony", "vanilla"],
              description: "Frontend or backend language/framework (TypeScript for Next.js/React, PHP for WordPress/Symfony/Laravel)",
            },
          },
          required: ["industry"],
        },
      },
      {
        name: "gtm_export_audit_report",
        description:
          "Exports a formatted diagnostic audit report in Markdown or standalone HTML format with executive scoring and remediation plans.",
        inputSchema: {
          type: "object",
          properties: {
            containerPath: {
              type: "string",
              description: "Path to container JSON file",
            },
            format: {
              type: "string",
              enum: ["markdown", "html"],
              description: "Output report format (markdown or html)",
            },
            outputPath: {
              type: "string",
              description: "Optional file path to save the generated report",
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: rawArgs = {} } = request.params;

  try {
    switch (name) {
      case "gtm_audit_container": {
        const parsed = GtmAuditContainerInputSchema.parse(rawArgs);
        const { container, filePath } = await loadContainerJson(parsed.containerPath);
        const report = auditContainer(container);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ sourceFile: filePath, ...report }, null, 2),
            },
          ],
        };
      }

      case "gtm_deduplicate_tags": {
        const parsed = GtmDeduplicateTagsInputSchema.parse(rawArgs);
        const { container } = await loadContainerJson(parsed.containerPath);
        const result = deduplicateTags(container);
        const savedTo = await maybeWriteContainer(result.updatedContainer, parsed.outputPath);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "success",
                  removedCount: result.removedTags.length,
                  removedTags: result.removedTags,
                  consolidatedTags: result.consolidatedTags,
                  savedTo: savedTo || undefined,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "gtm_apply_consent_mode": {
        const parsed = GtmApplyConsentModeInputSchema.parse(rawArgs);
        const { container } = await loadContainerJson(parsed.containerPath);
        const result = applyConsentModeV2(container, parsed.mode);
        const savedTo = await maybeWriteContainer(result.updatedContainer, parsed.outputPath);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "success",
                  mode: parsed.mode,
                  modifiedTagsCount: result.modifiedTags.length,
                  modifiedTags: result.modifiedTags,
                  savedTo: savedTo || undefined,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "gtm_add_tag_recipe": {
        const parsed = GtmAddTagRecipeInputSchema.parse(rawArgs);
        const { container } = await loadContainerJson(parsed.containerPath);
        const result = addTagRecipe(container, parsed.recipe, {
          measurementId: parsed.measurementId,
          pixelId: parsed.pixelId,
        });
        const savedTo = await maybeWriteContainer(result.updatedContainer, parsed.outputPath);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "success",
                  addedTag: result.addedTag,
                  savedTo: savedTo || undefined,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "gtm_generate_datalayer_types": {
        const parsed = GtmGenerateDataLayerTypesInputSchema.parse(rawArgs);
        const code = generateDataLayerDefinitions(parsed.industry, parsed.framework);
        return {
          content: [
            {
              type: "text",
              text: code,
            },
          ],
        };
      }

      case "gtm_export_audit_report": {
        const parsed = GtmExportAuditReportInputSchema.parse(rawArgs);
        const { container } = await loadContainerJson(parsed.containerPath);
        const report = auditContainer(container);
        const output =
          parsed.format === "html" ? generateHtmlReport(report) : generateMarkdownReport(report);

        let savedTo: string | null = null;
        if (parsed.outputPath) {
          const resolved = path.resolve(process.cwd(), parsed.outputPath);
          await fs.mkdir(path.dirname(resolved), { recursive: true });
          await fs.writeFile(resolved, output, "utf-8");
          savedTo = resolved;
        }

        return {
          content: [
            {
              type: "text",
              text: savedTo ? `Report saved to ${savedTo}\n\n${output}` : output,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error executing tool '${name}': ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// -----------------------------------------------------------------------------
// MCP RESOURCES
// -----------------------------------------------------------------------------

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "gtm://container/health",
        name: "Current GTM Container Health",
        description: "Live diagnostic report and health score of the active container",
        mimeType: "application/json",
      },
      {
        uri: "gtm://taxonomies/portfolio",
        name: "Technical Portfolio Tracking Taxonomy",
        description: "Event contracts and interaction metrics for senior engineer portfolios",
        mimeType: "text/markdown",
      },
      {
        uri: "gtm://taxonomies/ecommerce",
        name: "E-Commerce Tracking Taxonomy",
        description: "GA4 e-commerce standard funnel (view_item, add_to_cart, purchase)",
        mimeType: "text/markdown",
      },
      {
        uri: "gtm://taxonomies/saas",
        name: "SaaS & Product Analytics Taxonomy",
        description: "Self-serve signup, subscription tiers, and feature activation tracking",
        mimeType: "text/markdown",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "gtm://container/health") {
    const { container } = await loadContainerJson();
    const report = auditContainer(container);
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(report, null, 2),
        },
      ],
    };
  }

  const taxonomyMap: Record<string, string> = {
    "gtm://taxonomies/portfolio": "skills/setup/references/taxonomy-portfolio.md",
    "gtm://taxonomies/ecommerce": "skills/setup/references/taxonomy-ecommerce.md",
    "gtm://taxonomies/saas": "skills/setup/references/taxonomy-saas.md",
  };

  if (taxonomyMap[uri]) {
    const filePath = path.resolve(process.cwd(), taxonomyMap[uri]);
    const text = await fs.readFile(filePath, "utf-8").catch(() => "# Taxonomy Reference Not Found");
    return {
      contents: [
        {
          uri,
          mimeType: "text/markdown",
          text,
        },
      ],
    };
  }

  throw new Error(`Resource not found: ${uri}`);
});

// -----------------------------------------------------------------------------
// MCP PROMPTS
// -----------------------------------------------------------------------------

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "gtm_setup_interview",
        description: "Interactive setup interview to architect and optimize a site's GTM container",
      },
      {
        name: "gtm_audit_inspection",
        description: "Diagnostic container inspection catching duplicates and privacy violations",
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name } = request.params;

  if (name === "gtm_setup_interview") {
    return {
      description: "Interactive GTM setup interview",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "Please interview me about my site architecture, industry, required analytics pixels (GA4, Meta, LinkedIn, PostHog), and privacy mode (Consent Mode v2 vs Direct Firing) to optimize my Google Tag Manager tracking setup.",
          },
        },
      ],
    };
  }

  if (name === "gtm_audit_inspection") {
    return {
      description: "Deep GTM container audit",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "Please run a diagnostic audit on my GTM container to check for duplicate measurement IDs, orphaned triggers, unconsented marketing tags, and render-blocking scripts.",
          },
        },
      ],
    };
  }

  throw new Error(`Prompt not found: ${name}`);
});

// -----------------------------------------------------------------------------
// STDIO TRANSPORT STARTUP
// -----------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error running GTM MCP server:", err);
  process.exit(1);
});
