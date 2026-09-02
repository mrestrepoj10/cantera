import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Metadata } from 'next'
import { cacheLife } from 'next/cache'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { preconnect } from 'react-dom'

import { CodeBlock } from '@/components/site/code-block'
import { CopyPrompt } from '@/components/site/copy-prompt'
import { ComponentDemo, hasDemo } from '@/components/site/demos'
import { InstallCommand } from '@/components/site/install-command'
import { OpenInV0 } from '@/components/site/open-in-v0'
import { PageHandoff } from '@/components/site/page-handoff'
import { type ApiTable, apiTables, installNotes, libUsage } from '@/components/site/props-tables'
import {
  getPreviewFrameClassName,
  getRegistryItem,
  installCommandFor,
  registryItems,
} from '@/components/site/registry'
import { kindLabelFor } from '@/lib/registry-kinds'
import { installPromptFor, markdownPathFor, markdownUrlFor } from '@/lib/site'

export function generateStaticParams() {
  return registryItems.map((item) => ({ name: item.name }))
}

interface PageProps {
  params: Promise<{ name: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { name } = await params
  const item = getRegistryItem(name)
  if (!item) return {}
  return { title: item.title, description: item.description }
}

function ApiSection({ table }: { table: ApiTable }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-medium text-sm">{table.caption}</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr className="border-border border-b bg-muted/40 text-left">
              <th className="px-4 py-2 font-medium text-muted-foreground text-xs">
                {table.nameHeader}
              </th>
              <th className="px-4 py-2 font-medium text-muted-foreground text-xs">
                {table.typeHeader ?? 'Type'}
              </th>
              {table.showDefault && (
                <th className="px-4 py-2 font-medium text-muted-foreground text-xs">Default</th>
              )}
              <th className="px-4 py-2 font-medium text-muted-foreground text-xs">Description</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.name} className="border-border border-b last:border-b-0">
                <td className="px-4 py-2.5 align-top font-mono text-code">{row.name}</td>
                <td className="px-4 py-2.5 align-top font-mono text-code text-muted-foreground">
                  {row.type}
                </td>
                {table.showDefault && (
                  <td className="px-4 py-2.5 align-top font-mono text-code text-muted-foreground">
                    {row.defaultValue ?? '—'}
                  </td>
                )}
                <td className="px-4 py-2.5 align-top text-muted-foreground">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function NotesSection({ title, text }: { title: string; text: string }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-medium text-sm">{title}</h2>
      <div className="flex max-w-2xl flex-col gap-3 text-muted-foreground text-sm">
        {text.split('\n\n').map((paragraph) => (
          <p key={paragraph} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  )
}

function ComponentDocumentationFallback() {
  return (
    <div
      data-testid="component-documentation-fallback"
      aria-hidden="true"
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 py-12 sm:py-16"
    >
      <div className="flex flex-col gap-2">
        <div className="h-4 w-36 rounded-sm bg-muted" />
        <div className="h-9 w-64 max-w-full rounded-sm bg-muted" />
        <div className="h-5 w-full max-w-2xl rounded-sm bg-muted" />
      </div>
      <div className="h-20 w-full max-w-xl rounded-lg border border-border bg-muted/20" />
      <div className="h-64 w-full rounded-lg border border-border bg-muted/20" />
    </div>
  )
}

// Under cacheComponents an uncached read pushes the whole body into a dynamic
// hole: the prefetch stops there and every navigation waits on the server.
// Cached, the read resolves at prefetch time and the click is instant.
async function getSources(files: { path: string }[]) {
  'use cache'
  cacheLife('max')
  return Promise.all(
    files.map(async (file) => ({
      filename: path.basename(file.path),
      // Statically scoped to registry/ so the bundler can trace the fs usage.
      code: await fs.readFile(
        path.join(process.cwd(), 'registry', path.relative('registry', file.path)),
        'utf8',
      ),
    })),
  )
}

async function ComponentPageContent({ params }: PageProps) {
  const { name } = await params
  const item = getRegistryItem(name)
  if (!item) notFound()

  const isViewerItem = name === 'aps-viewer'
  // Warm the Autodesk CDN connection before the viewer demo's SDK download asks.
  if (isViewerItem && process.env.APS_VIEWER_DEMO_URN) {
    preconnect('https://developer.api.autodesk.com')
  }

  const isLib = item.type === 'registry:lib'
  const usage = libUsage[item.name]
  const tables = apiTables[item.name] ?? []
  const files = item.files ?? []
  const sources = await getSources(files)
  const kind = kindLabelFor(item)
  const notes = installNotes[item.name]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 py-12 sm:py-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-code text-muted-foreground">
            @cantera/{item.name}
            <span className="ml-2 text-xs uppercase tracking-wide">{kind}</span>
          </p>
          <h1 className="text-balance font-semibold text-3xl tracking-tight">{item.title}</h1>
          <p className="max-w-2xl text-muted-foreground">{item.description}</p>
        </div>
        <PageHandoff
          title={item.title}
          markdownPath={markdownPathFor(item.name)}
          markdownUrl={markdownUrlFor(item.name)}
        />
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium text-sm">Install</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <InstallCommand command={installCommandFor(item.name)} className="w-full max-w-xl" />
          <div className="flex shrink-0 gap-3">
            <CopyPrompt prompt={installPromptFor(item.name, kind)} title={item.title} />
            {files.length > 0 && <OpenInV0 name={item.name} title={item.title} />}
          </div>
        </div>
      </section>

      {isLib && usage ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-medium text-sm">Usage</h2>
          <p className="max-w-2xl text-muted-foreground text-sm">{usage.intro}</p>
          <CodeBlock code={usage.example} />
        </section>
      ) : hasDemo(item.name) ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-medium text-sm">Preview</h2>
          <div className={getPreviewFrameClassName(item.name)}>
            <ComponentDemo
              name={item.name}
              viewerUrn={isViewerItem ? process.env.APS_VIEWER_DEMO_URN : undefined}
            />
          </div>
        </section>
      ) : null}

      {item.docs && <NotesSection title="Install notes" text={item.docs} />}
      {notes && <NotesSection title="Notes" text={notes} />}

      {tables.map((table) => (
        <ApiSection key={table.caption} table={table} />
      ))}

      {sources.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-medium text-sm">Source</h2>
          <p className="max-w-2xl text-muted-foreground text-sm">
            This is the exact code the CLI installs into your project — you own it from there.
          </p>
          {sources.map((source) => (
            <CodeBlock key={source.filename} code={source.code} filename={source.filename} />
          ))}
        </section>
      )}
    </div>
  )
}

export default function ComponentPage({ params }: PageProps) {
  return (
    <Suspense fallback={<ComponentDocumentationFallback />}>
      <ComponentPageContent params={params} />
    </Suspense>
  )
}
