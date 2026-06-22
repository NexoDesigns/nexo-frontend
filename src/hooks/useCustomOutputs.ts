import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customOutputsApi } from '@/lib/api'
import type { CreateCustomOutputPayload, CustomOutputItem } from '@/types'

export function useCustomOutputs(
  projectId: string,
  phaseId: string,
  runId: string | null
) {
  const queryClient = useQueryClient()
  const queryKey = ['custom-outputs', projectId, phaseId, runId]

  const { data: items = [] } = useQuery({
    queryKey,
    queryFn: () => customOutputsApi.list(projectId, phaseId, runId!),
    enabled: !!runId,
  })

  const addItem = useMutation({
    mutationFn: (payload: CreateCustomOutputPayload) =>
      customOutputsApi.create(projectId, phaseId, runId!, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const updateItem = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Record<string, unknown> }) =>
      customOutputsApi.update(projectId, phaseId, runId!, itemId, { data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const deleteItem = useMutation({
    mutationFn: (itemId: string) =>
      customOutputsApi.delete(projectId, phaseId, runId!, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return {
    items: items as CustomOutputItem[],
    addItem,
    updateItem,
    deleteItem,
  }
}
