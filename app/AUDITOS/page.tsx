import type { Metadata } from 'next'
import AuditOSDemo from '@/components/AuditOSDemo'

export const metadata: Metadata = {
  title: 'Carevo AuditOS - Enterprise care-routing operations demo',
  description:
    'Carevo AuditOS is an enterprise operations demo for real-time care-routing monitoring, review queues, safety metrics, traceability, and cost impact.',
}

export default function AuditOSDemoPage() {
  return <AuditOSDemo />
}
