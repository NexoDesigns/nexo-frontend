import type { PhaseId } from '@/types'

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
