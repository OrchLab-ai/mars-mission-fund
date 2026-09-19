import { randomBytes } from 'crypto'
import { Pool } from 'pg'
import {
  ProposalSummary,
  ProposalDetail,
  ProposalStatus,
  ListQuery,
  CreateProposalRequest,
  UpdateProposalRequest,
  SubmitEvidenceBody,
} from './types.js'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function randomHex(bytes: number): string {
  return randomBytes(bytes).toString('hex')
}

export interface ProposalAuditEventInput {
  proposalId: string
  actorId: string
  eventType: string
  previousState: string | null
  newState: string
  metadata?: Record<string, unknown>
}

export interface NotificationInput {
  userId: string
  proposalId?: string | null
  type: string
  title: string
  message: string
}

export interface ProposalRow {
  id: string
  title: string
  summary: string
  status: string
  category: string
  heroImageUrl: string | null
  goalAmount: number
  raisedAmount: number
  contributorCount: number
  deadline: Date | null
  createdAt: Date
  slug: string
  description: string
  alignmentStatement: string
  tags: string[]
  maxFundingCapUsd: number
  launchedAt: Date | null
  updatedAt: Date
  creatorId: string | null
  reviewerId: string | null
}

export interface ProposalStateRow {
  id: string
  status: ProposalStatus
  creatorId: string | null
  currentAmountUsd: number
  minFundingTargetUsd: number
  maxFundingCapUsd: number
  contributorCount: number
  deadline: Date | null
  cancellationRequestedAt: Date | null
  launchedAt: Date | null
}

export interface LaunchResult {
  id: string
  status: ProposalStatus
  launchedAt: Date
}

export interface PostUpdateResult {
  id: string
  body: string
  postedAt: Date
}

export interface ContributeResult {
  currentAmountUsd: number
  contributorCount: number
  status: ProposalStatus
}

