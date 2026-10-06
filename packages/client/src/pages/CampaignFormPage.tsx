import { useReducer, useRef, useEffect, useState, Fragment } from 'react'
import { useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCampaign,
  createCampaign,
  updateCampaign,
  submitCampaignForReview,
} from '../api/campaigns'
import { CampaignCategorySchema } from '@mmf/shared'
import type { CampaignCategory, CampaignDetail, CreateCampaignRequest } from '@mmf/shared'
import { DatePickerInput } from '../components/ui/DatePickerInput'

export interface CampaignFormPageProps {
  campaignId?: string
}

// ── Domain types ─────────────────────────────────────────────────────────────

type TeamMemberDraft = { name: string; role: string; bio: string }

type MilestoneDraft = {
  title: string
  description: string
  fundingPercentage: string
  targetDate: string
  verificationCriteria: string
  sortOrder: number
}

type FormState = {
  step: number
  // Step 1 – Mission
  title: string
  category: CampaignCategory | ''
  summary: string
  description: string
  alignmentStatement: string
  // Step 2 – Team
  teamMembers: TeamMemberDraft[]
  // Step 3 – Funding
  minFundingTargetUsd: string
  maxFundingCapUsd: string
  deadline: string
  // Step 4 – Milestones
  milestones: MilestoneDraft[]
  // Step 5 – Risks
  riskDisclosures: string[]
  // Step 6 – Media
  heroImageUrl: string
}

type FormAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET'; field: string; value: string }
  | { type: 'ADD_MEMBER' }
  | { type: 'UPDATE_MEMBER'; index: number; field: keyof TeamMemberDraft; value: string }
  | { type: 'REMOVE_MEMBER'; index: number }
  | { type: 'ADD_MILESTONE' }
  | { type: 'UPDATE_MILESTONE'; index: number; field: keyof MilestoneDraft; value: string | number }
  | { type: 'REMOVE_MILESTONE'; index: number }
  | { type: 'ADD_RISK' }
  | { type: 'UPDATE_RISK'; index: number; value: string }
  | { type: 'REMOVE_RISK'; index: number }
  | { type: 'INIT'; data: CampaignDetail }

function initState(): FormState {
  return {
    step: 1,
    title: '',
    category: '',
    summary: '',
    description: '',
    alignmentStatement: '',
    teamMembers: [{ name: '', role: '', bio: '' }],
    minFundingTargetUsd: '',
    maxFundingCapUsd: '',
    deadline: '',
    milestones: [
      {
        title: '',
        description: '',
        fundingPercentage: '',
        targetDate: '',
        verificationCriteria: '',
        sortOrder: 0,
      },
      {
        title: '',
        description: '',
        fundingPercentage: '',
        targetDate: '',
        verificationCriteria: '',
        sortOrder: 1,
      },
    ],
    riskDisclosures: [''],
    heroImageUrl: '',
  }
}

function reducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step }
    case 'SET':
      return { ...state, [action.field]: action.value }
    case 'ADD_MEMBER':
      return { ...state, teamMembers: [...state.teamMembers, { name: '', role: '', bio: '' }] }
    case 'UPDATE_MEMBER': {
      const members = [...state.teamMembers]
      members[action.index] = { ...members[action.index], [action.field]: action.value }
      return { ...state, teamMembers: members }
    }
    case 'REMOVE_MEMBER':
      return { ...state, teamMembers: state.teamMembers.filter((_, i) => i !== action.index) }
    case 'ADD_MILESTONE':
      return {
        ...state,
        milestones: [
          ...state.milestones,
          {
            title: '',
            description: '',
            fundingPercentage: '',
            targetDate: '',
            verificationCriteria: '',
            sortOrder: state.milestones.length,
          },
        ],
      }
    case 'UPDATE_MILESTONE': {
      const ms = [...state.milestones]
      ms[action.index] = { ...ms[action.index], [action.field]: action.value }
      return { ...state, milestones: ms }
    }
    case 'REMOVE_MILESTONE':
      return { ...state, milestones: state.milestones.filter((_, i) => i !== action.index) }
    case 'ADD_RISK':
      return { ...state, riskDisclosures: [...state.riskDisclosures, ''] }
    case 'UPDATE_RISK': {
      const risks = [...state.riskDisclosures]
      risks[action.index] = action.value
      return { ...state, riskDisclosures: risks }
    }
    case 'REMOVE_RISK':
      return {
        ...state,
        riskDisclosures: state.riskDisclosures.filter((_, i) => i !== action.index),
      }
    case 'INIT': {
      const c = action.data
      return {
        step: 1,
        title: c.title,
        category: c.category,
        summary: c.summary,
        description: c.description,
        alignmentStatement: c.alignmentStatement,
        teamMembers:
          c.teamMembers.length > 0
            ? c.teamMembers.map((tm) => ({ name: tm.name, role: tm.role, bio: tm.bio ?? '' }))
            : [{ name: '', role: '', bio: '' }],
        minFundingTargetUsd: c.goalAmount ? String(c.goalAmount) : '',
        maxFundingCapUsd: c.maxFundingCapUsd ? String(c.maxFundingCapUsd) : '',
        deadline: c.deadline ? c.deadline.toISOString().split('T')[0] : '',
        milestones:
          c.milestones.length > 0
            ? c.milestones.map((m, i) => ({
                title: m.title,
                description: m.description,
                fundingPercentage: String(m.fundingPercentage),
                targetDate: m.targetDate ? m.targetDate.toISOString().split('T')[0] : '',
                verificationCriteria: m.verificationCriteria ?? '',
                sortOrder: m.sortOrder ?? i,
              }))
            : [
                {
                  title: '',
                  description: '',
                  fundingPercentage: '',
                  targetDate: '',
                  verificationCriteria: '',
                  sortOrder: 0,
                },
                {
                  title: '',
                  description: '',
                  fundingPercentage: '',
                  targetDate: '',
                  verificationCriteria: '',
                  sortOrder: 1,
                },
              ],
        riskDisclosures: c.riskDisclosures?.length ? c.riskDisclosures : [''],
        heroImageUrl: c.heroImageUrl ?? '',
      }
    }
    default:
      return state
  }
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateStep1(state: FormState): string | null {
  if (!state.title.trim()) return 'Title is required.'
  if (!state.category) return 'Category is required.'
  return null
}

function validateStep2(state: FormState): string | null {
  const valid = state.teamMembers.some((tm) => tm.name.trim() && tm.role.trim())
  if (!valid) return 'At least one team member with name and role is required.'
  return null
}

function validateStep3(state: FormState): string | null {
  const min = parseInt(state.minFundingTargetUsd, 10)
  if (isNaN(min) || min < 1_000_000 || min > 1_000_000_000) {
    return 'Minimum funding target must be between $1,000,000 and $1,000,000,000.'
  }
  if (state.deadline) {
    const dl = new Date(state.deadline)
    const now = new Date()
    const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const oneYear = new Date(now.getTime() + 366 * 24 * 60 * 60 * 1000)
    if (dl < oneWeek || dl > oneYear) {
      return 'Deadline must be between 1 week and 1 year from today.'
    }
  }
  return null
}

function validateStep4(state: FormState): string | null {
  const filled = state.milestones.filter((m) => m.title.trim())
  if (filled.length < 2) return 'At least 2 milestones with titles are required.'
  const total = filled.reduce((sum, m) => sum + (parseFloat(m.fundingPercentage) || 0), 0)
  if (Math.abs(total - 100) > 0.01) {
    return `Milestone funding percentages must sum to 100% (currently ${total.toFixed(1)}%).`
  }
  return null
}

function validateStep5(state: FormState): string | null {
  const valid = state.riskDisclosures.some((r) => r.trim())
  if (!valid) return 'At least one risk disclosure is required.'
  return null
}

function validateStep(step: number, state: FormState): string | null {
  switch (step) {
    case 1:
      return validateStep1(state)
    case 2:
      return validateStep2(state)
    case 3:
      return validateStep3(state)
    case 4:
      return validateStep4(state)
    case 5:
      return validateStep5(state)
    default:
      return null
  }
}

// ── Payload builder ───────────────────────────────────────────────────────────

function buildPayload(state: FormState): CreateCampaignRequest {
  return {
    title: state.title,
    category: state.category as CampaignCategory,
    summary: state.summary,
    description: state.description,
    alignmentStatement: state.alignmentStatement,
    teamMembers: state.teamMembers
      .filter((tm) => tm.name.trim() && tm.role.trim())
      .map((tm, i) => ({ name: tm.name, role: tm.role, bio: tm.bio || null, sortOrder: i })),
    minFundingTargetUsd: state.minFundingTargetUsd
      ? parseInt(state.minFundingTargetUsd, 10)
      : undefined,
    maxFundingCapUsd: state.maxFundingCapUsd ? parseInt(state.maxFundingCapUsd, 10) : undefined,
    deadline: state.deadline ? new Date(state.deadline) : null,
    milestones: state.milestones
      .filter((m) => m.title.trim())
      .map((m, i) => ({
        title: m.title,
        description: m.description,
        fundingPercentage: parseFloat(m.fundingPercentage) || 0,
        targetDate: m.targetDate ? new Date(m.targetDate) : null,
        verificationCriteria: m.verificationCriteria || null,
        sortOrder: m.sortOrder ?? i,
      })),
    tags: [],
    riskDisclosures: state.riskDisclosures.filter((r) => r.trim()),
    heroImageUrl: state.heroImageUrl || null,
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const STEPS = ['Mission', 'Team', 'Funding', 'Milestones', 'Risks', 'Media', 'Review']

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-bg-page)',
}

