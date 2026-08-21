'use client'

import type * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { HubBrowser, type HubBrowserProps } from '@/components/ui/hub-browser'
import type { Item, ItemVersion } from '@/lib/project-types'
import { cn } from '@/lib/utils'

interface FilePickerDialogProps
  extends Omit<HubBrowserProps, 'onItemOpen' | 'onSelect' | 'title' | 'titleAs'> {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactElement
  title?: string
  description?: string
  onSelect: (item: Item, version?: ItemVersion) => void | Promise<void>
  onCancel?: () => void
  contentClassName?: string
}

function FilePickerDialog({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title = 'Choose a file',
  description = 'Browse a hub and choose the tip or a specific version.',
  onSelect,
  onCancel,
  contentClassName,
  ...browserProps
}: FilePickerDialogProps) {
  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent
        className={cn('w-[min(56rem,calc(100%-2rem))] gap-4 sm:max-w-4xl', contentClassName)}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <HubBrowser {...browserProps} title={title} titleAs="h3" onItemOpen={onSelect} />
        <DialogFooter>
          <DialogClose
            render={<Button type="button" variant="outline" className="min-h-11" />}
            onClick={onCancel}
          >
            Cancel
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { FilePickerDialog, type FilePickerDialogProps }
