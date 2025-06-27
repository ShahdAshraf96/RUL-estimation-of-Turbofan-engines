import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, Filter, Plus, Edit, Trash2, Eye, AlertTriangle,
  Settings, Download, Upload, RefreshCw, MoreVertical,
  Activity, Clock, Gauge, Wrench, CheckCircle, XCircle
} from 'lucide-react'
import { api } from '../services/api'

export const Engines: React.FC = () => {
  const [engines, setEngines] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedEngine, setSelectedEngine] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadEngines()
  }, [])

  const loadEngines = async () => {
    setIsLoading(true)
    try {
      const data = await api.getEngines()
      setEngines(data)
    } catch (error) {
      console.error('Failed to load engines:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredEngines = engines.filter(engine => {
    const matchesSearch = engine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         engine.model.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || engine.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-400/20'
      case 'warning': return 'text-yellow-400 bg-yellow-400/20'
      case 'critical': return 'text-red-400 bg-red-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'critical': return <XCircle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const handleRefresh = () => {
    loadEngines()
  }

  const EngineCard = ({ engine }: { engine: any }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg p-6 border border-border hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{engine.name}</h3>
          <p className="text-sm text-muted-foreground">{engine.model}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(engine.status)}`}>
            {getStatusIcon(engine.status)}
            <span className="capitalize">{engine.status}</span>
          </span>
          <button className="p-1 hover:bg-muted rounded">
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Current RUL</p>
          <p className="text-xl font-bold text-foreground">{Math.round(engine.current_rul)}</p>
          <p className="text-xs text-muted-foreground">cycles</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Confidence</p>
          <p className="text-xl font-bold text-foreground">{(engine.confidence * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Last Updated:</span>
          <span className="text-foreground">{new Date(engine.last_updated).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Status:</span>
          <span className="text-foreground capitalize">{engine.status}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Active:</span>
          <span className="text-foreground">{engine.is_active ? 'Yes' : 'No'}</span>
        </div>
      </div>

      <div className="flex space-x-2">
        <button 
          onClick={() => {
            setSelectedEngine(engine)
            setShowDetails(true)
          }}
          className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm hover:bg-primary/90 flex items-center justify-center space-x-1"
        >
          <Eye className="h-4 w-4" />
          <span>View Details</span>
        </button>
        <button className="bg-muted text-muted-foreground px-3 py-2 rounded-md text-sm hover:bg-muted/80 flex items-center justify-center">
          <Edit className="h-4 w-4" />
        </button>
        <button className="bg-muted text-muted-foreground px-3 py-2 rounded-md text-sm hover:bg-muted/80 flex items-center justify-center">
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )

  const EngineDetailsModal = () => {
    if (!showDetails || !selectedEngine) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-border"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">{selectedEngine.name} Details</h2>
            <button 
              onClick={() => setShowDetails(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="text-foreground">{selectedEngine.model}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Serial Number</p>
                  <p className="text-foreground">{selectedEngine.serialNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aircraft</p>
                  <p className="text-foreground">{selectedEngine.aircraft}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-foreground">{selectedEngine.location}</p>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Performance</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Current RUL</p>
                  <p className="text-2xl font-bold text-foreground">{selectedEngine.currentRUL} cycles</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <p className="text-xl font-bold text-foreground">{(selectedEngine.confidence * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Efficiency</p>
                  <p className="text-foreground">{selectedEngine.efficiency}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${getStatusColor(selectedEngine.status)}`}>
                    {getStatusIcon(selectedEngine.status)}
                    <span className="capitalize">{selectedEngine.status}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Maintenance Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Maintenance</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Last Maintenance</p>
                  <p className="text-foreground">{selectedEngine.lastMaintenance}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Maintenance</p>
                  <p className="text-foreground">{selectedEngine.nextMaintenance}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Flight Hours</p>
                  <p className="text-foreground">{selectedEngine.flightHours.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Cycles</p>
                  <p className="text-foreground">{selectedEngine.cycles.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-6 pt-6 border-t border-border">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center space-x-2">
              <Wrench className="h-4 w-4" />
              <span>Schedule Maintenance</span>
            </button>
            <button className="bg-muted text-muted-foreground px-4 py-2 rounded-md hover:bg-muted/80 flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
            <button className="bg-muted text-muted-foreground px-4 py-2 rounded-md hover:bg-muted/80 flex items-center space-x-2">
              <Edit className="h-4 w-4" />
              <span>Edit Engine</span>
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Engine Management</h1>
          <p className="text-muted-foreground">Manage and monitor individual turbofan engines</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Engine</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-muted text-muted-foreground px-4 py-2 rounded-md hover:bg-muted/80 flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search engines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Status</option>
          <option value="healthy">Healthy</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <button className="bg-muted text-muted-foreground px-4 py-2 rounded-md hover:bg-muted/80 flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <span>More Filters</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">Total Engines</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{engines.length}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground">Healthy</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{engines.filter(e => e.status === 'healthy').length}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-muted-foreground">Warning</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{engines.filter(e => e.status === 'warning').length}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-muted-foreground">Critical</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{engines.filter(e => e.status === 'critical').length}</p>
        </div>
      </div>

      {/* Engine Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEngines.map((engine) => (
          <EngineCard key={engine.id} engine={engine} />
        ))}
      </div>

      {filteredEngines.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No engines found matching your criteria.</p>
        </div>
      )}

      {/* Engine Details Modal */}
      <EngineDetailsModal />
    </div>
  )
}

