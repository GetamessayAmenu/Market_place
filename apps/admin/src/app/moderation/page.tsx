import { fetchModerationItems, fetchModerationStats } from '../../lib/adminApi'
import ModerationDashboard from '../../components/admin/ModerationDashboard'

export const dynamic = 'force-dynamic'

export default async function ModerationPage() {
  const [items, stats] = await Promise.all([
    fetchModerationItems({ page: 1, limit: 20 }),
    fetchModerationStats(),
  ])

  return (
    <ModerationDashboard 
      initialData={items} 
      initialStats={stats.data} 
    />
  )
}
