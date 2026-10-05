import { useQuery } from '@tanstack/react-query'
import { fetchTrendingProposals } from '../api/proposals'

export function useTrendingProposals() {
  return useQuery({
    queryKey: ['proposals', 'trending'],
    queryFn: fetchTrendingProposals,
  })
}
