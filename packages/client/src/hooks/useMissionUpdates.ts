import { useQuery } from '@tanstack/react-query'
import { listMissionUpdates, type MissionUpdate } from '../api/proposals'

export function useMissionUpdates(id: string) {
  return useQuery<MissionUpdate[], Error>({
    queryKey: ['proposal', id, 'mission-updates'],
    queryFn: () => listMissionUpdates(id),
    staleTime: 0,
  })
}
