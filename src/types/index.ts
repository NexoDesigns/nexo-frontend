// ─── Auth / Profiles ────────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string
  email: string
  role: 'engineer' | 'admin'
  created_at: string
}

// ─── Projects ────────────────────────────────────────────────────────────────

export type ProjectStatus = 'active' | 'archived' | 'completed'

export interface Project {
  id: string
  name: string
  client_name: string | null
  description: string | null
  status: ProjectStatus
  requirements_input_drive_url: string | null
  requirements_input_drive_name: string | null
  // Normative context fields
  normative_industry: string | null
  normative_client_type: string | null
  normative_user_age_range: string | null
  normative_target_countries: string[] | null
  normative_extra_context: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface ProjectRequirements {
  id: string
  project_id: string
  input_voltage_min: number | null
  input_voltage_max: number | null
  output_voltage: number | null
  max_current: number | null
  max_ripple_percent: number | null
  temperature_range: string | null
  main_function: string | null
  constraints: string | null
  kpis: string | null
  notes: string | null
  raw_json: Record<string, unknown> | null
  created_at: string
}

// ─── Pipeline Phases ─────────────────────────────────────────────────────────

export type PhaseId =
  | 'research'
  | 'ic_selection'
  | 'ic_naming_agent'
  | 'component_selection'
  | 'netlist'

export interface PipelinePhase {
  id: PhaseId
  name: string
  description: string
  order_index: number
  n8n_webhook_path: string
}

// ─── Research output ─────────────────────────────────────────────────────────

export interface ResearchSolution {
  id: string
  title: string
  description: string
  key_references: string[]
}

export interface ResearchOutputItem {
  query_summary: string
  solutions: ResearchSolution[]
  error: string | null
}

// ─── Phase Runs ───────────────────────────────────────────────────────────────

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface PhaseRun {
  id: string
  project_id: string
  phase_id: PhaseId
  run_number: number
  status: RunStatus
  input_payload: Record<string, unknown>
  output_payload: Record<string, unknown> | null
  rag_context: RagContext | null
  n8n_execution_id: string | null
  error_message: string | null
  duration_seconds: number | null
  llm_tokens_used: number | null
  notes: string | null
  created_by: string
  created_at: string
  completed_at: string | null
}

export interface UpdateRunNotesPayload {
  notes: string
}

export interface RagContext {
  query: string
  results: RagResult[]
}

export interface RagResult {
  id: string
  document_id: string
  content: string
  similarity: number
  metadata: Record<string, unknown>
}

// Active run per phase per project
export interface ProjectActiveRun {
  project_id: string
  phase_id: PhaseId
  run_id: string
  updated_at: string
}

// ─── Documents ───────────────────────────────────────────────────────────────

export type DocumentType =
  | 'datasheet'
  | 'manufacturer_list'
  | 'project_output'
  | 'design_note'
  | 'reference_schematic'
  | 'other'

export type EmbeddingStatus = 'pending' | 'processing' | 'done' | 'error'

export interface Document {
  id: string
  name: string
  type: DocumentType
  source: string | null
  project_id: string | null
  storage_path: string
  file_size_bytes: number | null
  mime_type: string | null
  embedding_status: EmbeddingStatus
  metadata: Record<string, unknown> | null
  created_by: string
  created_at: string
}

// ─── API Request / Response shapes ───────────────────────────────────────────

export interface CreateProjectPayload {
  name: string
  client_name?: string
  description?: string
}

export interface UpdateProjectPayload {
  name?: string
  client_name?: string | null
  description?: string | null
  status?: ProjectStatus
  requirements_input_drive_url?: string | null
  requirements_input_drive_name?: string | null
  normative_industry?: string | null
  normative_client_type?: string | null
  normative_user_age_range?: string | null
  normative_target_countries?: string[] | null
  normative_extra_context?: string | null
}

// ─── Requirements Runs ────────────────────────────────────────────────────────

export interface RequirementsRun {
  id: string
  project_id: string
  run_number: number
  status: RunStatus
  custom_prompt: string | null
  input_drive_url: string | null
  output_drive_url: string | null
  output_drive_file_id: string | null
  n8n_execution_id: string | null
  error_message: string | null
  created_by: string
  created_at: string
  completed_at: string | null
  duration_seconds: number | null
}

export interface TriggerRequirementsRunPayload {
  custom_prompt?: string
}

export interface TriggerRequirementsRunResponse {
  run_id: string
  status: 'running'
}

export interface UpsertRequirementsPayload {
  input_voltage_min?: number | null
  input_voltage_max?: number | null
  output_voltage?: number | null
  max_current?: number | null
  max_ripple_percent?: number | null
  temperature_range?: string | null
  main_function?: string | null
  constraints?: string | null
  kpis?: string | null
  notes?: string | null
  raw_json?: Record<string, unknown> | null
}

export interface TriggerRunPayload {
  custom_inputs: Record<string, unknown>
}

export interface TriggerRunResponse {
  run_id: string
  status: 'running'
}

export interface ActivateRunResponse {
  success: boolean
}

// ─── Utility types ────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string
  status?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}

// Project with its active run statuses — for dashboard/project list
export interface ProjectWithStatus extends Project {
  active_runs: Partial<Record<PhaseId, PhaseRun>>
  requirements: ProjectRequirements | null
}

// ─── Normatives ───────────────────────────────────────────────────────────────

export interface NormativeMetadata {
  standard_code: string
  standard_version: string | null
  issuing_body: string
  applicable_industries: string[]
  applicable_countries: string[]
  applicable_user_types: string[]
  scope_summary: string | null
  source_url: string | null
  scraped_at: string | null
}

export interface NormativeDocument {
  id: string
  name: string
  storage_path: string
  embedding_status: EmbeddingStatus
  metadata: NormativeMetadata
  created_at: string
}

export type NormativeRelevance = 'mandatory' | 'recommended'

export interface NormativeSuggestion {
  document_id: string
  standard_code: string
  scope_summary: string | null
  relevance: NormativeRelevance
  relevance_reason: string
  score?: number
  document?: NormativeDocument
}

export type ProjectNormativeStatus = 'confirmed' | 'not_applicable'

export interface ProjectNormative {
  project_id: string
  document_id: string
  status: ProjectNormativeStatus
  selection_source: 'suggested_auto' | 'added_manual' | 'suggested_confirmed'
  selected_by: string
  selected_at: string
  document?: NormativeDocument
}

export interface NormativesRun {
  id: string
  project_id: string
  run_number: number
  status: RunStatus
  n8n_execution_id: string | null
  error_message: string | null
  created_by: string
  created_at: string
  completed_at: string | null
  duration_seconds: number | null
  suggestions?: NormativeSuggestion[]
}

export interface UpdateProjectNormativesPayload {
  normatives: Array<{ document_id: string; status: ProjectNormativeStatus }>
}
