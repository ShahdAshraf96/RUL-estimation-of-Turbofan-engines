import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings as SettingsIcon, Bell, Shield, Database, Cpu, 
  Monitor, Palette, Globe, Clock, Save, RefreshCw,
  AlertTriangle, CheckCircle, Info, User, Key, Mail,
  Smartphone, Download, Upload, Trash2, Eye, EyeOff
} from 'lucide-react'

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general')
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    criticalOnly: false,
    maintenanceReminders: true,
    weeklyReports: true
  })
  
  const [modelSettings, setModelSettings] = useState({
    predictionInterval: 30,
    confidenceThreshold: 0.8,
    autoRetrain: true,
    batchSize: 32,
    sequenceLength: 30,
    modelVersion: 'transformer_fd002_v1.0'
  })

  const [systemSettings, setSystemSettings] = useState({
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    autoRefresh: true,
    refreshInterval: 30,
    maxHistoryDays: 365
  })

  const [showApiKey, setShowApiKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => setIsSaving(false), 1500)
  }

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'model', label: 'Model Settings', icon: Cpu },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ]

  const SettingCard = ({ title, description, children }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg p-6 border border-border"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {children}
    </motion.div>
  )

  const Toggle = ({ checked, onChange, label }: any) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <SettingCard
        title="System Configuration"
        description="Basic system settings and preferences"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Theme</label>
            <select
              value={systemSettings.theme}
              onChange={(e) => setSystemSettings({...systemSettings, theme: e.target.value})}
              className="w-full bg-background border border-border rounded-md px-3 py-2"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Language</label>
            <select
              value={systemSettings.language}
              onChange={(e) => setSystemSettings({...systemSettings, language: e.target.value})}
              className="w-full bg-background border border-border rounded-md px-3 py-2"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Timezone</label>
            <select
              value={systemSettings.timezone}
              onChange={(e) => setSystemSettings({...systemSettings, timezone: e.target.value})}
              className="w-full bg-background border border-border rounded-md px-3 py-2"
            >
              <option value="UTC">UTC</option>
              <option value="EST">Eastern Time</option>
              <option value="PST">Pacific Time</option>
              <option value="GMT">Greenwich Mean Time</option>
            </select>
          </div>
        </div>
      </SettingCard>

      <SettingCard
        title="Auto Refresh"
        description="Configure automatic data refresh settings"
      >
        <div className="space-y-4">
          <Toggle
            checked={systemSettings.autoRefresh}
            onChange={(checked: boolean) => setSystemSettings({...systemSettings, autoRefresh: checked})}
            label="Enable auto refresh"
          />
          {systemSettings.autoRefresh && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Refresh Interval (seconds)
              </label>
              <input
                type="number"
                value={systemSettings.refreshInterval}
                onChange={(e) => setSystemSettings({...systemSettings, refreshInterval: parseInt(e.target.value)})}
                className="w-full bg-background border border-border rounded-md px-3 py-2"
                min="10"
                max="300"
              />
            </div>
          )}
        </div>
      </SettingCard>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <SettingCard
        title="Alert Preferences"
        description="Configure how and when you receive notifications"
      >
        <div className="space-y-4">
          <Toggle
            checked={notifications.emailAlerts}
            onChange={(checked: boolean) => setNotifications({...notifications, emailAlerts: checked})}
            label="Email alerts"
          />
          <Toggle
            checked={notifications.smsAlerts}
            onChange={(checked: boolean) => setNotifications({...notifications, smsAlerts: checked})}
            label="SMS alerts"
          />
          <Toggle
            checked={notifications.pushNotifications}
            onChange={(checked: boolean) => setNotifications({...notifications, pushNotifications: checked})}
            label="Push notifications"
          />
          <Toggle
            checked={notifications.criticalOnly}
            onChange={(checked: boolean) => setNotifications({...notifications, criticalOnly: checked})}
            label="Critical alerts only"
          />
        </div>
      </SettingCard>

      <SettingCard
        title="Maintenance & Reports"
        description="Configure maintenance reminders and report delivery"
      >
        <div className="space-y-4">
          <Toggle
            checked={notifications.maintenanceReminders}
            onChange={(checked: boolean) => setNotifications({...notifications, maintenanceReminders: checked})}
            label="Maintenance reminders"
          />
          <Toggle
            checked={notifications.weeklyReports}
            onChange={(checked: boolean) => setNotifications({...notifications, weeklyReports: checked})}
            label="Weekly summary reports"
          />
        </div>
      </SettingCard>

      <SettingCard
        title="Contact Information"
        description="Update your contact details for notifications"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
            <input
              type="email"
              placeholder="admin@company.com"
              className="w-full bg-background border border-border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
            <input
              type="tel"
              placeholder="+1 (555) 123-4567"
              className="w-full bg-background border border-border rounded-md px-3 py-2"
            />
          </div>
        </div>
      </SettingCard>
    </div>
  )

  const renderModelSettings = () => (
    <div className="space-y-6">
      <SettingCard
        title="Prediction Configuration"
        description="Configure model prediction parameters"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Prediction Interval (seconds)
            </label>
            <input
              type="number"
              value={modelSettings.predictionInterval}
              onChange={(e) => setModelSettings({...modelSettings, predictionInterval: parseInt(e.target.value)})}
              className="w-full bg-background border border-border rounded-md px-3 py-2"
              min="10"
              max="300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Confidence Threshold
            </label>
            <input
              type="number"
              value={modelSettings.confidenceThreshold}
              onChange={(e) => setModelSettings({...modelSettings, confidenceThreshold: parseFloat(e.target.value)})}
              className="w-full bg-background border border-border rounded-md px-3 py-2"
              min="0.1"
              max="1.0"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Sequence Length
            </label>
            <input
              type="number"
              value={modelSettings.sequenceLength}
              onChange={(e) => setModelSettings({...modelSettings, sequenceLength: parseInt(e.target.value)})}
              className="w-full bg-background border border-border rounded-md px-3 py-2"
              min="10"
              max="100"
            />
          </div>
        </div>
      </SettingCard>

      <SettingCard
        title="Model Training"
        description="Configure automatic model retraining"
      >
        <div className="space-y-4">
          <Toggle
            checked={modelSettings.autoRetrain}
            onChange={(checked: boolean) => setModelSettings({...modelSettings, autoRetrain: checked})}
            label="Enable automatic retraining"
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Batch Size
            </label>
            <input
              type="number"
              value={modelSettings.batchSize}
              onChange={(e) => setModelSettings({...modelSettings, batchSize: parseInt(e.target.value)})}
              className="w-full bg-background border border-border rounded-md px-3 py-2"
              min="8"
              max="128"
            />
          </div>
        </div>
      </SettingCard>

      <SettingCard
        title="Model Information"
        description="Current model version and statistics"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Model Version</span>
            <span className="text-sm font-medium text-foreground">{modelSettings.modelVersion}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Last Updated</span>
            <span className="text-sm font-medium text-foreground">2024-06-15 14:30 UTC</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Training Accuracy</span>
            <span className="text-sm font-medium text-foreground">96.3%</span>
          </div>
          <div className="flex space-x-2 mt-4">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90">
              Update Model
            </button>
            <button className="bg-muted text-muted-foreground px-4 py-2 rounded-md text-sm hover:bg-muted/80">
              Download Model
            </button>
          </div>
        </div>
      </SettingCard>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <SettingCard
        title="API Access"
        description="Manage API keys and access tokens"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">API Key</label>
            <div className="flex space-x-2">
              <input
                type={showApiKey ? "text" : "password"}
                value="rul_api_key_2024_abcd1234efgh5678"
                readOnly
                className="flex-1 bg-background border border-border rounded-md px-3 py-2"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="bg-muted text-muted-foreground px-3 py-2 rounded-md hover:bg-muted/80"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90">
              Generate New Key
            </button>
            <button className="bg-muted text-muted-foreground px-4 py-2 rounded-md text-sm hover:bg-muted/80">
              Copy Key
            </button>
          </div>
        </div>
      </SettingCard>

      <SettingCard
        title="User Management"
        description="Manage user accounts and permissions"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground">Current User</span>
            <span className="text-sm font-medium text-foreground">admin@company.com</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground">Role</span>
            <span className="text-sm font-medium text-foreground">Administrator</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground">Last Login</span>
            <span className="text-sm font-medium text-foreground">2024-06-23 09:15 UTC</span>
          </div>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90">
            Change Password
          </button>
        </div>
      </SettingCard>

      <SettingCard
        title="Session Management"
        description="Configure session timeout and security"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              defaultValue={60}
              className="w-full bg-background border border-border rounded-md px-3 py-2"
              min="15"
              max="480"
            />
          </div>
          <Toggle
            checked={true}
            onChange={() => {}}
            label="Require re-authentication for sensitive actions"
          />
          <Toggle
            checked={false}
            onChange={() => {}}
            label="Enable two-factor authentication"
          />
        </div>
      </SettingCard>
    </div>
  )

  const renderDataSettings = () => (
    <div className="space-y-6">
      <SettingCard
        title="Data Retention"
        description="Configure how long data is stored"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Maximum History (days)
            </label>
            <input
              type="number"
              value={systemSettings.maxHistoryDays}
              onChange={(e) => setSystemSettings({...systemSettings, maxHistoryDays: parseInt(e.target.value)})}
              className="w-full bg-background border border-border rounded-md px-3 py-2"
              min="30"
              max="3650"
            />
          </div>
          <Toggle
            checked={true}
            onChange={() => {}}
            label="Auto-archive old data"
          />
          <Toggle
            checked={false}
            onChange={() => {}}
            label="Compress archived data"
          />
        </div>
      </SettingCard>

      <SettingCard
        title="Data Export & Import"
        description="Manage data backup and migration"
      >
        <div className="space-y-4">
          <div className="flex space-x-2">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90 flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export All Data</span>
            </button>
            <button className="bg-muted text-muted-foreground px-4 py-2 rounded-md text-sm hover:bg-muted/80 flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Import Data</span>
            </button>
          </div>
          <div className="text-sm text-muted-foreground">
            Last backup: 2024-06-22 02:00 UTC
          </div>
        </div>
      </SettingCard>

      <SettingCard
        title="Database Maintenance"
        description="Database optimization and cleanup"
      >
        <div className="space-y-4">
          <div className="flex space-x-2">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600">
              Optimize Database
            </button>
            <button className="bg-yellow-500 text-white px-4 py-2 rounded-md text-sm hover:bg-yellow-600">
              Clean Temp Files
            </button>
            <button className="bg-red-500 text-white px-4 py-2 rounded-md text-sm hover:bg-red-600 flex items-center space-x-2">
              <Trash2 className="h-4 w-4" />
              <span>Clear Cache</span>
            </button>
          </div>
          <div className="text-sm text-muted-foreground">
            Database size: 2.4 GB • Cache size: 156 MB
          </div>
        </div>
      </SettingCard>
    </div>
  )

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <SettingCard
        title="Theme Customization"
        description="Customize the appearance of the dashboard"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Color Scheme</label>
            <div className="grid grid-cols-3 gap-2">
              <button className="h-12 bg-blue-500 rounded-md border-2 border-transparent hover:border-white"></button>
              <button className="h-12 bg-green-500 rounded-md border-2 border-transparent hover:border-white"></button>
              <button className="h-12 bg-purple-500 rounded-md border-2 border-transparent hover:border-white"></button>
            </div>
          </div>
          <Toggle
            checked={true}
            onChange={() => {}}
            label="Use system theme"
          />
          <Toggle
            checked={false}
            onChange={() => {}}
            label="High contrast mode"
          />
        </div>
      </SettingCard>

      <SettingCard
        title="Dashboard Layout"
        description="Customize dashboard layout and components"
      >
        <div className="space-y-4">
          <Toggle
            checked={true}
            onChange={() => {}}
            label="Show sidebar by default"
          />
          <Toggle
            checked={true}
            onChange={() => {}}
            label="Compact view mode"
          />
          <Toggle
            checked={false}
            onChange={() => {}}
            label="Show tooltips"
          />
        </div>
      </SettingCard>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralSettings()
      case 'notifications': return renderNotificationSettings()
      case 'model': return renderModelSettings()
      case 'security': return renderSecuritySettings()
      case 'data': return renderDataSettings()
      case 'appearance': return renderAppearanceSettings()
      default: return renderGeneralSettings()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure your RUL Dashboard preferences and system settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 flex items-center space-x-2 disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

