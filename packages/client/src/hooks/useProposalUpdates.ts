import { useQuery } from '@tanstack/react-query'
import { fetchProposalUpdates, type ProposalUpdate } from '../api/proposals'

export function useProposalUpdates(id: string) {
  return useQuery<ProposalUpdate[], Error>({
    queryKey: ['proposal-updates', id],
    queryFn: () => fetchProposalUpdates(id),
    staleTime: 0,
  })
}