const contentStyle: React.CSSProperties = {
  maxWidth: '800px',
  margin: '0 auto',
  padding: 'var(--space-8) var(--space-6)',
}

const stepIndicatorStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-1)',
  marginBottom: 'var(--space-8)',
  overflowX: 'auto',
}

const stepDotBase: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  flex: '1',
  minWidth: '60px',
}

const stepCircleBase: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  fontWeight: 600,
  border: '2px solid var(--color-border-subtle)',
  background: 'var(--color-bg-surface)',
  color: 'var(--color-text-secondary)',
}

const stepLabelBase: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '11px',
  color: 'var(--color-text-secondary)',
  textAlign: 'center',
}

const stepConnectorStyle: React.CSSProperties = {
  flex: '1',
  height: '2px',
  background: 'var(--color-border-subtle)',
  minWidth: '8px',
  maxWidth: '40px',
  alignSelf: 'flex-start',
  marginTop: '15px',
}

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--type-heading-2-size)',
  fontWeight: 'var(--type-heading-2-weight)' as React.CSSProperties['fontWeight'],
  letterSpacing: 'var(--type-heading-2-spacing)',
  lineHeight: 'var(--type-heading-2-leading)',
  color: 'var(--color-text-primary)',
  margin: '0 0 var(--space-6)',
}

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: 'var(--space-5)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  marginBottom: 'var(--space-1)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 'var(--space-2) var(--space-3)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-sm)',
  boxSizing: 'border-box',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '100px',
  resize: 'vertical',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
}

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-4)',
  marginBottom: 'var(--space-4)',
  background: 'var(--color-bg-surface)',
}

const primaryButtonStyle: React.CSSProperties = {
  background: 'var(--color-accent-primary)',
  color: 'var(--color-text-on-accent)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-2) var(--space-5)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  fontWeight: 600,
  cursor: 'pointer',
}

const secondaryButtonStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-2) var(--space-5)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  fontWeight: 600,
  cursor: 'pointer',
}

const ghostButtonStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--color-accent-primary)',
  border: '1px solid var(--color-accent-primary)',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-1) var(--space-3)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  fontWeight: 600,
  cursor: 'pointer',
}

const dangerButtonStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--color-status-error)',
  border: '1px solid var(--color-status-error-border)',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-1) var(--space-3)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  cursor: 'pointer',
}

const navRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 'var(--space-8)',
  paddingTop: 'var(--space-5)',
  borderTop: '1px solid var(--color-border-subtle)',
  gap: 'var(--space-3)',
}

const errorAlertStyle: React.CSSProperties = {
  color: 'var(--color-status-error)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  marginTop: 'var(--space-2)',
}

const dialogStyle: React.CSSProperties = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-bg-surface)',
  padding: 'var(--space-6)',
  maxWidth: '480px',
  width: '100%',
  fontFamily: 'var(--font-body)',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
}

