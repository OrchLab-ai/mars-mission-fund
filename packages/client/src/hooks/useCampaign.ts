import { useQuery } from '@tanstack/react-query'
import { fetchCampaign, type CampaignDetail } from '../api/campaigns'

export function useCampaign(id: string) {
  return useQuery<CampaignDetail, Error>({
    queryKey: ['campaign', id],
    queryFn: () => fetchCampaign(id),
    staleTime: 0,
  })
}
