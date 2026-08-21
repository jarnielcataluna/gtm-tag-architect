import { z } from "zod";

export const GtmParameterSchema = z.object({
  type: z.string(),
  key: z.string(),
  value: z.any().optional(),
  list: z.array(z.any()).optional(),
  map: z.array(z.any()).optional(),
});

export type GtmParameter = z.infer<typeof GtmParameterSchema>;

export const GtmConsentSettingSchema = z.object({
  consentStatus: z.enum(["NOT_SET", "NEEDED", "NOT_NEEDED"]).optional(),
  consentType: z.array(z.string()).optional(),
});

export const GtmTagSchema = z.object({
  accountId: z.string().optional(),
  containerId: z.string().optional(),
  tagId: z.string(),
  name: z.string(),
  type: z.string(),
  parameter: z.array(GtmParameterSchema).optional(),
  firingTriggerId: z.array(z.string()).optional(),
  blockingTriggerId: z.array(z.string()).optional(),
  consentSettings: GtmConsentSettingSchema.optional(),
  paused: z.boolean().optional(),
});

export type GtmTag = z.infer<typeof GtmTagSchema>;

export const GtmTriggerSchema = z.object({
  accountId: z.string().optional(),
  containerId: z.string().optional(),
  triggerId: z.string(),
  name: z.string(),
  type: z.string(),
  customEventFilter: z.array(z.any()).optional(),
  filter: z.array(z.any()).optional(),
  autoEventFilter: z.array(z.any()).optional(),
});

export type GtmTrigger = z.infer<typeof GtmTriggerSchema>;

export const GtmVariableSchema = z.object({
  accountId: z.string().optional(),
  containerId: z.string().optional(),
  variableId: z.string(),
  name: z.string(),
  type: z.string(),
  parameter: z.array(GtmParameterSchema).optional(),
});

export type GtmVariable = z.infer<typeof GtmVariableSchema>;

export const GtmContainerExportSchema = z.object({
  exportFormatVersion: z.number().optional(),
  exportTime: z.string().optional(),
  containerVersion: z.object({
    path: z.string().optional(),
    accountId: z.string().optional(),
    containerId: z.string().optional(),
    container: z.object({
      publicId: z.string(),
      name: z.string(),
      usageContext: z.array(z.string()).optional(),
    }).optional(),
    tag: z.array(GtmTagSchema).optional(),
    trigger: z.array(GtmTriggerSchema).optional(),
    variable: z.array(GtmVariableSchema).optional(),
  }),
});

export type GtmContainerExport = z.infer<typeof GtmContainerExportSchema>;

export const AuditSeveritySchema = z.enum(["critical", "warning", "info"]);

export const AuditFindingSchema = z.object({
  id: z.string(),
  category: z.enum(["duplicates", "consent", "performance", "triggers", "security", "taxonomy"]),
  title: z.string(),
  description: z.string(),
  affectedEntities: z.array(z.string()),
  severity: AuditSeveritySchema,
  recommendation: z.string(),
});

export type AuditFinding = z.infer<typeof AuditFindingSchema>;

export const AuditReportSchema = z.object({
  containerName: z.string(),
  publicId: z.string(),
  totalTags: z.number(),
  totalTriggers: z.number(),
  totalVariables: z.number(),
  healthScore: z.number().min(0).max(100),
  findings: z.array(AuditFindingSchema),
  passedAudits: z.array(z.string()),
});

export type AuditReport = z.infer<typeof AuditReportSchema>;
