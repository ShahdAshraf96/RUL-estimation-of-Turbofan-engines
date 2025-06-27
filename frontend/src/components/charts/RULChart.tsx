import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { Engine } from '@/services/api'

interface RULChartProps {
  engines?: Engine[]
}

interface ChartDataPoint {
  time: string
  timestamp: number
  [key: string]: any // For dynamic engine data
}

function generateHistoricalData(engines: Engine[]): ChartDataPoint[] {
  const data: ChartDataPoint[] = []
  const now = Date.now()
  const hoursBack = 24
  
  // Generate data points for the last 24 hours
  for (let i = hoursBack; i >= 0; i--) {
    const timestamp = now - (i * 60 * 60 * 1000) // Go back i hours
    const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    const dataPoint: ChartDataPoint = {
      time,
      timestamp
    }
    
    // Add simulated historical data for each engine
    engines.forEach((engine) => {
      // Simulate degradation over time with some noise
      const baseRUL = engine.current_rul
      const degradationRate = engine.status === 'critical' ? 2 : engine.status === 'warning' ? 1 : 0.5
      const noise = (Math.random() - 0.5) * 10 // Random noise
      const historicalRUL = Math.max(0, baseRUL + (i * degradationRate) + noise)
      
      dataPoint[engine.name] = Math.round(historicalRUL)
    })
    
    data.push(dataPoint)
  }
  
  return data
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
        <p className="text-gray-300 text-sm mb-2">{`Time: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.dataKey}: ${entry.value} cycles`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function getEngineColor(engine: Engine, index: number): string {
  // Use status-based colors, with fallback to index-based colors
  switch (engine.status) {
    case 'healthy':
      return '#10b981' // green-500
    case 'warning':
      return '#f59e0b' // yellow-500
    case 'critical':
      return '#ef4444' // red-500
    default:
      // Fallback colors for multiple engines
      const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#84cc16']
      return colors[index % colors.length]
  }
}

export function RULChart({ engines }: RULChartProps) {
  const chartData = useMemo(() => {
    if (!engines || engines.length === 0) return []
    return generateHistoricalData(engines)
  }, [engines])

  if (!engines || engines.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6 rounded-lg border border-gray-700 bg-gray-800/50"
      >
        <h2 className="text-xl font-semibold text-white mb-4">RUL Trend Analysis</h2>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-400">No engine data available</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 rounded-lg border border-gray-700 bg-gray-800/50 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">RUL Trend Analysis</h2>
          <p className="text-sm text-gray-400">24-hour historical view</p>
        </div>
        <div className="flex items-center space-x-4">
          {engines.slice(0, 3).map((engine, index) => (
            <div key={engine.id} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getEngineColor(engine, index) }}
              />
              <span className="text-sm text-gray-300">{engine.name}</span>
            </div>
          ))}
          {engines.length > 3 && (
            <span className="text-sm text-gray-400">+{engines.length - 3} more</span>
          )}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{ value: 'RUL (cycles)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {engines.map((engine, index) => (
              <Line
                key={engine.id}
                type="monotone"
                dataKey={engine.name}
                stroke={getEngineColor(engine, index)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: getEngineColor(engine, index), strokeWidth: 2, fill: '#1f2937' }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {engines.map((engine, index) => (
            <div key={engine.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getEngineColor(engine, index) }}
                />
                <span className="text-sm text-gray-300">{engine.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">{Math.round(engine.current_rul)}</div>
                <div className="text-xs text-gray-400">{Math.round(engine.confidence * 100)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

