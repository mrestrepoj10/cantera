import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CodeBlock } from '@/components/site/code-block'
import { ComponentDemo } from '@/components/site/demos'
import { InstallCommand } from '@/components/site/install-command'
import { apiTables, libUsage } from '@/components/site/props-tables'
import { getRegistryItem, installCommandFor, registryItems } from '@/components/site/registry'

export const dynamicParams = false

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

export default async function ComponentPage({ params }: PageProps) {
  const { name } = await params
  const item = getRegistryItem(name)
  if (!item) notFound()

  const isLib = item.type === 'registry:lib'
  const usage = libUsage[item.name]
  const api = apiTables[item.name]
  const sources = await Promise.all(
    item.files.map(async (file) => ({
      filename: path.basename(file.path),
      // Statically scoped to registry/ so the bundler can trace the fs usage.
      code: await fs.readFile(
        path.join(process.cwd(), 'registry', path.relative('registry', file.path)),
        'utf8',
      ),
    })),
  )

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-12 sm:py-16">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-[13px] text-muted-foreground">
          @cantera/{item.name}
          {isLib && <span className="ml-2 text-[10px] uppercase">lib</span>}
        </p>
        <h1 className="text-balance font-semibold text-3xl tracking-tight">{item.title}</h1>
        <p className="max-w-2xl text-muted-foreground">{item.description}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium text-sm">Install</h2>
        <InstallCommand command={installCommandFor(item.name)} className="max-w-xl" />
      </section>

      {isLib && usage ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-medium text-sm">Usage</h2>
          <p className="max-w-2xl text-muted-foreground text-sm">{usage.intro}</p>
          <CodeBlock code={usage.example} />
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="font-medium text-sm">Preview</h2>
          <div className="flex min-h-64 items-center justify-center rounded-lg border border-border p-8 sm:p-12">
            <ComponentDemo name={item.name} />
          </div>
        </section>
      )}

      {api && (
        <section className="flex flex-col gap-3">
          <h2 className="font-medium text-sm">{api.caption}</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-border border-b bg-muted/40 text-left">
                  <th className="px-4 py-2 font-medium text-muted-foreground text-xs">
                    {api.caption === 'Props' ? 'Prop' : 'Export'}
                  </th>
                  <th className="px-4 py-2 font-medium text-muted-foreground text-xs">Type</th>
                  {api.caption === 'Props' && (
                    <th className="px-4 py-2 font-medium text-muted-foreground text-xs">Default</th>
                  )}
                  <th className="px-4 py-2 font-medium text-muted-foreground text-xs">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {api.rows.map((row) => (
                  <tr key={row.name} className="border-border border-b last:border-b-0">
                    <td className="px-4 py-2.5 align-top font-mono text-[13px]">{row.name}</td>
                    <td className="px-4 py-2.5 align-top font-mono text-[13px] text-muted-foreground">
                      {row.type}
                    </td>
                    {api.caption === 'Props' && (
                      <td className="px-4 py-2.5 align-top font-mono text-[13px] text-muted-foreground">
                        {row.defaultValue ?? '—'}
                      </td>
                    )}
                    <td className="px-4 py-2.5 align-top text-muted-foreground">
                      {row.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-medium text-sm">Source</h2>
        <p className="max-w-2xl text-muted-foreground text-sm">
          This is the exact code the CLI installs into your project — you own it from there.
        </p>
        {sources.map((source) => (
          <CodeBlock key={source.filename} code={source.code} filename={source.filename} />
        ))}
      </section>
    </div>
  )
}
