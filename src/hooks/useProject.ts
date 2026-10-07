import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'

/** One project, shared by the project layout and its tab/phase pages via the cache. */
export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id),
  })
}
