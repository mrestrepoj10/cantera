import { ComponentSidebar } from '@/components/site/component-sidebar'
import { componentRegistryGroups } from '@/components/site/registry'

export default function ComponentsLayout({ children }: { children: React.ReactNode }) {
  const groups = componentRegistryGroups.map((group) => ({
    id: group.id,
    title: group.title,
    items: group.items.map(({ name, title }) => ({ name, title })),
  }))

  return (
    <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6">
      <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
        <ComponentSidebar groups={groups} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
