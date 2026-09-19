import { ProposalSummarySchema, ProposalDetailSchema } from '@mmf/shared'
import type {
  ProposalSummary,
  ProposalDetail,
  Milestone,
  StretchGoal,
  TeamMember,
  ProposalUpdate,
  CreateProposalRequest,
  UpdateProposalRequest,
} from '@mmf/shared'
import { authedFetch } from './client'

export type {
  ProposalSummary,
  ProposalDetail,
  Milestone,
  StretchGoal,
  TeamMember,
  ProposalUpdate,
  CreateProposalRequest,
  UpdateProposalRequest,
}

export interface ProposalFilterParams {
  search?: string
  categories?: string[]
}

export async function fetchProposals(filters?: ProposalFilterParams): Promise<ProposalSummary[]> {
  const params = new URLSearchParams()
  if (filters?.search) params.set('search', filters.search)
  if (filters?.categories && filters.categories.length > 0)
    params.set('categories', filters.categories.join(','))
  const qs = params.toString()
  const response = await fetch(qs ? `/v1/proposals?${qs}` : '/v1/proposals')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const json = await response.json()
  return (json.data as unknown[]).map((item) => ProposalSummarySchema.parse(item))
}

export async function fetchProposal(id: string): Promise<ProposalDetail> {
  const response = await fetch(`/v1/proposals/${id}`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const json = await response.json()
  return ProposalDetailSchema.parse(json.data)
}

export async function fetchReviewQueue(): Promise<ProposalSummary[]> {
  const response = await authedFetch('/v1/proposals/review-queue')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const json = await response.json()
  return (json.data as unknown[]).map((item) => ProposalSummarySchema.parse(item))
}

export async function claimProposal(id: string): Promise<void> {
  const response = await authedFetch(`/v1/proposals/${id}/claim`, { method: 'POST' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function approveProposal(id: string, notes: string): Promise<void> {
  const response = await authedFetch(`/v1/proposals/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function rejectProposal(
  id: string,
  rationale: string,
  guidance: string
): Promise<void> {
  const response = await authedFetch(`/v1/proposals/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rationale, guidance }),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function resubmitProposal(id: string): Promise<void> {
  const response = await authedFetch(`/v1/proposals/${id}/resubmit`, { method: 'POST' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function fetchMyProposals(): Promise<ProposalSummary[]> {
  const response = await authedFetch('/v1/proposals?createdBy=me')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const json = await response.json()
  return (json.data as unknown[]).map((item) => ProposalSummarySchema.parse(item))
}

export async function createProposal(data: CreateProposalRequest): Promise<ProposalDetail> {
  const response = await authedFetch('/v1/proposals', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const json = await response.json()
  return ProposalDetailSchema.parse(json.data)
}

export async function updateProposal(
  id: string,
  data: UpdateProposalRequest
): Promise<ProposalDetail> {
  const response = await authedFetch(`/v1/proposals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const json = await response.json()
  return ProposalDetailSchema.parse(json.data)
}

export async function deleteProposal(id: string): Promise<void> {
  const response = await authedFetch(`/v1/proposals/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function submitProposalForReview(id: string): Promise<void> {
  const response = await authedFetch(`/v1/proposals/${id}/submit`, { method: 'POST' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function launchProposal(id: string): Promise<void> {
  const response = await authedFetch(`/v1/proposals/${id}/launch`, { method: 'POST' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function postProposalUpdate(id: string, body: string): Promise<void> {
  const response = await authedFetch(`/v1/proposals/${id}/update`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function submitMilestoneEvidence(
  id: string,
  mid: string,
  data: { evidenceDescription: string; evidenceUrl?: string }
): Promise<void> {
  const response = await authedFetch(`/v1/proposals/${id}/milestones/${mid}/submit-evidence`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function verifyMilestone(proposalId: string, milestoneId: string): Promise<void> {
  const response = await authedFetch(
    `/v1/proposals/${proposalId}/milestones/${milestoneId}/verify`,
    { method: 'POST' }
  )
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function returnMilestone(
  proposalId: string,
  milestoneId: string,
  feedback: string
): Promise<void> {
  const response = await authedFetch(
    `/v1/proposals/${proposalId}/milestones/${milestoneId}/return`,
    {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    }
  )
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function cancelProposal(id: string): Promise<void> {
  const response = await authedFetch(`/v1/proposals/${id}/cancel`, { method: 'POST' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function approveCancel(id: string): Promise<void> {
  const response = await authedFetch(`/v1/proposals/${id}/approve-cancel`, { method: 'POST' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}
