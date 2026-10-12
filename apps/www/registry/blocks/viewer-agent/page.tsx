import { ViewerAgent, ViewerAgentSetupNotice } from '@/components/viewer-agent'

export default function ViewerAgentPage() {
  const urn = process.env.APS_MODEL_URN
  if (!urn) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <ViewerAgentSetupNotice />
      </main>
    )
  }
  return <ViewerAgent urn={urn} />
}
