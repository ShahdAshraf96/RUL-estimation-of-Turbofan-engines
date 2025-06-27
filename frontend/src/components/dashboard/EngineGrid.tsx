import React from 'react'
import { motion } from 'framer-motion'
import { Engine } from '@/services/api'

interface EngineGridProps {
  engines?: Engine[]
  isLoading?: boolean
}

interface EngineCardProps {
  engine: Engine
  index: number
}

function EngineCard({ engine, index }: EngineCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400 border-green-400/20 bg-green-400/5'
      case 'warning':
        return 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5'
      case 'critical':
        return 'text-red-400 border-red-400/20 bg-red-400/5'
      default:
        return 'text-gray-400 border-gray-400/20 bg-gray-400/5'
    }
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'stroke-green-400'
      case 'warning':
        return 'stroke-yellow-400'
      case 'critical':
        return 'stroke-red-400'
      default:
        return 'stroke-gray-400'
    }
  }

  const getProgressPercentage = (rul: number) => {
    // Normalize RUL to percentage (assuming max RUL of 300)
    return Math.min(100, Math.max(0, (rul / 300) * 100))
  }

  const progressPercentage = getProgressPercentage(engine.current_rul)
  const circumference = 2 * Math.PI * 45 // radius = 45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative p-6 rounded-lg border ${getStatusColor(engine.status)} backdrop-blur-sm`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white">{engine.name}</h3>
          <p className="text-sm text-gray-400">{engine.model}</p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(engine.status)}`}>
          {engine.status.toUpperCase()}
        </div>
      </div>

      {/* Circular Progress */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className={`${getProgressColor(engine.status)} transition-all duration-1000 ease-out`}
              strokeLinecap="round"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xl font-bold text-white">{Math.round(engine.current_rul)}</div>
              <div className="text-xs text-gray-400">cycles</div>
            </div>
          </div>
        </div>
      </div>

      {/* Confidence */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Confidence</span>
        <span className="text-white font-medium">{Math.round(engine.confidence * 100)}%</span>
      </div>

      {/* Last Updated */}
      <div className="flex items-center justify-between text-sm mt-2">
        <span className="text-gray-400">Last Updated</span>
        <span className="text-white font-medium">
          {engine.last_updated ? new Date(engine.last_updated).toLocaleTimeString() : 'N/A'}
        </span>
      </div>

      {/* Status indicator */}
      <div className="absolute top-2 right-2">
        <div className={`w-3 h-3 rounded-full ${engine.is_active ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
      </div>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-6 rounded-lg border border-gray-700 bg-gray-800/50 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="h-4 bg-gray-600 rounded w-20 mb-2"></div>
              <div className="h-3 bg-gray-600 rounded w-16"></div>
            </div>
            <div className="h-6 bg-gray-600 rounded w-16"></div>
          </div>
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 bg-gray-600 rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 bg-gray-600 rounded w-16"></div>
              <div className="h-3 bg-gray-600 rounded w-12"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-3 bg-gray-600 rounded w-20"></div>
              <div className="h-3 bg-gray-600 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function EngineGrid({ engines, isLoading }: EngineGridProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Engine Status</h2>
        <LoadingSkeleton />
      </div>
    )
  }

  if (!engines || engines.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Engine Status</h2>
        <div className="p-8 text-center border border-gray-700 rounded-lg bg-gray-800/50">
          <p className="text-gray-400">No engines found</p>
          <p className="text-sm text-gray-500 mt-2">Check your backend connection</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Engine Status</h2>
        <div className="text-sm text-gray-400">
          {engines.length} engine{engines.length !== 1 ? 's' : ''} monitored
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {engines.map((engine, index) => (
          <EngineCard key={engine.id} engine={engine} index={index} />
        ))}
      </div>
    </div>
  )
}

