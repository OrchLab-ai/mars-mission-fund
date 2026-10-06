import { useEffect } from 'react'
import { useParams } from 'react-router'
import { useCampaign } from '../hooks/useCampaign'
import { CampaignFormPage } from './CampaignFormPage'

export function CampaignEditPage() {
  const { id } = useParams<{ id: string }>()
  const { data: campaign } = useCampaign(id ?? '')

  useEffect(() => {
    if (campaign) {
      document.title = `${campaign.title} — Edit — Mars Mission Fund`
    }
  }, [campaign])

  return <CampaignFormPage campaignId={id} />
}
