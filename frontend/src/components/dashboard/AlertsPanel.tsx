import React from 'react'
import { motion } from 'framer-motion'
import { Engine } from '@/services/api'

interface AlertsPanelProps {
  engines?: Engine[]
}

interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  engineName?: string
}

function AlertItem({ alert, index }: { alert: Alert; index: number }) {
  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-red-400/20 bg-red-400/5 text-red-400'
      case 'warning':
        return 'border-yellow-400/20 bg-yellow-400/5 text-yellow-400'
      case 'info':
        return 'border-blue-400/20 bg-blue-400/5 text-blue-400'
      default:
        return 'border-gray-400/20 bg-gray-400/5 text-gray-400'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={`p-4 rounded-lg border ${getAlertColor(alert.type)} backdrop-blur-sm`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getAlertIcon(alert.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white truncate">{alert.title}</p>
            <span className="text-xs text-gray-400">{alert.timestamp}</span>
          </div>
          <p className="text-sm text-gray-300 mt-1">{alert.message}</p>
          {alert.engineName && (
            <p className="text-xs text-gray-400 mt-2">Engine: {alert.engineName}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function generateAlertsFromEngines(engines: Engine[]): Alert[] {
  const alerts: Alert[] = []
  
  engines.forEach((engine) => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    if (engine.status === 'critical') {
      alerts.push({
        id: `critical-${engine.id}`,
        type: 'critical',
        title: 'Critical RUL Alert',
        message: `RUL dropped to ${Math.round(engine.current_rul)} cycles. Immediate maintenance required.`,
        timestamp: timeStr,
        engineName: engine.name
      })
    } else if (engine.status === 'warning') {
      alerts.push({
        id: `warning-${engine.id}`,
        type: 'warning',
        title: 'RUL Warning',
        message: `RUL at ${Math.round(engine.current_rul)} cycles. Schedule maintenance soon.`,
        timestamp: timeStr,
        engineName: engine.name
      })
    }
    
    // Add confidence alerts for low confidence predictions
    if (engine.confidence < 0.7) {
      alerts.push({
        id: `confidence-${engine.id}`,
        type: 'info',
        title: 'Low Prediction Confidence',
        message: `Model confidence at ${Math.round(engine.confidence * 100)}%. Consider additional sensor data.`,
        timestamp: timeStr,
        engineName: engine.name
      })
    }
  })
  
  // Add some system alerts
  alerts.push({
    id: 'system-1',
    type: 'info',
    title: 'Model Update Available',
    message: 'New transformer model version 2.1 available for deployment.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })
  
  // Sort by severity (critical first, then warning, then info)
  const severityOrder = { critical: 0, warning: 1, info: 2 }
  return alerts.sort((a, b) => severityOrder[a.type] - severityOrder[b.type])
}

export function AlertsPanel({ engines }: AlertsPanelProps) {
  const alerts = engines ? generateAlertsFromEngines(engines) : []
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Live Alerts</h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-sm text-gray-400">Real-time</span>
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.length > 0 ? (
          alerts.map((alert, index) => (
            <AlertItem key={alert.id} alert={alert} index={index} />
          ))
        ) : (
          <div className="p-6 text-center border border-gray-700 rounded-lg bg-gray-800/50">
            <div className="text-green-400 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-400">All systems operational</p>
            <p className="text-sm text-gray-500 mt-1">No active alerts</p>
          </div>
        )}
      </div>
      
      {alerts.length > 0 && (
        <div className="pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              {alerts.filter(a => a.type === 'critical').length} critical, {' '}
              {alerts.filter(a => a.type === 'warning').length} warning, {' '}
              {alerts.filter(a => a.type === 'info').length} info
            </span>
            <button className="text-blue-400 hover:text-blue-300 transition-colors">
              View All
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

