import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import Link from 'next/link'

import { APS_PROVIDER_ID, getTokenSource, openSession, SESSION_COOKIE } from '@/lib/acc-auth'
import { type AccWorkflowData, loadAccWorkflow } from '@/lib/acc-workflow'
import { type HubBrowserWorkflowData, loadHubBrowserWorkflow } from '@/lib/aps-browser-workflow'
import { DEMO_LANDING_HUB_ID } from '@/lib/aps-demo-seed'
import { AccSignIn } from '@/registry/blocks/acc-sign-in/page'

import { AccWorkflowPanel } from './acc-workflow-panel'
import { HubBrowserPanel } from './hub-browser-panel'

export const metadata: Metadata = {
  title: 'Live demo',
  description:
    'Sign in, browse Data Management, choose an issuance, and read model translation status — the whole ACC workflow against an embedded APS emulator, no Autodesk account needed.',
}

// The OAuth flow reads request cookies and headers on every visit, and the
// workflow reads the selection from the query string.
export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

function one(params: SearchParams, key: string): string | undefined {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

async function requestOrigin(): Promise<string> {
  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'localhost:3000'
  const proto = headerList.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

const noGrant: AccWorkflowData = {
  hubs: [],
  projects: [],
  versionSets: [],
  translations: [],
  hubsError: 'The Autodesk grant could not be refreshed — reconnect to load your projects.',
}

const noBrowserGrant: HubBrowserWorkflowData = {
  path: [],
  entries: [],
  status: 'error',
  error: 'The Autodesk grant could not be refreshed — reconnect to browse files.',
  hasMore: false,
  page: 0,
}

export default async function DemoPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, cookieStore] = await Promise.all([searchParams, cookies()])
  const session = await openSession(cookieStore.get(SESSION_COOKIE)?.value)

  let workflow: AccWorkflowData | null = null
  let browser: HubBrowserWorkflowData | null = null
  if (session) {
    const origin = await requestOrigin()
    try {
      const token = await getTokenSource(origin).getToken({
        provider: APS_PROVIDER_ID,
        subject: { type: 'user', id: session.userId },
        scopes: session.scopes,
      })
      const folders = one(params, 'browserFolders')?.split('|').filter(Boolean)
      const requestedPage = Number(one(params, 'browserPage') ?? 0)
      ;[workflow, browser] = await Promise.all([
        loadAccWorkflow(origin, token, {
          hubId: one(params, 'hub'),
          projectId: one(params, 'project'),
          versionSetId: one(params, 'versionSet'),
          fallbackHubId: DEMO_LANDING_HUB_ID,
        }),
        loadHubBrowserWorkflow(origin, token, {
          hubId: one(params, 'browserHub'),
          projectId: one(params, 'browserProject'),
          folderIds: folders,
          page: Number.isFinite(requestedPage) ? requestedPage : 0,
          versionsItemId: one(params, 'browserVersions'),
        }),
      ])
    } catch {
      // A lost or unrefreshable grant is the connection panel's story to tell;
      // the workflow says so plainly instead of throwing.
      workflow = noGrant
      browser = noBrowserGrant
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-6 py-16">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-balance font-semibold text-3xl tracking-tight">Live demo</h1>
        <p className="mt-3 text-muted-foreground text-sm">
          The whole ACC entry sequence, running for real: sign in with Autodesk, switch hubs, pick a
          project, choose a sheet issuance, read what has finished translating. The blocks are
          exactly what <code className="font-mono">npx shadcn@latest add @cantera/acc-sign-in</code>{' '}
          installs, wired to aec-auth&apos;s vault and pointed at a stateful APS emulator embedded
          in this site. No Autodesk account, no credentials.
        </p>
      </header>

      {workflow ? (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-start">
          <AccSignIn nextPath="/demo" headingLevel="h2" />

          <section className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="font-heading font-medium text-2xl tracking-tight">Project workflow</h2>
              <p className="text-muted-foreground text-sm">
                Every selection below is a query parameter. Changing one re-reads the emulator’s
                Data Management, ACC Sheets, and Model Derivative endpoints on the server with your
                own bearer token — the pickers hold their pending state until that render commits.
              </p>
            </div>
            <AccWorkflowPanel data={workflow} />
          </section>
        </div>
      ) : (
        <section aria-label="Start the live demo" className="mx-auto w-full max-w-sm">
          <AccSignIn nextPath="/demo" headingLevel="h2" />
        </section>
      )}

      {browser && (
        <section className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="font-heading font-medium text-2xl tracking-tight">Hub browser</h2>
            <p className="max-w-3xl text-muted-foreground text-sm">
              Every level below comes from the emulator’s Data Management endpoints with the grant
              you just made. Folder contents include tip versions, version history loads only when
              asked for, and every payload crosses the server boundary through the APS adapters.
            </p>
          </div>
          <HubBrowserPanel data={browser} />
        </section>
      )}

      <footer className="mx-auto flex max-w-2xl flex-col gap-3 text-center">
        <p className="text-muted-foreground text-xs">
          The emulator stores state in memory, so connections and seeded projects reset when the
          server recycles — if a connection shows as expired, reconnect and the flow starts over.
          Point the same blocks at real APS by setting{' '}
          <code className="font-mono">APS_CLIENT_ID</code>,{' '}
          <code className="font-mono">APS_CLIENT_SECRET</code>, and removing{' '}
          <code className="font-mono">APS_AUTH_BASE_URL</code>.
        </p>
        <p className="text-muted-foreground text-sm">
          The{' '}
          <Link href="/connections" className="focus-ring rounded-sm underline underline-offset-4">
            connections page
          </Link>{' '}
          manages the same grant: the <code className="font-mono">connections-page</code> block, on
          this wiring.
        </p>
      </footer>
    </div>
  )
}
