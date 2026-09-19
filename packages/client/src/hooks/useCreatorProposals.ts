import { useQuery } from '@tanstack/react-query'
import { fetchMyProposals, type ProposalSummary } from '../api/proposals'

export function useCreatorProposals() {
  return useQuery<ProposalSummary[], Error>({
    queryKey: ['my-proposals'],
    queryFn: fetchMyProposals,
    staleTime: 0,
  })
}
