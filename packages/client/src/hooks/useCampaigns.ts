import { useQuery } from '@tanstack/react-query'
import { fetchCampaigns } from '../api/campaigns'
import type { CampaignFilterParams } from '../api/campaigns'

export function useCampaigns(filters?: CampaignFilterParams) {
  return useQuery({
    queryKey: ['campaigns', filters],
    queryFn: () => fetchCampaigns(filters),
  })
}
