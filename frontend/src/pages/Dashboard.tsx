import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { EngineGrid } from '@/components/dashboard/EngineGrid'
import { RULChart } from '@/components/charts/RULChart'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { AlertsPanel } from '@/components/dashboard/AlertsPanel'
import { api } from '@/services/api'

export function Dashboard() {
//   const { data: summary, isFetching: summaryFetching } = useQuery({
//   queryKey: ['dashboard-summary'],
//   queryFn: api.getDashboardSummary,
//   refetchInterval: 100000,      // every 5 seconds
//   refetchOnWindowFocus: true, // optional: refetch when the tab regains focus
// })

const { data: engines = [], isFetching: enginesFetching } = useQuery({
    queryKey: ['engines'],
    queryFn: api.getEngines,
    refetchInterval: 10000,
  })
  const total    = engines.length
  const healthy  = engines.filter(e => e.status === 'healthy').length
  const warning  = engines.filter(e => e.status === 'warning').length
  const critical = engines.filter(e => e.status === 'critical').length
  const active   = engines.filter(e => e.is_active).length
  const avgRul   = active > 0
    ? Math.round(engines.reduce((sum, e) => sum + e.current_rul, 0) / active)
    : 0

  const summaryComputed = {
    total_engines:   total,
    healthy_engines: healthy,
    warning_engines: warning,
    critical_engines: critical,
    active_engines:  active,
    average_rul:     avgRul,
  }
console.log('[Dashboard] engines:', engines)


  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RUL Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of turbofan engine health
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">Live</span>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <SummaryCards data={summaryComputed} isLoading={enginesFetching} />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engine Grid */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <EngineGrid engines={engines} isLoading={enginesFetching} />
        </motion.div>

        {/* Alerts Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <AlertsPanel engines={engines} />
        </motion.div>
      </div>

      {/* RUL Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <RULChart engines={engines} />
      </motion.div>
    </div>
  )
}

