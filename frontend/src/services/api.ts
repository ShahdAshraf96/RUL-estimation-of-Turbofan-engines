import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const ML_API_BASE_URL = import.meta.env.VITE_ML_API_BASE_URL || 'http://localhost:8001'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

const mlApiClient = axios.create({
  baseURL: ML_API_BASE_URL,
  timeout: 10000,
})

// Types
export interface Engine {
  id: number
  name: string
  model: string
  status: 'healthy' | 'warning' | 'critical'
  current_rul: number
  confidence: number
  last_updated: string
  is_active: boolean
}

export interface DashboardSummary {
  total_engines: number
  healthy_engines: number
  warning_engines: number
  critical_engines: number
  average_rul: number
  active_engines: number
}

export interface PredictionRequest {
  engine_id: number
  sensor_data: number[]
}

export interface PredictionResponse {
  engine_id: number
  predicted_rul: number
  confidence: number
  status: 'healthy' | 'warning' | 'critical'
  timestamp: string
}

// API functions
export const api = {
  // Dashboard endpoints
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get('/api/v1/dashboard/summary')
    return response.data
  },

  // Engine endpoints
  getEngines: async (): Promise<Engine[]> => {
    const response = await apiClient.get('/api/v1/engines')
    return response.data
  },

  getEngine: async (id: number): Promise<Engine> => {
    try {
      const response = await apiClient.get(`/api/v1/engines/${id}`)
      return response.data
    } catch (error) {
      throw new Error(`Failed to fetch engine ${id}`)
    }
  },

  // ML Service endpoints
  predictRUL: async (request: PredictionRequest): Promise<PredictionResponse> => {
    try {
      const response = await mlApiClient.post('/predict', request)
      return response.data
    } catch (error) {
      throw new Error('Failed to predict RUL')
    }
  },

  // Health check
  healthCheck: async (): Promise<{ status: string }> => {
    try {
      const response = await apiClient.get('/health')
      return response.data
    } catch (error) {
      return { status: 'offline' }
    }
  }
}

export default api

