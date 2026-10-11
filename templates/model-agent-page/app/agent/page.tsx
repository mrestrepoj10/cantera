import { ModelAgent, ModelAgentSetupNotice } from '@/components/model-agent'

export default function ModelAgentPage() {
  const urn = process.env.APS_MODEL_URN
  if (!urn) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <ModelAgentSetupNotice />
      </main>
    )
  }
  return <ModelAgent urn={urn} />
}
