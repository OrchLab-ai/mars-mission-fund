import { useQuery } from '@tanstack/react-query'
import { fetchProposal, type ProposalDetail } from '../api/proposals'

export function useProposal(id: string) {
  return useQuery<ProposalDetail, Error>({
    queryKey: ['proposal', id],
    queryFn: () => fetchProposal(id),
    staleTime: 0,
  })
}
