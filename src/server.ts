import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { auditContainer } from "./gtm/audit.js";
import { deduplicateTags, applyConsentModeV2, addTagRecipe } from "./gtm/optimizer.js";
import { generateDataLayerDefinitions } from "./gtm/datalayer.js";
import { GtmContainerExport } from "./types/gtm.js";

const server = new Server(
  {
    name: "gtm-tag-architect",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

async function loadContainerJson(inputPath?: string): Promise<GtmContainerExport> {
  const filePath =
    inputPath ||
    process.env.GTM_OFFLINE_CONTAINER_PATH ||
    path.resolve(process.cwd(), "fixtures/sample-ecommerce-container.json");

  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as GtmContainerExport;
}

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
          },
        },
      },
      {
        name: "gtm_apply_consent_mode",
        description:
          "Configures Google Consent Mode v2 on all analytics and marketing tags (requiring ad_storage, ad_user_data, and analytics_storage).",
        inputSchema: {
          type: "object",
          properties: {
            containerPath: {
              type: "string",
              description: "Path to container JSON file",
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
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case "gtm_audit_container": {
        const container = await loadContainerJson((args as any).containerPath);
        const report = auditContainer(container);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(report, null, 2),
            },
          ],
        };
      }

      case "gtm_deduplicate_tags": {
        const container = await loadContainerJson((args as any).containerPath);
        const result = deduplicateTags(container);
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
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "gtm_apply_consent_mode": {
        const container = await loadContainerJson((args as any).containerPath);
        const result = applyConsentModeV2(container, (args as any).mode || "enforce_denied");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "success",
                  mode: (args as any).mode || "enforce_denied",
                  modifiedTagsCount: result.modifiedTags.length,
                  modifiedTags: result.modifiedTags,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "gtm_add_tag_recipe": {
        const container = await loadContainerJson((args as any).containerPath);
        const result = addTagRecipe(container, (args as any).recipe, {
          measurementId: (args as any).measurementId,
          pixelId: (args as any).pixelId,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ status: "success", addedTag: result.addedTag }, null, 2),
            },
          ],
        };
      }

      case "gtm_generate_datalayer_types": {
        const code = generateDataLayerDefinitions(
          (args as any).industry || "ecommerce",
          (args as any).framework || "typescript"
        );
        return {
          content: [
            {
              type: "text",
              text: code,
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error running GTM MCP server:", err);
  process.exit(1);
});
