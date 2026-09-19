import { z } from 'zod'
import {
  ProposalStatusSchema,
  ProposalCategorySchema,
  ProposalSummarySchema,
  ProposalDetailSchema,
  CreateProposalRequestSchema,
  UpdateProposalRequestSchema,
} from '@mmf/shared'

export {
  ProposalStatusSchema,
  ProposalCategorySchema,
  ProposalSummarySchema,
  ProposalDetailSchema,
  CreateProposalRequestSchema,
  UpdateProposalRequestSchema,
}
export type {
  ProposalStatus,
  ProposalCategory,
  ProposalSummary,
  ProposalDetail,
  CreateProposalRequest,
  UpdateProposalRequest,
} from '@mmf/shared'

export const RouteParamsSchema = z.object({
  id: z.string().uuid(),
})

export const SubmitRouteParamsSchema = z.object({
  id: z.string().uuid(),
})

export const MilestoneRouteParamsSchema = z.object({
  id: z.string().uuid(),
  mid: z.string().uuid(),
})

export const ListQuerySchema = z.object({
  status: ProposalStatusSchema.optional(),
  category: ProposalCategorySchema.optional(),
  categories: z
    .preprocess((v) => (typeof v === 'string' ? v.split(',') : v), z.array(ProposalCategorySchema))
    .optional(),
  search: z.string().max(200).optional(),
  createdBy: z.literal('me').optional(),
})

export const PostUpdateBodySchema = z.object({
  body: z.string().min(1).max(10000),
})

export const ContributeBodySchema = z.object({
  amountUsd: z.number().int().positive(),
})

export const SubmitEvidenceBodySchema = z.object({
  evidenceDescription: z.string().min(1),
  evidenceUrl: z.string().url().optional(),
})

export const ReturnMilestoneBodySchema = z.object({
  feedback: z.string().min(1),
})

export type RouteParams = z.infer<typeof RouteParamsSchema>
export type SubmitRouteParams = z.infer<typeof SubmitRouteParamsSchema>
export type MilestoneRouteParams = z.infer<typeof MilestoneRouteParamsSchema>
export type ListQuery = z.infer<typeof ListQuerySchema>
export type PostUpdateBody = z.infer<typeof PostUpdateBodySchema>
export type ContributeBody = z.infer<typeof ContributeBodySchema>
export type SubmitEvidenceBody = z.infer<typeof SubmitEvidenceBodySchema>
export type ReturnMilestoneBody = z.infer<typeof ReturnMilestoneBodySchema>

export const ClaimBodySchema = z.object({})
export const ApproveBodySchema = z.object({ notes: z.string().min(1) })
export const RejectBodySchema = z.object({
  rationale: z.string().min(1),
  guidance: z.string().min(1),
})
export const ResubmitBodySchema = z.object({})

export type ClaimBody = z.infer<typeof ClaimBodySchema>
export type ApproveBody = z.infer<typeof ApproveBodySchema>
export type RejectBody = z.infer<typeof RejectBodySchema>
export type ResubmitBody = z.infer<typeof ResubmitBodySchema>
