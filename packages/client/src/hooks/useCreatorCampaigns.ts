import { useQuery } from '@tanstack/react-query'
import { fetchMyCampaigns, type CampaignSummary } from '../api/campaigns'

export function useCreatorCampaigns() {
  return useQuery<CampaignSummary[], Error>({
    queryKey: ['my-campaigns'],
    queryFn: fetchMyCampaigns,
    staleTime: 0,
  })
}
