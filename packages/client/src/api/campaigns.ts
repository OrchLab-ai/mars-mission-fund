import { CampaignSummarySchema, CampaignDetailSchema } from '@mmf/shared'
import type {
  CampaignSummary,
  CampaignDetail,
  Milestone,
  StretchGoal,
  TeamMember,
  CreateCampaignRequest,
  UpdateCampaignRequest,
} from '@mmf/shared'
import { authedFetch } from './client'

export type {
  CampaignSummary,
  CampaignDetail,
  Milestone,
  StretchGoal,
  TeamMember,
  CreateCampaignRequest,
  UpdateCampaignRequest,
}

export interface CampaignFilterParams {
  search?: string
  categories?: string[]
}

export async function fetchCampaigns(filters?: CampaignFilterParams): Promise<CampaignSummary[]> {
  const params = new URLSearchParams()
  if (filters?.search) params.set('search', filters.search)
  if (filters?.categories && filters.categories.length > 0)
    params.set('categories', filters.categories.join(','))
  const qs = params.toString()
  const response = await fetch(qs ? `/v1/campaigns?${qs}` : '/v1/campaigns')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const json = await response.json()
  return (json.data as unknown[]).map((item) => CampaignSummarySchema.parse(item))
}

export async function fetchCampaign(id: string): Promise<CampaignDetail> {
  const response = await fetch(`/v1/campaigns/${id}`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const json = await response.json()
  return CampaignDetailSchema.parse(json.data)
}

export async function fetchReviewQueue(): Promise<CampaignSummary[]> {
  const response = await authedFetch('/v1/campaigns/review-queue')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const json = await response.json()
  return (json.data as unknown[]).map((item) => CampaignSummarySchema.parse(item))
}

export async function claimCampaign(id: string): Promise<void> {
  const response = await authedFetch(`/v1/campaigns/${id}/claim`, { method: 'POST' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function approveCampaign(id: string, notes: string): Promise<void> {
  const response = await authedFetch(`/v1/campaigns/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function rejectCampaign(
  id: string,
  rationale: string,
  guidance: string
): Promise<void> {
  const response = await authedFetch(`/v1/campaigns/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rationale, guidance }),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function resubmitCampaign(id: string): Promise<void> {
  const response = await authedFetch(`/v1/campaigns/${id}/resubmit`, { method: 'POST' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function fetchMyCampaigns(): Promise<CampaignSummary[]> {
  const response = await authedFetch('/v1/campaigns?createdBy=me')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const json = await response.json()
  return (json.data as unknown[]).map((item) => CampaignSummarySchema.parse(item))
}

export async function createCampaign(data: CreateCampaignRequest): Promise<CampaignDetail> {
  const response = await authedFetch('/v1/campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const json = await response.json()
  return CampaignDetailSchema.parse(json.data)
}

export async function updateCampaign(
  id: string,
  data: UpdateCampaignRequest
): Promise<CampaignDetail> {
  const response = await authedFetch(`/v1/campaigns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const json = await response.json()
  return CampaignDetailSchema.parse(json.data)
}

export async function deleteCampaign(id: string): Promise<void> {
  const response = await authedFetch(`/v1/campaigns/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function submitCampaignForReview(id: string): Promise<void> {
  const response = await authedFetch(`/v1/campaigns/${id}/submit`, { method: 'POST' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function launchCampaign(id: string): Promise<void> {
  const response = await authedFetch(`/v1/campaigns/${id}/launch`, { method: 'POST' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function submitMilestoneEvidence(
  id: string,
  mid: string,
  data: { evidenceDescription: string; evidenceUrl?: string }
): Promise<void> {
  const response = await authedFetch(`/v1/campaigns/${id}/milestones/${mid}/submit-evidence`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function verifyMilestone(campaignId: string, milestoneId: string): Promise<void> {
  const response = await authedFetch(
    `/v1/campaigns/${campaignId}/milestones/${milestoneId}/verify`,
    { method: 'POST' }
  )
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function returnMilestone(
  campaignId: string,
  milestoneId: string,
  feedback: string
): Promise<void> {
  const response = await authedFetch(
    `/v1/campaigns/${campaignId}/milestones/${milestoneId}/return`,
    {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    }
  )
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function cancelCampaign(id: string): Promise<void> {
  const response = await authedFetch(`/v1/campaigns/${id}/cancel`, { method: 'POST' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function approveCancel(id: string): Promise<void> {
  const response = await authedFetch(`/v1/campaigns/${id}/approve-cancel`, { method: 'POST' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}
