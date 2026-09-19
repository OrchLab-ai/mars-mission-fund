import { useQuery } from '@tanstack/react-query'
import { fetchProposals } from '../api/proposals'
import type { ProposalFilterParams } from '../api/proposals'

export function useProposals(filters?: ProposalFilterParams) {
  return useQuery({
    queryKey: ['proposals', filters],
    queryFn: () => fetchProposals(filters),
  })
}
