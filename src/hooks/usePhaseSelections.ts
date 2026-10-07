import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { phaseSelectionsApi, runsApi } from '@/lib/api'
import { useActiveRuns } from '@/hooks/usePipelineState'
import { useCustomOutputs } from '@/hooks/useCustomOutputs'
import type { PhaseId, PhaseSelection, ResearchOutputItem, ResearchSolution } from '@/types'

// ─── Saved selections (backend) ───────────────────────────────────────────────

interface SaveVars {
  phaseId: PhaseId
  sourceRunId: string
  ids: string[]
}

export function usePhaseSelections(projectId: string) {
  const queryClient = useQueryClient()
  const queryKey = ['phase-selections', projectId]
  const mutationKey = ['save-phase-selection', projectId]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => phaseSelectionsApi.list(projectId),
  })

  const save = useMutation({
    mutationKey,
    mutationFn: ({ phaseId, sourceRunId, ids }: SaveVars) =>
      phaseSelectionsApi.upsert(projectId, phaseId, { source_run_id: sourceRunId, selected_ids: ids }),
    // Optimistic: the UI follows the click immediately. On failure the local
    // choice is kept for this session and `save.isError` reports it.
    onMutate: async ({ phaseId, sourceRunId, ids }) => {
      await queryClient.cancelQueries({ queryKey })
      queryClient.setQueryData<PhaseSelection[]>(queryKey, (old = []) => [
        ...old.filter((s) => s.phase_id !== phaseId),
        {
          project_id: projectId,
          phase_id: phaseId,
          source_run_id: sourceRunId,
          selected_ids: ids,
          updated_by: null,
          updated_at: new Date().toISOString(),
        },
      ])
    },
    onSuccess: () => {
      // Only resync once the last pending save has landed, so a slow response
      // can't overwrite a newer optimistic selection.
      if (queryClient.isMutating({ mutationKey }) <= 1) {
        queryClient.invalidateQueries({ queryKey })
      }
    },
  })

  /** Saved selection of `phaseId`, only if it was made on `runId`. */
  const get = (phaseId: PhaseId, runId: string | null) =>
    runId ? data?.find((s) => s.phase_id === phaseId && s.source_run_id === runId) : undefined

  return { get, save, isLoading }
}

// ─── Research → IC Selection ──────────────────────────────────────────────────

function isResearchOutputItem(value: unknown): value is ResearchOutputItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'solutions' in value &&
    Array.isArray((value as Record<string, unknown>).solutions)
  )
}

export function parseResearchOutput(raw: unknown): ResearchOutputItem[] {
  if (isResearchOutputItem(raw)) return [raw]
  if (Array.isArray(raw)) return raw.filter(isResearchOutputItem)
  return []
}

/**
 * Which research solutions (originals and edited copies) are sent to IC
 * Selection. Defaults to every original solution of the active research run.
 */
export function useResearchSelection(projectId: string) {
  const { data: activeRuns } = useActiveRuns(projectId)
  const runId = activeRuns?.find((a) => a.phase_id === 'research')?.run_id ?? null

  const { data: run } = useQuery({
    queryKey: ['run', projectId, 'research', runId],
    queryFn: () => runsApi.get(projectId, 'research', runId!),
    enabled: !!runId,
  })
  const customOutputs = useCustomOutputs(projectId, 'research', runId)
  const selections = usePhaseSelections(projectId)

  const items = useMemo(() => parseResearchOutput(run?.output_payload), [run?.output_payload])
  const originals = useMemo(() => items.flatMap((item) => item.solutions), [items])
  const allSolutions = useMemo(
    () => [...originals, ...customOutputs.items.map((ci) => ci.data as unknown as ResearchSolution)],
    [originals, customOutputs.items]
  )

  const saved = selections.get('research', runId)
  const savedIds = saved?.selected_ids.filter((id) => allSolutions.some((s) => s.id === id)) ?? []
  const selectedIds = savedIds.length > 0 ? savedIds : originals.map((s) => s.id)
  const selectedSolutions = allSolutions.filter((s) => selectedIds.includes(s.id))

  const save = (ids: string[]) => {
    if (runId) selections.save.mutate({ phaseId: 'research', sourceRunId: runId, ids })
  }

  return {
    runId,
    selectedSolutions,
    querySummary: items[0]?.query_summary,
    saveError: selections.save.isError,
    /** Toggle a solution; at least one always stays selected */
    toggle: (id: string) => {
      if (selectedIds.includes(id)) {
        if (selectedIds.length > 1) save(selectedIds.filter((s) => s !== id))
      } else {
        save([...selectedIds, id])
      }
    },
    add: (id: string) => save([...selectedIds.filter((s) => s !== id), id]),
    remove: (id: string) => {
      const next = selectedIds.filter((s) => s !== id)
      save(next.length > 0 ? next : originals.map((s) => s.id))
    },
  }
}

// ─── IC Selection → Architecture Agent ────────────────────────────────────────

interface IcDesignOption {
  id: string
  components: unknown[]
}

function getIcDesigns(raw: unknown): IcDesignOption[] {
  if (typeof raw !== 'object' || raw === null || !('results' in raw)) return []
  const results = (raw as { results: unknown }).results
  if (!Array.isArray(results)) return []
  return (results as IcDesignOption[]).filter((r) => Array.isArray(r?.components) && r.components.length > 0)
}

/**
 * Which IC Selection design is sent to the Architecture Agent. Saved per
 * active ic_selection run; picked automatically when there is only one.
 */
export function useIcDesignSelection(projectId: string) {
  const { data: activeRuns } = useActiveRuns(projectId)
  const runId = activeRuns?.find((a) => a.phase_id === 'ic_selection')?.run_id ?? null

  const { data: run } = useQuery({
    queryKey: ['run', projectId, 'ic_selection', runId],
    queryFn: () => runsApi.get(projectId, 'ic_selection', runId!),
    enabled: !!runId,
  })
  const selections = usePhaseSelections(projectId)

  const designs = getIcDesigns(run?.output_payload)
  const savedId = selections.get('ic_selection', runId)?.selected_ids[0]
  const selectedDesignId =
    savedId && designs.some((d) => d.id === savedId)
      ? savedId
      : designs.length === 1
      ? designs[0].id
      : null

  return {
    icSelectionRun: run ?? null,
    selectedDesignId,
    saveError: selections.save.isError,
    setDesignId: (id: string) => {
      if (runId) selections.save.mutate({ phaseId: 'ic_selection', sourceRunId: runId, ids: [id] })
    },
  }
}
