import { createClient } from '@/lib/supabase/client'
import type {
  Project,
  ProjectRequirements,
  PipelinePhase,
  PhaseRun,
  ProjectActiveRun,
  Document,
  CreateProjectPayload,
  UpdateProjectPayload,
  UpsertRequirementsPayload,
  TriggerRunPayload,
  TriggerRunResponse,
  ActivateRunResponse,
} from '@/types'

const BASE_URL = '/api/backend'

// ─── Auth header ──────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return {
    'Content-Type': 'application/json',
    ...(session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}),
  }
}

// ─── Base fetch ───────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const err = await res.json()
      detail = err.detail ?? detail
    } catch {
      // ignore parse errors
    }
    throw new Error(detail)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json()
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export const projectsApi = {
  list: () => apiFetch<Project[]>('/projects'),

  get: (id: string) => apiFetch<Project>(`/projects/${id}`),

  create: (payload: CreateProjectPayload) =>
    apiFetch<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UpdateProjectPayload) =>
    apiFetch<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  archive: (id: string) =>
    apiFetch<void>(`/projects/${id}`, { method: 'DELETE' }),

  getRequirements: (id: string) =>
    apiFetch<ProjectRequirements>(`/projects/${id}/requirements`),

  upsertRequirements: (id: string, payload: UpsertRequirementsPayload) =>
    apiFetch<ProjectRequirements>(`/projects/${id}/requirements`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}

// ─── Pipeline phases ─────

export const phasesApi = {
  list: () => apiFetch<PipelinePhase[]>('/pipeline-phases'),
}

// ─── Phase runs ───────────────────────────────────────────────────────────────

export const runsApi = {
  trigger: (projectId: string, phaseId: string, payload: TriggerRunPayload) =>
    apiFetch<TriggerRunResponse>(
      `/projects/${projectId}/phases/${phaseId}/run`,
      { method: 'POST', body: JSON.stringify(payload) }
    ),

  list: (projectId: string, phaseId: string) =>
    apiFetch<PhaseRun[]>(
      `/projects/${projectId}/phases/${phaseId}/runs`
    ),

  get: (projectId: string, phaseId: string, runId: string) =>
    apiFetch<PhaseRun>(
      `/projects/${projectId}/phases/${phaseId}/runs/${runId}`
    ),

  activate: (projectId: string, phaseId: string, runId: string) =>
    apiFetch<ActivateRunResponse>(
      `/projects/${projectId}/phases/${phaseId}/runs/${runId}/activate`,
      { method: 'POST' }
    ),

  getActiveRuns: (projectId: string) =>
    apiFetch<ProjectActiveRun[]>(`/projects/${projectId}/active-runs`),
}

// ─── Documents ────────────────────────────────────────────────────────────────

export const documentsApi = {
  list: (params?: { project_id?: string; type?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v != null) as [
        string,
        string,
      ][]
    ).toString()
    return apiFetch<Document[]>(`/documents${qs ? `?${qs}` : ''}`)
  },

  upload: async (file: File, meta: {
    type: Document['type']
    project_id?: string
    name?: string
  }) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', meta.type)
    if (meta.project_id) formData.append('project_id', meta.project_id)
    if (meta.name) formData.append('name', meta.name)

    const res = await fetch(`${BASE_URL}/document/upload`, {
      method: 'POST',
      headers: {
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
        // No Content-Type — let browser set multipart boundary
      },
      body: formData,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
      throw new Error(err.detail)
    }

    return res.json() as Promise<Document>
  },

  delete: (id: string) =>
    apiFetch<void>(`/documents/${id}`, { method: 'DELETE' }),
}

// ─── RAG search ───────────────────────────────────────────────────────────────

export const ragApi = {
  search: (payload: {
    query: string
    project_id?: string
    type_filter?: string
    top_k?: number
  }) =>
    apiFetch<{ results: Array<{ id: string; content: string; similarity: number; metadata: Record<string, unknown> }> }>(
      '/rag/search',
      { method: 'POST', body: JSON.stringify(payload) }
    ),
}