const dialogConfirmButtonStyle: React.CSSProperties = {
  background: 'var(--color-action-primary)',
  color: 'var(--color-action-primary-text)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-2) var(--space-5)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  fontWeight: 600,
  cursor: 'pointer',
}

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '50vh',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-secondary)',
}

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--type-heading-3-size)',
  fontWeight: 'var(--type-heading-3-weight)' as React.CSSProperties['fontWeight'],
  color: 'var(--color-text-primary)',
  margin: '0 0 var(--space-4)',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CampaignFormPage({ campaignId }: CampaignFormPageProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const submitTriggerRef = useRef<HTMLButtonElement>(null)
  const initializedRef = useRef(false)

  const [state, dispatch] = useReducer(reducer, undefined, initState)

  const { data: existingCampaign, isLoading: isLoadingCampaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => fetchCampaign(campaignId!),
    enabled: !!campaignId,
    staleTime: 0,
  })

  // Populate form from existing campaign data (edit mode)
  useEffect(() => {
    if (existingCampaign && !initializedRef.current) {
      initializedRef.current = true
      dispatch({ type: 'INIT', data: existingCampaign })
    }
  }, [existingCampaign])

  const [validationError, setValidationError] = useState<string | null>(null)

  const {
    mutate: saveDraft,
    isPending: isSaving,
    error: saveError,
  } = useMutation({
    mutationFn: async () => {
      const payload = buildPayload(state)
      if (campaignId) {
        return updateCampaign(campaignId, payload)
      } else {
        return createCampaign(payload)
      }
    },
    onSuccess: (result) => {
      if (!campaignId) {
        void navigate(`/campaigns/${result.id}/edit`)
      } else {
        void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
      }
    },
  })

  const {
    mutate: doSubmit,
    isPending: isSubmitting,
    error: submitError,
  } = useMutation({
    mutationFn: async () => {
      if (!campaignId) throw new Error('Save the draft first before submitting for review.')
      await submitCampaignForReview(campaignId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-campaigns'] })
      dialogRef.current?.close()
      void navigate('/dashboard')
    },
  })

  if (campaignId && isLoadingCampaign) {
    return (
      <div style={pageStyle}>
        <div style={loadingStyle} role="status" aria-busy="true">
          Loading campaign…
        </div>
      </div>
    )
  }

  const currentStep = state.step
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === STEPS.length

  function handleNext() {
    const err = validateStep(currentStep, state)
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError(null)
    dispatch({ type: 'SET_STEP', step: currentStep + 1 })
  }

  function handleBack() {
    setValidationError(null)
    dispatch({ type: 'SET_STEP', step: currentStep - 1 })
  }

  const categories = CampaignCategorySchema.options

  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        {/* Step indicator */}
        <nav aria-label="Form steps">
          <div style={stepIndicatorStyle}>
            {STEPS.map((label, i) => {
              const stepNum = i + 1
              const isActive = stepNum === currentStep
              const isComplete = stepNum < currentStep
              return (
                <Fragment key={label}>
                  {i > 0 && <div style={stepConnectorStyle} aria-hidden="true" />}
                  <div style={stepDotBase}>
                    <div
                      style={{
                        ...stepCircleBase,
                        ...(isActive
                          ? {
                              background: 'var(--color-accent-primary)',
                              color: 'var(--color-text-on-accent)',
                              border: '2px solid var(--color-accent-primary)',
                            }
                          : isComplete
                            ? {
                                background: 'var(--color-accent-primary)',
                                color: 'var(--color-text-on-accent)',
                                border: '2px solid var(--color-accent-primary)',
                                opacity: 0.6,
                              }
                            : {}),
                      }}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      {stepNum}
                    </div>
                    <span
                      style={{
                        ...stepLabelBase,
                        ...(isActive
                          ? { color: 'var(--color-accent-primary)', fontWeight: 600 }
                          : {}),
                      }}
                    >
                      {label}
                    </span>
                  </div>
                </Fragment>
              )
            })}
          </div>
        </nav>

        {/* Step content */}
        {currentStep === 1 && (
          <StepMission state={state} dispatch={dispatch} categories={categories} />
        )}
        {currentStep === 2 && <StepTeam state={state} dispatch={dispatch} />}
        {currentStep === 3 && <StepFunding state={state} dispatch={dispatch} />}
        {currentStep === 4 && <StepMilestones state={state} dispatch={dispatch} />}
        {currentStep === 5 && <StepRisks state={state} dispatch={dispatch} />}
        {currentStep === 6 && <StepMedia state={state} dispatch={dispatch} />}
        {currentStep === 7 && (
          <StepReview
            state={state}
            campaignId={campaignId}
            onOpenDialog={() => dialogRef.current?.showModal()}
            triggerRef={submitTriggerRef}
          />
        )}

        {/* Validation error */}
        {validationError && (
          <p role="alert" style={errorAlertStyle}>
            {validationError}
          </p>
        )}

        {/* Server error from save */}
        {saveError && (
          <p role="alert" style={errorAlertStyle}>
            {(saveError as Error).message ?? 'Failed to save draft.'}
          </p>
        )}

        {/* Navigation row */}
        <div style={navRowStyle}>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            {!isFirstStep && (
              <button style={secondaryButtonStyle} onClick={handleBack}>
                Back
              </button>
            )}
            {!isLastStep && (
              <button style={primaryButtonStyle} onClick={handleNext}>
                Next
              </button>
            )}
          </div>
          <button
            style={secondaryButtonStyle}
            onClick={() => saveDraft()}
            disabled={isSaving}
            aria-label="Save draft"
          >
            {isSaving ? 'Saving…' : 'Save Draft'}
          </button>
        </div>
      </div>

      {/* Submit confirmation dialog */}
      <dialog
        ref={dialogRef}
        style={dialogStyle}
        aria-labelledby="submit-dialog-title"
        onClose={() => submitTriggerRef.current?.focus()}
      >
        <h2
          id="submit-dialog-title"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--type-heading-3-size)',
            fontWeight: 'var(--type-heading-3-weight)' as React.CSSProperties['fontWeight'],
            color: 'var(--color-text-primary)',
            margin: '0 0 var(--space-3)',
          }}
        >
          Submit for Review
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--type-body-size)',
            color: 'var(--color-text-secondary)',
            margin: '0 0 var(--space-5)',
          }}
        >
          Once submitted, you cannot edit the campaign until the review is complete. Are you sure
          you want to submit?
        </p>
        {submitError && (
          <p role="alert" style={{ ...errorAlertStyle, marginBottom: 'var(--space-3)' }}>
            {(submitError as Error).message ?? 'Submission failed.'}
          </p>
        )}
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <button
            style={secondaryButtonStyle}
            onClick={() => dialogRef.current?.close()}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            style={dialogConfirmButtonStyle}
            onClick={() => doSubmit()}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting…' : 'Confirm Submission'}
          </button>
        </div>
      </dialog>
    </div>
  )
}

