import React from 'react'
import { motion } from 'framer-motion'
import { DashboardSummary } from '@/services/api'

interface SummaryCardsProps {
  data?: DashboardSummary
  isLoading?: boolean
}

interface SummaryCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: string
  index: number
}

function SummaryCard({ title, value, subtitle, icon, color, index }: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`p-6 rounded-lg border ${color} backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-6 rounded-lg border border-gray-700 bg-gray-800/50 animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 bg-gray-600 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-600 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-600 rounded w-24"></div>
            </div>
            <div className="w-8 h-8 bg-gray-600 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Icons (simple SVG icons)
const EngineIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
)

const HealthyIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const WarningIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const CriticalIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const RULIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

export function SummaryCards({ data, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-lg border border-gray-700 bg-gray-800/50">
          <p className="text-center text-gray-400">No data available</p>
        </div>
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Engines',
      value: data.total_engines,
      subtitle: `${data.active_engines} active`,
      icon: <EngineIcon />,
      color: 'border-blue-400/20 bg-blue-400/5'
    },
    {
      title: 'Healthy',
      value: data.healthy_engines,
      subtitle: `${Math.round((data.healthy_engines / data.total_engines) * 100)}% of fleet`,
      icon: <HealthyIcon />,
      color: 'border-green-400/20 bg-green-400/5'
    },
    {
      title: 'Warning',
      value: data.warning_engines,
      subtitle: `${Math.round((data.warning_engines / data.total_engines) * 100)}% of fleet`,
      icon: <WarningIcon />,
      color: 'border-yellow-400/20 bg-yellow-400/5'
    },
    {
      title: 'Critical',
      value: data.critical_engines,
      subtitle: `${Math.round((data.critical_engines / data.total_engines) * 100)}% of fleet`,
      icon: <CriticalIcon />,
      color: 'border-red-400/20 bg-red-400/5'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <SummaryCard
          key={card.title}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          icon={card.icon}
          color={card.color}
          index={index}
        />
      ))}
    </div>
  )
}

