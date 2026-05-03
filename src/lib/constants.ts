import type { DocumentType, PhaseId } from '@/types'

// ─── Documents ────────────────────────────────────────────────────────────────

export const DOC_TYPES: DocumentType[] = [
  'datasheet',
  'normative',
  'manufacturer_list',
  'reference_schematic',
  'design_note',
  'project_output',
  'other',
]

// ─── App ──────────────────────────────────────────────────────────────────────

export const APP_VERSION = '0.1.0'

// ─── Pipeline phases ──────────────────────────────────────────────────────────

// deben ser exactamente iguales a los de supabase. IMPORTANTE!!!
export const PHASE_IDS = {
  research: 'research',
  ic_selection: 'ic_selection',
  ic_naming_agent: 'ic_naming_agent',
  component_selection: 'component_selection',
  netlist: 'netlist',
} as const satisfies Record<PhaseId, PhaseId>

// ─── n8n ──────────────────────────────────────────────────────────────────────

export const N8N_BASE_URL = 'https://nexo-n8n.onrender.com'

/** Workflow ID in n8n for each pipeline phase. */
export const N8N_WORKFLOW_IDS: Record<PhaseId, string | null> = {
  research: '1DUWTbxD2PNthXV4',
  ic_selection: 'Ctzas8sxKGpgE0nh',
  ic_naming_agent: 'DbF6DMysPQgevaOJ',
  component_selection: null, // TODO: create workflow
  netlist: null,             // TODO: create workflow
}

/** Returns the n8n execution URL for a run, or null if data is missing. */
export function n8nExecutionUrl(
  phaseId: PhaseId,
  executionId: string | null
): string | null {
  const workflowId = N8N_WORKFLOW_IDS[phaseId]
  if (!workflowId || !executionId) return null
  return `${N8N_BASE_URL}/workflow/${workflowId}/executions/${executionId}`
}

/** Workflow ID in n8n for the requirements workflow. */
export const N8N_REQUIREMENTS_WORKFLOW_ID: string | null = "uADgFhixX28peR3k"

/** Returns the n8n URL for a requirements run.
 *  Links to the specific execution if available, otherwise to the workflow page. */
export function n8nRequirementsUrl(executionId: string | null): string | null {
  if (!N8N_REQUIREMENTS_WORKFLOW_ID) return null
  if (executionId) {
    return `${N8N_BASE_URL}/workflow/${N8N_REQUIREMENTS_WORKFLOW_ID}/executions/${executionId}`
  }
  return `${N8N_BASE_URL}/workflow/${N8N_REQUIREMENTS_WORKFLOW_ID}`
}

// ─── Normativas ───────────────────────────────────────────────────────────────

/** Workflow ID in n8n for the normativas suggest workflow. */
export const N8N_NORMATIVES_WORKFLOW_ID: string | null = "lGTZD0bYPYURhUCb" // TODO: change to the real one once it's created

/** Returns the n8n URL for a normativas run. */
export function n8nNormativesUrl(executionId: string | null): string | null {
  if (!N8N_NORMATIVES_WORKFLOW_ID) return null
  if (executionId) {
    return `${N8N_BASE_URL}/workflow/${N8N_NORMATIVES_WORKFLOW_ID}/executions/${executionId}`
  }
  return `${N8N_BASE_URL}/workflow/${N8N_NORMATIVES_WORKFLOW_ID}`
}

export const NORMATIVE_INDUSTRIES = [
  'consumer_electronics',
  'industrial',
  'medical',
  'automotive',
] as const
export type NormativeIndustry = (typeof NORMATIVE_INDUSTRIES)[number]

export const NORMATIVE_CLIENT_TYPES = [
  'consumer',
  'professional',
  'child',
] as const
export type NormativeClientType = (typeof NORMATIVE_CLIENT_TYPES)[number]

export const NORMATIVE_AGE_RANGES = [
  'all_ages',
  'adult_only',
  'children',
] as const
export type NormativeAgeRange = (typeof NORMATIVE_AGE_RANGES)[number]

/** ISO 3166-1 alpha-2 codes offered in the country picker. Extend as needed. */
export const NORMATIVE_COUNTRIES = [
  { code: 'EU', label: 'EU (all)' },
  { code: 'ES', label: 'Spain' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'GB', label: 'UK' },
  { code: 'IT', label: 'Italy' },
  { code: 'US', label: 'USA' },
  { code: 'CA', label: 'Canada' },
] as const
export type NormativeCountryCode = (typeof NORMATIVE_COUNTRIES)[number]['code']


// ─── Component Design Picker ───────────────────────────────────────────────────────────────
// Numero maximo de partes q se muestran por defecto en 
export const COMPONENT_DESIGN_PICKER_MAX_VISIBLE_PARTS = 4