// ── Step sub-components ───────────────────────────────────────────────────────

function StepMission({
  state,
  dispatch,
  categories,
}: {
  state: FormState
  dispatch: React.Dispatch<FormAction>
  categories: readonly CampaignCategory[]
}) {
  return (
    <div>
      <h1 style={headingStyle}>Step 1: Mission Objectives</h1>
      <div style={fieldGroupStyle}>
        <label htmlFor="title" style={labelStyle}>
          Title *
        </label>
        <input
          id="title"
          type="text"
          style={inputStyle}
          value={state.title}
          maxLength={200}
          onChange={(e) => dispatch({ type: 'SET', field: 'title', value: e.target.value })}
          placeholder="Campaign title"
          required
        />
      </div>
      <div style={fieldGroupStyle}>
        <label htmlFor="category" style={labelStyle}>
          Category *
        </label>
        <select
          id="category"
          style={selectStyle}
          value={state.category}
          onChange={(e) => dispatch({ type: 'SET', field: 'category', value: e.target.value })}
          required
        >
          <option value="">Select a category…</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div style={fieldGroupStyle}>
        <label htmlFor="summary" style={labelStyle}>
          Summary (max 280 characters)
        </label>
        <textarea
          id="summary"
          style={textareaStyle}
          value={state.summary}
          maxLength={280}
          onChange={(e) => dispatch({ type: 'SET', field: 'summary', value: e.target.value })}
          placeholder="Brief one-paragraph summary of your campaign"
          rows={3}
        />
      </div>
      <div style={fieldGroupStyle}>
        <label htmlFor="description" style={labelStyle}>
          Description
        </label>
        <textarea
          id="description"
          style={{ ...textareaStyle, minHeight: '160px' }}
          value={state.description}
          onChange={(e) => dispatch({ type: 'SET', field: 'description', value: e.target.value })}
          placeholder="Full description of your mission and technology"
          rows={6}
        />
      </div>
      <div style={fieldGroupStyle}>
        <label htmlFor="alignmentStatement" style={labelStyle}>
          Mars Mission Alignment Statement
        </label>
        <textarea
          id="alignmentStatement"
          style={textareaStyle}
          value={state.alignmentStatement}
          onChange={(e) =>
            dispatch({ type: 'SET', field: 'alignmentStatement', value: e.target.value })
          }
          placeholder="Explain how your project advances the Mars mission"
          rows={4}
        />
      </div>
    </div>
  )
}

