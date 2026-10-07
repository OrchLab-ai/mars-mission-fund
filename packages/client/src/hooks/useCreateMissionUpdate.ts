import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createMissionUpdate,
  type CreateMissionUpdateRequest,
  type MissionUpdate,
} from '../api/proposals'

export function useCreateMissionUpdate(id: string) {
  const queryClient = useQueryClient()
  return useMutation<MissionUpdate, Error, CreateMissionUpdateRequest>({
    mutationFn: (data) => createMissionUpdate(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['proposal', id, 'mission-updates'] }),
  })
}
