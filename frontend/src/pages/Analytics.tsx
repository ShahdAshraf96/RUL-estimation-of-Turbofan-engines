import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts'
import { 
  TrendingUp, TrendingDown, AlertTriangle, Activity, 
  BarChart3, PieChart as PieChartIcon, Target, Zap,
  RefreshCw
} from 'lucide-react'
import { api, Engine } from '@/services/api'

export const Analytics: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('6M')
  const [isLoading, setIsLoading] = useState(false)

  // Fetch real data from API
  const { data: engines, isFetching: enginesFetching } = useQuery({
    queryKey: ['engines'],
    queryFn: api.getEngines,
    refetchInterval: 30000, // 30 seconds
  })

  const { data: summary, isFetching: summaryFetching } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: api.getDashboardSummary,
    refetchInterval: 30000, // 30 seconds
  })

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1500)
  }

  // Process real engine data for analytics
  const processEngineData = (engines: Engine[]) => {
    if (!engines) return { rulDistribution: [], engineTypeData: [], statusData: [] }

    // RUL Distribution
    const rulRanges = [
      { range: '0-50', count: 0 },
      { range: '51-100', count: 0 },
      { range: '101-150', count: 0 },
      { range: '151-200', count: 0 },
      { range: '200+', count: 0 }
    ]

    engines.forEach(engine => {
      const rul = engine.current_rul
      if (rul <= 50) rulRanges[0].count++
      else if (rul <= 100) rulRanges[1].count++
      else if (rul <= 150) rulRanges[2].count++
      else if (rul <= 200) rulRanges[3].count++
      else rulRanges[4].count++
    })

    // Engine Type Distribution
    const engineTypes = engines.reduce((acc: any, engine) => {
      acc[engine.model] = (acc[engine.model] || 0) + 1
      return acc
    }, {})

    const engineTypeData = Object.entries(engineTypes).map(([model, count], index) => ({
      name: model,
      value: count as number,
      color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]
    }))

    // Status Distribution
    const statusCounts = engines.reduce((acc: any, engine) => {
      acc[engine.status] = (acc[engine.status] || 0) + 1
      return acc
    }, { healthy: 0, warning: 0, critical: 0 })

    const statusData = [
      { name: 'Healthy', value: statusCounts.healthy, color: '#10b981' },
      { name: 'Warning', value: statusCounts.warning, color: '#f59e0b' },
      { name: 'Critical', value: statusCounts.critical, color: '#ef4444' }
    ]

    return { rulDistribution: rulRanges, engineTypeData, statusData }
  }

  const { rulDistribution, engineTypeData, statusData } = processEngineData(engines || [])

  // Calculate metrics from real data
  const totalEngines = engines?.length || 0
  const avgRUL = engines?.length ? engines.reduce((sum, e) => sum + e.current_rul, 0) / engines.length : 0
  const avgConfidence = engines?.length ? engines.reduce((sum, e) => sum + e.confidence, 0) / engines.length : 0
  const criticalCount = engines?.filter(e => e.status === 'critical').length || 0

  const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg p-6 border border-border"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {change > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Real-time analytics and insights for RUL predictions</p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm"
          >
            <option value="1M">Last Month</option>
            <option value="3M">Last 3 Months</option>
            <option value="6M">Last 6 Months</option>
            <option value="1Y">Last Year</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics - Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Engines"
          value={totalEngines}
          icon={Activity}
          color="bg-blue-500"
        />
        <StatCard
          title="Average RUL"
          value={`${avgRUL.toFixed(1)} cycles`}
          icon={Target}
          color="bg-green-500"
        />
        <StatCard
          title="Critical Engines"
          value={criticalCount}
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <StatCard
          title="Avg Confidence"
          value={`${(avgConfidence * 100).toFixed(1)}%`}
          icon={Zap}
          color="bg-purple-500"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RUL Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card rounded-lg p-6 border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">RUL Distribution</h3>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rulDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Engine Type Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card rounded-lg p-6 border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Engine Type Distribution</h3>
            <PieChartIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={engineTypeData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {engineTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-lg p-6 border border-border"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Engine Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Engine Health Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-lg p-6 border border-border"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Engine Health Overview</h3>
          <div className="space-y-4">
            {engines?.slice(0, 6).map((engine, index) => (
              <div key={engine.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    engine.status === 'healthy' ? 'bg-green-500' :
                    engine.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm font-medium text-foreground">{engine.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">{Math.round(engine.current_rul)} cycles</div>
                  <div className="text-xs text-muted-foreground">{Math.round(engine.confidence * 100)}% confidence</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Real-time Data Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg p-6 border border-border"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">Data Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{totalEngines}</div>
            <div className="text-sm text-muted-foreground">Total Engines Monitored</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {enginesFetching || summaryFetching ? 'Updating...' : 'Live'}
            </div>
            <div className="text-sm text-muted-foreground">Data Status</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">FD002</div>
            <div className="text-sm text-muted-foreground">Dataset Source</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