function StepTeam({ state, dispatch }: { state: FormState; dispatch: React.Dispatch<FormAction> }) {
  return (
    <div>
      <h1 style={headingStyle}>Step 2: Team Members</h1>
      {state.teamMembers.map((member, i) => (
        <div key={i} style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-3)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--type-body-small-size)',
              }}
            >
              Member {i + 1}
            </span>
            {state.teamMembers.length > 1 && (
              <button
                style={dangerButtonStyle}
                onClick={() => dispatch({ type: 'REMOVE_MEMBER', index: i })}
                aria-label={`Remove member ${i + 1}`}
              >
                Remove
              </button>
            )}
          </div>
          <div style={fieldGroupStyle}>
            <label htmlFor={`member-name-${i}`} style={labelStyle}>
              Name *
            </label>
            <input
              id={`member-name-${i}`}
              type="text"
              style={inputStyle}
              value={member.name}
              onChange={(e) =>
                dispatch({ type: 'UPDATE_MEMBER', index: i, field: 'name', value: e.target.value })
              }
              placeholder="Full name"
            />
          </div>
          <div style={fieldGroupStyle}>
            <label htmlFor={`member-role-${i}`} style={labelStyle}>
              Role *
            </label>
            <input
              id={`member-role-${i}`}
              type="text"
              style={inputStyle}
              value={member.role}
              onChange={(e) =>
                dispatch({ type: 'UPDATE_MEMBER', index: i, field: 'role', value: e.target.value })
              }
              placeholder="e.g. CEO, Lead Engineer"
            />
          </div>
          <div style={fieldGroupStyle}>
            <label htmlFor={`member-bio-${i}`} style={labelStyle}>
              Bio
            </label>
            <textarea
              id={`member-bio-${i}`}
              style={{ ...textareaStyle, minHeight: '80px' }}
              value={member.bio}
              onChange={(e) =>
                dispatch({ type: 'UPDATE_MEMBER', index: i, field: 'bio', value: e.target.value })
              }
              placeholder="Short biography"
              rows={3}
            />
          </div>
        </div>
      ))}
      <button
        style={ghostButtonStyle}
        onClick={() => dispatch({ type: 'ADD_MEMBER' })}
        type="button"
      >
        + Add Team Member
      </button>
    </div>
  )
}

function StepFunding({
  state,
  dispatch,
}: {
  state: FormState
  dispatch: React.Dispatch<FormAction>
}) {
  const [deadlineError, setDeadlineError] = useState('')

  const minDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  })()

  const maxDate = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().split('T')[0]
  })()

  function handleDeadlineChange(value: string) {
    dispatch({ type: 'SET', field: 'deadline', value })
    if (value && (value < minDate || value > maxDate)) {
      setDeadlineError('Deadline must be between 7 days and 1 year from today')
    } else {
      setDeadlineError('')
    }
  }

  return (
    <div>
      <h1 style={headingStyle}>Step 3: Funding Goals</h1>
      <div style={fieldGroupStyle}>
        <label htmlFor="minFunding" style={labelStyle}>
          Minimum Funding Target (USD) *
        </label>
        <input
          id="minFunding"
          type="number"
          style={inputStyle}
          value={state.minFundingTargetUsd}
          onChange={(e) =>
            dispatch({ type: 'SET', field: 'minFundingTargetUsd', value: e.target.value })
          }
          placeholder="e.g. 5000000"
          min={1_000_000}
          max={1_000_000_000}
        />
        <span
          style={{
            ...labelStyle,
            fontWeight: 400,
            color: 'var(--color-text-secondary)',
            marginTop: 'var(--space-1)',
          }}
        >
          Between $1,000,000 and $1,000,000,000
        </span>
      </div>
      <div style={fieldGroupStyle}>
        <label htmlFor="maxFunding" style={labelStyle}>
          Maximum Funding Cap (USD)
        </label>
        <input
          id="maxFunding"
          type="number"
          style={inputStyle}
          value={state.maxFundingCapUsd}
          onChange={(e) =>
            dispatch({ type: 'SET', field: 'maxFundingCapUsd', value: e.target.value })
          }
          placeholder="Optional cap"
          min={1}
        />
      </div>
      <div style={fieldGroupStyle}>
        <DatePickerInput
          id="deadline"
          label="Campaign Deadline"
          value={state.deadline}
          onChange={handleDeadlineChange}
          min={minDate}
          max={maxDate}
          helperText="Must be 1 week to 1 year from today"
          error={deadlineError}
        />
      </div>
    </div>
  )
}

