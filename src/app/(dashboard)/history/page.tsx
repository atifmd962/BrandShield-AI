import { Suspense } from 'react'
import { LoadingPage } from '@/components/ui/Spinner'
import HistoryContent from './HistoryContent'

export default function HistoryPage() {
  return (
    <Suspense fallback={<LoadingPage message="Loading revision history…" />}>
      <HistoryContent />
    </Suspense>
  )
}
