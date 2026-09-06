/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as ideaBoxNotification } from './idea-box-notification.tsx'
import { template as wisselkassaAanvraag } from './wisselkassa-aanvraag.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'idea-box-notification': ideaBoxNotification,
  'wisselkassa-aanvraag': wisselkassaAanvraag,
}