function StepMilestones({
  state,
  dispatch,
}: {
  state: FormState
  dispatch: React.Dispatch<FormAction>
}) {
  const [milestoneDateErrors, setMilestoneDateErrors] = useState<Record<number, string>>({})

  function handleMilestoneDateChange(index: number, value: string) {
    dispatch({ type: 'UPDATE_MILESTONE', index, field: 'targetDate', value })
    if (value && isNaN(new Date(value).getTime())) {
      setMilestoneDateErrors((prev) => ({ ...prev, [index]: 'Please enter a valid date' }))
    } else {
      setMilestoneDateErrors((prev) => ({ ...prev, [index]: '' }))
    }
  }

  const total = state.milestones
    .filter((m) => m.title.trim())
    .reduce((sum, m) => sum + (parseFloat(m.fundingPercentage) || 0), 0)

  return (
    <div>
      <h1 style={headingStyle}>Step 4: Milestones</h1>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--type-body-size)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-4)',
        }}
      >
        At least 2 milestones required. Funding percentages must sum to 100%.{' '}
        <strong>Current total: {total.toFixed(1)}%</strong>
      </p>
      {state.milestones.map((milestone, i) => (
        <div key={i} style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-3)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--type-body-small-size)',
              }}
            >
              Milestone {i + 1}
            </span>
            {state.milestones.length > 2 && (
              <button
                style={dangerButtonStyle}
                onClick={() => dispatch({ type: 'REMOVE_MILESTONE', index: i })}
                aria-label={`Remove milestone ${i + 1}`}
              >
                Remove
              </button>
            )}
          </div>
          <div style={fieldGroupStyle}>
            <label htmlFor={`ms-title-${i}`} style={labelStyle}>
              Title *
            </label>
            <input
              id={`ms-title-${i}`}
              type="text"
              style={inputStyle}
              value={milestone.title}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_MILESTONE',
                  index: i,
                  field: 'title',
                  value: e.target.value,
                })
              }
              placeholder="Milestone title"
            />
          </div>
          <div style={fieldGroupStyle}>
            <label htmlFor={`ms-desc-${i}`} style={labelStyle}>
              Description
            </label>
            <textarea
              id={`ms-desc-${i}`}
              style={{ ...textareaStyle, minHeight: '80px' }}
              value={milestone.description}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_MILESTONE',
                  index: i,
                  field: 'description',
                  value: e.target.value,
                })
              }
              placeholder="What will be achieved"
              rows={3}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <div style={{ ...fieldGroupStyle, flex: '1' }}>
              <label htmlFor={`ms-pct-${i}`} style={labelStyle}>
                Funding % *
              </label>
              <input
                id={`ms-pct-${i}`}
                type="number"
                style={inputStyle}
                value={milestone.fundingPercentage}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_MILESTONE',
                    index: i,
                    field: 'fundingPercentage',
                    value: e.target.value,
                  })
                }
                placeholder="e.g. 25"
                min={0}
                max={100}
                step={0.01}
              />
            </div>
            <div style={{ ...fieldGroupStyle, flex: '1' }}>
              <DatePickerInput
                id={`ms-date-${i}`}
                label="Target Date"
                value={milestone.targetDate}
                onChange={(value) => handleMilestoneDateChange(i, value)}
                error={milestoneDateErrors[i] ?? ''}
              />
            </div>
          </div>
          <div style={fieldGroupStyle}>
            <label htmlFor={`ms-criteria-${i}`} style={labelStyle}>
              Verification Criteria
            </label>
            <textarea
              id={`ms-criteria-${i}`}
              style={{ ...textareaStyle, minHeight: '80px' }}
              value={milestone.verificationCriteria}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_MILESTONE',
                  index: i,
                  field: 'verificationCriteria',
                  value: e.target.value,
                })
              }
              placeholder="How will completion be verified?"
              rows={3}
            />
          </div>
        </div>
      ))}
      <button
        style={ghostButtonStyle}
        onClick={() => dispatch({ type: 'ADD_MILESTONE' })}
        type="button"
      >
        + Add Milestone
      </button>
    </div>
  )
}

function StepRisks({
  state,
  dispatch,
}: {
  state: FormState
  dispatch: React.Dispatch<FormAction>
}) {
  return (
    <div>
      <h1 style={headingStyle}>Step 5: Risk Disclosures</h1>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--type-body-size)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-4)',
        }}
      >
        List the key risks that backers should be aware of. At least one is required.
      </p>
      {state.riskDisclosures.map((risk, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-3)',
            alignItems: 'flex-start',
          }}
        >
          <textarea
            aria-label={`Risk disclosure ${i + 1}`}
            style={{ ...textareaStyle, minHeight: '72px', flex: '1' }}
            value={risk}
            onChange={(e) => dispatch({ type: 'UPDATE_RISK', index: i, value: e.target.value })}
            placeholder={`Risk ${i + 1}`}
            rows={3}
          />
          {state.riskDisclosures.length > 1 && (
            <button
              style={{ ...dangerButtonStyle, marginTop: 'var(--space-1)' }}
              onClick={() => dispatch({ type: 'REMOVE_RISK', index: i })}
              aria-label={`Remove risk ${i + 1}`}
            >
              Remove
            </button>
          )}
        </div>
      ))}
      <button style={ghostButtonStyle} onClick={() => dispatch({ type: 'ADD_RISK' })} type="button">
        + Add Risk
      </button>
    </div>
  )
}

