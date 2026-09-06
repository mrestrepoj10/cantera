import type * as React from 'react'

import { CopyField } from '@/components/ui/copy-field'
import { cn } from '@/lib/utils'

interface ProvisioningNoticeProps extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The APS client id the account admin has to add under Custom Integrations. */
  clientId: string
  /** Your product's name, as the admin will see it. */
  appName: string
  /** The provider's account-level container: "hubs" for ACC, "companies" for Procore. */
  containerNoun?: string
  /** Where the admin adds the app, as the provider labels it. */
  adminPath?: React.ReactNode
  title?: React.ReactNode
  /** Pick the heading level that fits the page outline, or "div" to opt out. */
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div'
  /** Rendered under the notice: a disconnect action, a support link. */
  footer?: React.ReactNode
}

/** Signed in, but the provider returned no hubs. Almost always this means an
 * account admin has not provisioned the app yet — the API reports that as an
 * empty list, not an error, so this is where the instructions live. */
function ProvisioningNotice({
  clientId,
  appName,
  containerNoun = 'hubs',
  adminPath = 'Account Admin → Custom Integrations',
  title = 'No projects visible yet',
  titleAs: TitleTag = 'h2',
  footer,
  className,
  ...props
}: ProvisioningNoticeProps) {
  return (
    <section
      data-slot="provisioning-notice"
      className={cn(
        'flex w-full flex-col gap-5 rounded-lg border border-border border-dashed p-6 sm:p-8',
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-2">
        <TitleTag className="font-semibold text-sm">{title}</TitleTag>
        <p className="text-muted-foreground text-sm leading-relaxed">
          You are signed in, but the provider is not showing {appName} any {containerNoun}. Usually
          that means an account admin has not added {appName} under{' '}
          <span className="text-foreground">{adminPath}</span> yet. Send them this client ID — it is
          a one-time step per account. Once it is in, reload this page.
        </p>
      </div>
      <CopyField label="client ID" value={clientId} />
      <p className="text-muted-foreground text-xs">
        Already provisioned? Then the account has no projects, or your role cannot see them — the
        same permissions apply as in the provider&rsquo;s own product.
      </p>
      {footer && <div className="flex flex-wrap items-center gap-2">{footer}</div>}
    </section>
  )
}

export { ProvisioningNotice, type ProvisioningNoticeProps }
