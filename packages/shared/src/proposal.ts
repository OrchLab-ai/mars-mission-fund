import { z } from 'zod'

export const ProposalStatusSchema = z.enum([
  'Draft',
  'Submitted',
  'Under Review',
  'Approved',
  'Rejected',
  'Live',
  'Funded',
  'Suspended',
  'Failed',
  'Settlement',
  'Complete',
  'Cancelled',
])

export const ProposalCategorySchema = z.enum([
  'Propulsion',
  'Entry, Descent & Landing',
  'Power & Energy',
  'Habitats & Construction',
  'Life Support & Crew Health',
  'Food & Water Production',
  'In-Situ Resource Utilisation',
  'Radiation Protection',
  'Robotics & Automation',
  'Communications & Navigation',
])

export const MilestoneStatusSchema = z.enum(['Pending', 'Submitted', 'Verified', 'Returned'])

export const MilestoneSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  targetDate: z.coerce.date().nullable(),
  fundingPercentage: z.coerce.number(),
  verificationCriteria: z.string().nullable(),
  status: MilestoneStatusSchema,
  sortOrder: z.number().int(),
  evidenceDescription: z.string().nullable().optional(),
  evidenceUrl: z.string().nullable().optional(),
  evidenceSubmittedAt: z.string().datetime().nullable().optional(),
  feedback: z.string().nullable().optional(),
})

export const StretchGoalSchema = z.object({
  id: z.string().uuid(),
  targetAmount: z.coerce.number().int(),
  description: z.string(),
  deliverables: z.string().nullable(),
  unlocked: z.boolean(),
  sortOrder: z.number().int(),
})

export const TeamMemberSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  role: z.string(),
  bio: z.string().nullable(),
  sortOrder: z.number().int(),
})

export const ProposalUpdateSchema = z.object({
  id: z.string().uuid(),
  body: z.string(),
  postedAt: z.coerce.date(),
})

// Summary shape returned by the list endpoint
export const ProposalSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  summary: z.string(),
  status: ProposalStatusSchema,
  category: ProposalCategorySchema,
  heroImageUrl: z.string().url().nullable(),
  goalAmount: z.coerce.number().int(),
  raisedAmount: z.coerce.number().int(),
  contributorCount: z.number().int(),
  deadline: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  createdBy: z.string().uuid().nullable(),
})

// Full proposal returned by the detail endpoint
export const ProposalDetailSchema = ProposalSummarySchema.extend({
  slug: z.string(),
  description: z.string(),
  alignmentStatement: z.string(),
  tags: z.array(z.string()),
  maxFundingCapUsd: z.coerce.number().int(),
  launchedAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date(),
  creatorId: z.string().uuid().nullable(),
  reviewerId: z.string().uuid().nullable(),
  cancellationRequestedAt: z.coerce.date().nullable(),
  riskDisclosures: z.array(z.string()).default([]),
  milestones: z.array(MilestoneSchema),
  stretchGoals: z.array(StretchGoalSchema),
  teamMembers: z.array(TeamMemberSchema),
  updates: z.array(ProposalUpdateSchema),
})

export const AuditLogEntrySchema = z.object({
  id: z.string().uuid(),
  proposalId: z.string().uuid(),
  previousState: ProposalStatusSchema.nullable(),
  newState: ProposalStatusSchema,
  actorId: z.string().uuid(),
  rationale: z.string().nullable(),
  createdAt: z.coerce.date(),
})

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  proposalId: z.string().uuid().nullable(),
  read: z.boolean(),
  createdAt: z.coerce.date(),
})

export const MilestoneEvidenceSchema = z.object({
  id: z.string().uuid(),
  milestoneId: z.string().uuid(),
  proposalId: z.string().uuid(),
  submittedBy: z.string().uuid(),
  evidenceType: z.string(),
  evidenceUrl: z.string().url(),
  description: z.string().nullable(),
  submittedAt: z.coerce.date(),
})

export const CreateMilestoneRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  targetDate: z.coerce.date().nullable().optional(),
  fundingPercentage: z.number().min(0).max(100),
  verificationCriteria: z.string().nullable().optional(),
  sortOrder: z.number().int(),
})

export const CreateTeamMemberRequestSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().nullable().optional(),
  sortOrder: z.number().int(),
})

export const CreateProposalRequestSchema = z.object({
  title: z.string().min(1).max(200),
  category: ProposalCategorySchema,
  summary: z.string().max(280).optional().default(''),
  description: z.string().optional().default(''),
  alignmentStatement: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  heroImageUrl: z.string().url().nullable().optional(),
  minFundingTargetUsd: z.number().int().positive().optional(),
  maxFundingCapUsd: z.number().int().positive().optional(),
  deadline: z.coerce.date().nullable().optional(),
  riskDisclosures: z.array(z.string()).optional().default([]),
  milestones: z.array(CreateMilestoneRequestSchema).optional().default([]),
  teamMembers: z.array(CreateTeamMemberRequestSchema).optional().default([]),
})

export const UpdateProposalRequestSchema = CreateProposalRequestSchema.partial()
  .omit({ category: true })
  .extend({ category: ProposalCategorySchema.optional() })

export type CreateMilestoneRequest = z.infer<typeof CreateMilestoneRequestSchema>
export type CreateTeamMemberRequest = z.infer<typeof CreateTeamMemberRequestSchema>
export type CreateProposalRequest = z.infer<typeof CreateProposalRequestSchema>
export type UpdateProposalRequest = z.infer<typeof UpdateProposalRequestSchema>

export type ProposalStatus = z.infer<typeof ProposalStatusSchema>
export type ProposalCategory = z.infer<typeof ProposalCategorySchema>
export type MilestoneStatus = z.infer<typeof MilestoneStatusSchema>
export type Milestone = z.infer<typeof MilestoneSchema>
export type StretchGoal = z.infer<typeof StretchGoalSchema>
export type TeamMember = z.infer<typeof TeamMemberSchema>
export type ProposalUpdate = z.infer<typeof ProposalUpdateSchema>
export type ProposalSummary = z.infer<typeof ProposalSummarySchema>
export type ProposalDetail = z.infer<typeof ProposalDetailSchema>
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>
export type Notification = z.infer<typeof NotificationSchema>
export type MilestoneEvidence = z.infer<typeof MilestoneEvidenceSchema>
