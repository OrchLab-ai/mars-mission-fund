import { useEffect } from 'react'
import { useParams } from 'react-router'
import { useProposal } from '../hooks/useProposal'
import { ProposalFormPage } from './ProposalFormPage'

export function ProposalEditPage() {
  const { id } = useParams<{ id: string }>()
  const { data: proposal } = useProposal(id ?? '')

  useEffect(() => {
    if (proposal) {
      document.title = `${proposal.title} — Edit — Mars Mission Fund`
    }
  }, [proposal])

  return <ProposalFormPage proposalId={id} />
}