export async function listProposals(
  pool: Pool,
  filters: ListQuery,
  creatorId?: string
): Promise<ProposalSummary[]> {
  const conditions: string[] = []
  const params: unknown[] = []

  if (filters.status !== undefined) {
    params.push(filters.status)
    conditions.push(`status = $${params.length}`)
  }

  if (filters.category !== undefined) {
    params.push(filters.category)
    conditions.push(`category = $${params.length}`)
  }

  if (filters.categories !== undefined && filters.categories.length > 0) {
    params.push(filters.categories)
    conditions.push(`category = ANY($${params.length})`)
  }

  if (filters.search !== undefined) {
    const term = `%${filters.search}%`
    params.push(term)
    const idx = params.length
    conditions.push(`(title ILIKE $${idx} OR summary ILIKE $${idx})`)
  }

  if (creatorId !== undefined) {
    params.push(creatorId)
    conditions.push(`creator_id = $${params.length}`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const sql = `
    SELECT
      id,
      title,
      summary,
      status,
      category,
      hero_image_url AS "heroImageUrl",
      min_funding_target_usd AS "goalAmount",
      current_amount_usd AS "raisedAmount",
      contributor_count AS "contributorCount",
      deadline,
      created_at AS "createdAt",
      created_by AS "createdBy"
    FROM proposals
    ${where}
    ORDER BY created_at DESC
  `

  const result = await pool.query<ProposalSummary>(sql, params)
  return result.rows
}

export async function getProposalById(pool: Pool, id: string): Promise<ProposalDetail | null> {
  const proposalSql = `
    SELECT
      id,
      title,
      summary,
      status,
      category,
      hero_image_url AS "heroImageUrl",
      min_funding_target_usd AS "goalAmount",
      current_amount_usd AS "raisedAmount",
      contributor_count AS "contributorCount",
      deadline,
      created_at AS "createdAt",
      created_by AS "createdBy",
      slug,
      description,
      alignment_statement AS "alignmentStatement",
      tags,
      max_funding_cap_usd AS "maxFundingCapUsd",
      launched_at AS "launchedAt",
      updated_at AS "updatedAt",
      creator_id AS "creatorId",
      reviewer_id AS "reviewerId",
      cancellation_requested_at AS "cancellationRequestedAt",
      risk_disclosures AS "riskDisclosures"
    FROM proposals
    WHERE id = $1
  `

  const proposalResult = await pool.query(proposalSql, [id])
  if (proposalResult.rowCount === 0) {
    return null
  }
  const proposal = proposalResult.rows[0]

  const milestonesResult = await pool.query(
    `SELECT
      id,
      title,
      description,
      target_date AS "targetDate",
      funding_pct AS "fundingPercentage",
      verification_criteria AS "verificationCriteria",
      status,
      sort_order AS "sortOrder",
      evidence_description AS "evidenceDescription",
      evidence_url AS "evidenceUrl",
      evidence_submitted_at AS "evidenceSubmittedAt",
      feedback
    FROM proposal_milestones
    WHERE proposal_id = $1
    ORDER BY sort_order`,
    [id]
  )

  const stretchGoalsResult = await pool.query(
    `SELECT
      id,
      target_usd AS "targetAmount",
      description,
      deliverables,
      sort_order AS "sortOrder"
    FROM proposal_stretch_goals
    WHERE proposal_id = $1
    ORDER BY sort_order`,
    [id]
  )

  const teamMembersResult = await pool.query(
    `SELECT
      id,
      name,
      role,
      bio,
      sort_order AS "sortOrder"
    FROM proposal_team_members
    WHERE proposal_id = $1
    ORDER BY sort_order`,
    [id]
  )

  const updatesResult = await pool.query(
    `SELECT
      id,
      body,
      posted_at AS "postedAt"
    FROM proposal_updates
    WHERE proposal_id = $1
    ORDER BY posted_at DESC`,
    [id]
  )

  const stretchGoals = stretchGoalsResult.rows.map((goal) => ({
    ...goal,
    unlocked: goal.targetAmount <= proposal.raisedAmount,
  }))

  const detail: ProposalDetail = {
    ...proposal,
    milestones: milestonesResult.rows,
    stretchGoals,
    teamMembers: teamMembersResult.rows,
    updates: updatesResult.rows,
  }

  return detail
}

export async function createProposal(
  pool: Pool,
  creatorId: string,
  data: CreateProposalRequest
): Promise<ProposalDetail> {
  const slug = `${slugify(data.title)}-${randomHex(3)}`

  const result = await pool.query(
    `INSERT INTO proposals (
      title, category, summary, description, alignment_statement, tags,
      hero_image_url, min_funding_target_usd, max_funding_cap_usd, deadline,
      risk_disclosures, creator_id, status, slug,
      current_amount_usd, contributor_count
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Draft', $13, 0, 0)
    RETURNING id`,
    [
      data.title,
      data.category,
      data.summary ?? '',
      data.description ?? '',
      data.alignmentStatement ?? '',
      data.tags ?? [],
      data.heroImageUrl ?? null,
      data.minFundingTargetUsd ?? 0,
      data.maxFundingCapUsd ?? 0,
      data.deadline ?? null,
      data.riskDisclosures ?? [],
      creatorId,
      slug,
    ]
  )

  const proposalId = result.rows[0].id

  await pool.query(
    `INSERT INTO proposal_audit_events (proposal_id, event_type, actor_id, previous_state, new_state)
     VALUES ($1, 'proposal.created', $2, NULL, 'Draft')`,
    [proposalId, creatorId]
  )

  if (data.milestones !== undefined && data.milestones.length > 0) {
    await pool.query(`DELETE FROM proposal_milestones WHERE proposal_id = $1`, [proposalId])
    for (const m of data.milestones) {
      await pool.query(
        `INSERT INTO proposal_milestones (proposal_id, title, description, target_date, funding_pct, verification_criteria, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          proposalId,
          m.title,
          m.description ?? '',
          m.targetDate ?? null,
          m.fundingPercentage,
          m.verificationCriteria ?? '',
          m.sortOrder,
        ]
      )
    }
  }

  if (data.teamMembers !== undefined && data.teamMembers.length > 0) {
    await pool.query(`DELETE FROM proposal_team_members WHERE proposal_id = $1`, [proposalId])
    for (const t of data.teamMembers) {
      await pool.query(
        `INSERT INTO proposal_team_members (proposal_id, name, role, bio, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [proposalId, t.name, t.role, t.bio ?? '', t.sortOrder]
      )
    }
  }

  const proposal = await getProposalById(pool, proposalId)
  return proposal!
}

type WriteResult = {
  proposal: ProposalDetail | null
  reason: 'not_found' | 'forbidden' | 'not_draft' | null
}

export async function updateProposal(
  pool: Pool,
  id: string,
  creatorId: string,
  data: UpdateProposalRequest
): Promise<WriteResult> {
  const check = await pool.query(`SELECT id, creator_id, status FROM proposals WHERE id = $1`, [id])

  if (check.rowCount === 0) {
    return { proposal: null, reason: 'not_found' }
  }

  const row = check.rows[0]
  if (row.creator_id !== creatorId) {
    return { proposal: null, reason: 'forbidden' }
  }
  if (row.status !== 'Draft') {
    return { proposal: null, reason: 'not_draft' }
  }

  const setClauses: string[] = ['updated_at = now()']
  const params: unknown[] = [id]

  const fields: Array<[keyof UpdateProposalRequest, string]> = [
    ['title', 'title'],
    ['category', 'category'],
    ['summary', 'summary'],
    ['description', 'description'],
    ['alignmentStatement', 'alignment_statement'],
    ['tags', 'tags'],
    ['heroImageUrl', 'hero_image_url'],
    ['minFundingTargetUsd', 'min_funding_target_usd'],
    ['maxFundingCapUsd', 'max_funding_cap_usd'],
    ['deadline', 'deadline'],
    ['riskDisclosures', 'risk_disclosures'],
  ]

  for (const [key, col] of fields) {
    if (data[key] !== undefined) {
      params.push(data[key])
      setClauses.push(`${col} = $${params.length}`)
    }
  }

  await pool.query(`UPDATE proposals SET ${setClauses.join(', ')} WHERE id = $1`, params)

  if (data.milestones !== undefined && data.milestones.length > 0) {
    await pool.query(`DELETE FROM proposal_milestones WHERE proposal_id = $1`, [id])
    for (const m of data.milestones) {
      await pool.query(
        `INSERT INTO proposal_milestones (proposal_id, title, description, target_date, funding_pct, verification_criteria, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          id,
          m.title,
          m.description ?? '',
          m.targetDate ?? null,
          m.fundingPercentage,
          m.verificationCriteria ?? '',
          m.sortOrder,
        ]
      )
    }
  }

  if (data.teamMembers !== undefined && data.teamMembers.length > 0) {
    await pool.query(`DELETE FROM proposal_team_members WHERE proposal_id = $1`, [id])
    for (const t of data.teamMembers) {
      await pool.query(
        `INSERT INTO proposal_team_members (proposal_id, name, role, bio, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, t.name, t.role, t.bio ?? '', t.sortOrder]
      )
    }
  }

  const proposal = await getProposalById(pool, id)
  return { proposal, reason: null }
}

export async function deleteProposal(
  pool: Pool,
  id: string,
  creatorId: string
): Promise<WriteResult> {
  const check = await pool.query(`SELECT id, creator_id, status FROM proposals WHERE id = $1`, [id])

  if (check.rowCount === 0) {
    return { proposal: null, reason: 'not_found' }
  }

  const row = check.rows[0]
  if (row.creator_id !== creatorId) {
    return { proposal: null, reason: 'forbidden' }
  }
  if (row.status !== 'Draft') {
    return { proposal: null, reason: 'not_draft' }
  }

  await pool.query(`DELETE FROM proposals WHERE id = $1`, [id])
  return { proposal: null, reason: null }
}

type SubmitResult = {
  proposal: ProposalDetail | null
  errors: string[]
}

export async function submitProposal(
  pool: Pool,
  id: string,
  creatorId: string
): Promise<SubmitResult> {
  const check = await pool.query(
    `SELECT
      id, creator_id, status,
      title, summary, description, alignment_statement,
      min_funding_target_usd, max_funding_cap_usd,
      deadline, risk_disclosures
    FROM proposals WHERE id = $1`,
    [id]
  )

  if (check.rowCount === 0) {
    return { proposal: null, errors: ['not_found'] }
  }

  const row = check.rows[0]

  if (row.creator_id !== creatorId) {
    return { proposal: null, errors: ['forbidden'] }
  }
  if (row.status !== 'Draft') {
    return { proposal: null, errors: ['not_draft'] }
  }

  // DEMO STUB: KYC always verified
  const kycVerified = true
  if (!kycVerified) {
    return { proposal: null, errors: ['KYC verification failed'] }
  }

  const errors: string[] = []

  // §4.2 field completeness checks
  if (!row.title || row.title.trim() === '') {
    errors.push('title is required')
  }
  if (!row.summary || row.summary.trim() === '') {
    errors.push('summary is required')
  }
  if (!row.description || row.description.trim() === '') {
    errors.push('description is required')
  }
  if (!row.alignment_statement || row.alignment_statement.trim() === '') {
    errors.push('alignmentStatement is required')
  }

  // §4.5 funding target constraints
  const minTarget = Number(row.min_funding_target_usd)
  const maxCap = Number(row.max_funding_cap_usd)
  if (minTarget < 1_000_000 || minTarget > 1_000_000_000) {
    errors.push('minFundingTargetUsd must be between 1,000,000 and 1,000,000,000')
  }
  if (maxCap < minTarget) {
    errors.push('maxFundingCapUsd must be greater than or equal to minFundingTargetUsd')
  }

  // §4.5 deadline constraints
  if (!row.deadline) {
    errors.push('deadline is required')
  } else {
    const now = new Date()
    const deadline = new Date(row.deadline)
    const daysFromNow = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    if (daysFromNow < 7) {
      errors.push('deadline must be at least 7 days from now')
    }
    if (daysFromNow > 365) {
      errors.push('deadline must be at most 365 days from now')
    }
  }

  // §4.5 risk disclosures
  const riskDisclosures: string[] = row.risk_disclosures ?? []
  if (riskDisclosures.length < 1) {
    errors.push('at least one risk disclosure is required')
  }

  // §4.5 team member and milestone constraints
  const teamResult = await pool.query(
    `SELECT COUNT(*) AS count FROM proposal_team_members WHERE proposal_id = $1`,
    [id]
  )
  const teamCount = Number(teamResult.rows[0].count)
  if (teamCount < 1) {
    errors.push('at least one team member is required')
  }

  const milestoneResult = await pool.query(
    `SELECT COUNT(*) AS count, COALESCE(SUM(funding_pct), 0) AS total_pct
     FROM proposal_milestones WHERE proposal_id = $1`,
    [id]
  )
  const milestoneCount = Number(milestoneResult.rows[0].count)
  const milestonePctSum = Number(milestoneResult.rows[0].total_pct)

  if (milestoneCount < 2) {
    errors.push('at least two milestones are required')
  }
  if (milestoneCount > 0 && milestonePctSum !== 100) {
    errors.push('milestone funding percentages must sum to 100')
  }

  if (errors.length > 0) {
    return { proposal: null, errors }
  }

  // Transition to Submitted
  await pool.query(`UPDATE proposals SET status = 'Submitted', updated_at = now() WHERE id = $1`, [
    id,
  ])

  await pool.query(
    `INSERT INTO proposal_audit_events (proposal_id, event_type, actor_id, previous_state, new_state)
     VALUES ($1, 'proposal.submitted', $2, 'Draft', 'Submitted')`,
    [id, creatorId]
  )

  const proposal = await getProposalById(pool, id)
  return { proposal, errors: [] }
}

const PROPOSAL_ROW_COLUMNS = `
  id,
  title,
  summary,
  status,
  category,
  hero_image_url AS "heroImageUrl",
  min_funding_target_usd AS "goalAmount",
  current_amount_usd AS "raisedAmount",
  contributor_count AS "contributorCount",
  deadline,
  created_at AS "createdAt",
  slug,
  description,
  alignment_statement AS "alignmentStatement",
  tags,
  max_funding_cap_usd AS "maxFundingCapUsd",
  launched_at AS "launchedAt",
  updated_at AS "updatedAt",
  creator_id AS "creatorId",
  reviewer_id AS "reviewerId"
`

export async function getReviewQueue(pool: Pool): Promise<ProposalSummary[]> {
  const sql = `
    SELECT
      id,
      title,
      summary,
      status,
      category,
      hero_image_url AS "heroImageUrl",
      min_funding_target_usd AS "goalAmount",
      current_amount_usd AS "raisedAmount",
      contributor_count AS "contributorCount",
      deadline,
      created_at AS "createdAt",
      created_by AS "createdBy"
    FROM proposals
    WHERE status = 'Submitted'
    ORDER BY created_at ASC
  `
  const result = await pool.query<ProposalSummary>(sql)
  return result.rows
}

export async function claimProposal(
  pool: Pool,
  id: string,
  reviewerId: string
): Promise<ProposalRow | null> {
  const sql = `
    UPDATE proposals
    SET status = 'Under Review', reviewer_id = $2
    WHERE id = $1
    RETURNING ${PROPOSAL_ROW_COLUMNS}
  `
  const result = await pool.query<ProposalRow>(sql, [id, reviewerId])
  return result.rows[0] ?? null
}

export async function approveProposal(
  pool: Pool,
  id: string,
  reviewerId: string
): Promise<ProposalRow | null> {
  const sql = `
    UPDATE proposals
    SET status = 'Approved'
    WHERE id = $1 AND reviewer_id = $2
    RETURNING ${PROPOSAL_ROW_COLUMNS}
  `
  const result = await pool.query<ProposalRow>(sql, [id, reviewerId])
  return result.rows[0] ?? null
}

export async function rejectProposal(
  pool: Pool,
  id: string,
  reviewerId: string
): Promise<ProposalRow | null> {
  const sql = `
    UPDATE proposals
    SET status = 'Rejected'
    WHERE id = $1 AND reviewer_id = $2
    RETURNING ${PROPOSAL_ROW_COLUMNS}
  `
  const result = await pool.query<ProposalRow>(sql, [id, reviewerId])
  return result.rows[0] ?? null
}

export async function resubmitProposal(
  pool: Pool,
  id: string,
  creatorId: string
): Promise<ProposalRow | null> {
  const sql = `
    UPDATE proposals
    SET status = 'Draft', reviewer_id = NULL
    WHERE id = $1 AND creator_id = $2
    RETURNING ${PROPOSAL_ROW_COLUMNS}
  `
  const result = await pool.query<ProposalRow>(sql, [id, creatorId])
  return result.rows[0] ?? null
}

export async function createAuditEvent(pool: Pool, event: ProposalAuditEventInput): Promise<void> {
  const sql = `
    INSERT INTO proposal_audit_events (proposal_id, event_type, actor_id, previous_state, new_state, metadata)
    VALUES ($1, $2, $3, $4, $5, $6)
  `
  await pool.query(sql, [
    event.proposalId,
    event.eventType,
    event.actorId,
    event.previousState,
    event.newState,
    JSON.stringify(event.metadata ?? {}),
  ])
}

export async function createNotification(
  pool: Pool,
  notification: NotificationInput
): Promise<void> {
  const sql = `
    INSERT INTO notifications (user_id, proposal_id, type, title, message)
    VALUES ($1, $2, $3, $4, $5)
  `
  await pool.query(sql, [
    notification.userId,
    notification.proposalId ?? null,
    notification.type,
    notification.title,
    notification.message,
  ])
}

export interface NotificationRow {
  id: string
  userId: string
  proposalId: string | null
  type: string
  title: string
  message: string
  read: boolean
  createdAt: Date
}

export async function markNotificationRead(
  pool: Pool,
  notificationId: string,
  userId: string
): Promise<void> {
  await pool.query(`UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`, [
    notificationId,
    userId,
  ])
}

export async function getNotificationsForUser(
  pool: Pool,
  userId: string
): Promise<NotificationRow[]> {
  const sql = `
    SELECT
      id,
      user_id AS "userId",
      proposal_id AS "proposalId",
      type,
      title,
      message,
      read,
      created_at AS "createdAt"
    FROM notifications
    WHERE user_id = $1
    ORDER BY created_at DESC
  `
  const result = await pool.query<NotificationRow>(sql, [userId])
  return result.rows
}

export async function getProposalState(pool: Pool, id: string): Promise<ProposalStateRow | null> {
  const result = await pool.query<ProposalStateRow>(
    `SELECT
      id,
      status,
      creator_id AS "creatorId",
      current_amount_usd AS "currentAmountUsd",
      min_funding_target_usd AS "minFundingTargetUsd",
      max_funding_cap_usd AS "maxFundingCapUsd",
      contributor_count AS "contributorCount",
      deadline,
      cancellation_requested_at AS "cancellationRequestedAt",
      launched_at AS "launchedAt"
    FROM proposals
    WHERE id = $1`,
    [id]
  )
  return result.rowCount === 0 ? null : (result.rows[0] ?? null)
}

export async function launchProposal(pool: Pool, id: string): Promise<LaunchResult> {
  const result = await pool.query<LaunchResult>(
    `UPDATE proposals
     SET status = 'Live', launched_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING id, status, launched_at AS "launchedAt"`,
    [id]
  )
  return result.rows[0]!
}

export async function postProposalUpdate(
  pool: Pool,
  proposalId: string,
  body: string
): Promise<PostUpdateResult> {
  const result = await pool.query<PostUpdateResult>(
    `INSERT INTO proposal_updates (proposal_id, body)
     VALUES ($1, $2)
     RETURNING id, body, posted_at AS "postedAt"`,
    [proposalId, body]
  )
  return result.rows[0]!
}

export async function recordContribution(
  pool: Pool,
  id: string,
  amountUsd: number,
  minFundingTargetUsd: number
): Promise<ContributeResult> {
  const result = await pool.query<ContributeResult>(
    `UPDATE proposals
     SET
       current_amount_usd = current_amount_usd + $2,
       contributor_count = contributor_count + 1,
       status = CASE WHEN status = 'Live' AND (current_amount_usd + $2) >= $3 THEN 'Funded' ELSE status END,
       updated_at = NOW()
     WHERE id = $1
     RETURNING
       current_amount_usd AS "currentAmountUsd",
       contributor_count AS "contributorCount",
       status`,
    [id, amountUsd, minFundingTargetUsd]
  )
  return result.rows[0]!
}

export async function cancelProposal(pool: Pool, id: string): Promise<ProposalStateRow> {
  const result = await pool.query<ProposalStateRow>(
    `UPDATE proposals
     SET status = 'Cancelled', updated_at = NOW()
     WHERE id = $1
     RETURNING
       id, status, creator_id AS "creatorId",
       current_amount_usd AS "currentAmountUsd",
       min_funding_target_usd AS "minFundingTargetUsd",
       max_funding_cap_usd AS "maxFundingCapUsd",
       contributor_count AS "contributorCount",
       deadline, cancellation_requested_at AS "cancellationRequestedAt",
       launched_at AS "launchedAt"`,
    [id]
  )
  return result.rows[0]!
}

export async function requestCancellation(pool: Pool, id: string): Promise<ProposalStateRow> {
  const result = await pool.query<ProposalStateRow>(
    `UPDATE proposals
     SET cancellation_requested_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING
       id, status, creator_id AS "creatorId",
       current_amount_usd AS "currentAmountUsd",
       min_funding_target_usd AS "minFundingTargetUsd",
       max_funding_cap_usd AS "maxFundingCapUsd",
       contributor_count AS "contributorCount",
       deadline, cancellation_requested_at AS "cancellationRequestedAt",
       launched_at AS "launchedAt"`,
    [id]
  )
  return result.rows[0]!
}

export async function approveCancellation(pool: Pool, id: string): Promise<ProposalStateRow> {
  const result = await pool.query<ProposalStateRow>(
    `UPDATE proposals
     SET status = 'Cancelled', cancellation_requested_at = NULL, updated_at = NOW()
     WHERE id = $1
     RETURNING
       id, status, creator_id AS "creatorId",
       current_amount_usd AS "currentAmountUsd",
       min_funding_target_usd AS "minFundingTargetUsd",
       max_funding_cap_usd AS "maxFundingCapUsd",
       contributor_count AS "contributorCount",
       deadline, cancellation_requested_at AS "cancellationRequestedAt",
       launched_at AS "launchedAt"`,
    [id]
  )
  return result.rows[0]!
}

export async function enforceDeadline(pool: Pool, id: string): Promise<ProposalStateRow> {
  const result = await pool.query<ProposalStateRow>(
    `UPDATE proposals
     SET status = 'Failed', updated_at = NOW()
     WHERE id = $1
     RETURNING
       id, status, creator_id AS "creatorId",
       current_amount_usd AS "currentAmountUsd",
       min_funding_target_usd AS "minFundingTargetUsd",
       max_funding_cap_usd AS "maxFundingCapUsd",
       contributor_count AS "contributorCount",
       deadline, cancellation_requested_at AS "cancellationRequestedAt",
       launched_at AS "launchedAt"`,
    [id]
  )
  return result.rows[0]!
}

export async function settleProposal(pool: Pool, proposalId: string): Promise<void> {
  await pool.query(`UPDATE proposals SET status = 'Settlement', updated_at = now() WHERE id = $1`, [
    proposalId,
  ])
}

export async function submitMilestoneEvidence(
  pool: Pool,
  proposalId: string,
  milestoneId: string,
  body: SubmitEvidenceBody
): Promise<void> {
  await pool.query(
    `UPDATE proposal_milestones
     SET status = 'Submitted',
         evidence_description = $3,
         evidence_url = $4,
         evidence_submitted_at = now()
     WHERE proposal_id = $1 AND id = $2`,
    [proposalId, milestoneId, body.evidenceDescription, body.evidenceUrl ?? null]
  )
}

export async function verifyMilestone(
  pool: Pool,
  proposalId: string,
  milestoneId: string
): Promise<{ allVerified: boolean }> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(
      `UPDATE proposal_milestones SET status = 'Verified' WHERE proposal_id = $1 AND id = $2`,
      [proposalId, milestoneId]
    )

    const checkResult = await client.query<{ unverified_count: string }>(
      `SELECT COUNT(*) AS unverified_count
       FROM proposal_milestones
       WHERE proposal_id = $1 AND status != 'Verified'`,
      [proposalId]
    )

    const allVerified = parseInt(checkResult.rows[0]?.unverified_count ?? '1', 10) === 0

    if (allVerified) {
      await client.query(
        `UPDATE proposals SET status = 'Complete', updated_at = now() WHERE id = $1`,
        [proposalId]
      )
    }

    await client.query('COMMIT')
    return { allVerified }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function returnMilestone(
  pool: Pool,
  proposalId: string,
  milestoneId: string,
  feedback: string
): Promise<void> {
  await pool.query(
    `UPDATE proposal_milestones
     SET status = 'Returned', feedback = $3
     WHERE proposal_id = $1 AND id = $2`,
    [proposalId, milestoneId, feedback]
  )
}

export async function cancelSettlement(pool: Pool, proposalId: string): Promise<void> {
  await pool.query(`UPDATE proposals SET status = 'Cancelled', updated_at = now() WHERE id = $1`, [
    proposalId,
  ])
}

export interface AuditLogEntry {
  eventType: string
  proposalId: string
  milestoneId?: string
  actorId: string
  payload: Record<string, unknown>
}

export async function insertAuditLog(pool: Pool, entry: AuditLogEntry): Promise<void> {
  await pool.query(
    `INSERT INTO audit_log (event_type, proposal_id, milestone_id, actor_id, payload)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      entry.eventType,
      entry.proposalId,
      entry.milestoneId ?? null,
      entry.actorId,
      JSON.stringify(entry.payload),
    ]
  )
}