function StepMedia({
  state,
  dispatch,
}: {
  state: FormState
  dispatch: React.Dispatch<FormAction>
}) {
  return (
    <div>
      <h1 style={headingStyle}>Step 6: Media</h1>
      <div style={fieldGroupStyle}>
        <label htmlFor="heroImageUrl" style={labelStyle}>
          Hero Image URL (optional)
        </label>
        <input
          id="heroImageUrl"
          type="url"
          style={inputStyle}
          value={state.heroImageUrl}
          onChange={(e) => dispatch({ type: 'SET', field: 'heroImageUrl', value: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>
      {state.heroImageUrl && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <img
            src={state.heroImageUrl}
            alt="Hero image preview"
            style={{
              maxWidth: '100%',
              maxHeight: '300px',
              borderRadius: 'var(--radius-md)',
              objectFit: 'cover',
              border: '1px solid var(--color-border-subtle)',
            }}
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}
    </div>
  )
}

function formatReviewDate(value: string | undefined): string {
  if (!value) return '—'
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function StepReview({
  state,
  campaignId,
  onOpenDialog,
  triggerRef,
}: {
  state: FormState
  campaignId: string | undefined
  onOpenDialog: () => void
  triggerRef?: React.RefObject<HTMLButtonElement | null>
}) {
  return (
    <div>
      <h1 style={headingStyle}>Step 7: Review &amp; Submit</h1>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--type-body-size)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-6)',
        }}
      >
        Review your campaign details before submitting for review.
      </p>

      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={sectionHeadingStyle}>Mission</h2>
        <dl
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--type-body-size)',
            color: 'var(--color-text-primary)',
          }}
        >
          <ReviewRow label="Title" value={state.title || '—'} />
          <ReviewRow label="Category" value={state.category || '—'} />
          <ReviewRow label="Summary" value={state.summary || '—'} />
        </dl>
      </section>

      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={sectionHeadingStyle}>
          Team ({state.teamMembers.filter((m) => m.name).length} members)
        </h2>
        {state.teamMembers
          .filter((m) => m.name)
          .map((m, i) => (
            <p
              key={i}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--type-body-size)',
                margin: '0 0 var(--space-1)',
              }}
            >
              <strong>{m.name}</strong> — {m.role}
            </p>
          ))}
      </section>

      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={sectionHeadingStyle}>Funding</h2>
        <dl
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--type-body-size)',
            color: 'var(--color-text-primary)',
          }}
        >
          <ReviewRow
            label="Min. Target"
            value={
              state.minFundingTargetUsd
                ? `$${parseInt(state.minFundingTargetUsd).toLocaleString()}`
                : '—'
            }
          />
          <ReviewRow
            label="Max. Cap"
            value={
              state.maxFundingCapUsd ? `$${parseInt(state.maxFundingCapUsd).toLocaleString()}` : '—'
            }
          />
          <ReviewRow label="Deadline" value={formatReviewDate(state.deadline)} />
        </dl>
      </section>

      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={sectionHeadingStyle}>
          Milestones ({state.milestones.filter((m) => m.title).length})
        </h2>
        {state.milestones
          .filter((m) => m.title)
          .map((m, i) => (
            <p
              key={i}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--type-body-size)',
                margin: '0 0 var(--space-1)',
              }}
            >
              <strong>{m.title}</strong> — {m.fundingPercentage}%
            </p>
          ))}
      </section>

      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={sectionHeadingStyle}>
          Risks ({state.riskDisclosures.filter((r) => r.trim()).length})
        </h2>
        {state.riskDisclosures
          .filter((r) => r.trim())
          .map((r, i) => (
            <p
              key={i}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--type-body-size)',
                margin: '0 0 var(--space-1)',
              }}
            >
              {r}
            </p>
          ))}
      </section>

      <div
        style={{
          marginTop: 'var(--space-6)',
          paddingTop: 'var(--space-5)',
          borderTop: '1px solid var(--color-border-subtle)',
        }}
      >
        {!campaignId && (
          <p role="alert" style={errorAlertStyle}>
            Save the draft before submitting for review.
          </p>
        )}
        <button
          ref={triggerRef}
          style={{
            ...primaryButtonStyle,
            opacity: campaignId ? 1 : 0.5,
            cursor: campaignId ? 'pointer' : 'not-allowed',
          }}
          onClick={campaignId ? onOpenDialog : undefined}
          disabled={!campaignId}
          aria-label="Submit campaign for review"
        >
          Submit for Review
        </button>
      </div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
      <dt style={{ minWidth: '120px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
        {label}
      </dt>
      <dd style={{ margin: 0 }}>{value}</dd>
    </div>
  )
}
