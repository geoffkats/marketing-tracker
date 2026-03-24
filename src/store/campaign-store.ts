import { create } from 'zustand'

export interface Asset {
  id: string
  type: 'image' | 'video' | 'copy' | 'pdf' | 'contract' | 'other'
  fileName: string
  driveLink: string
  owner: string
  version: string
  createdDate: string
  lastUpdated: string
  status: 'draft' | 'approved' | 'archived'
}

export interface UTMParameter {
  id: string
  channel: 'FB' | 'IG' | 'TT' | 'Google' | 'Email' | 'SMS' | 'LinkedIn'
  source: string
  medium: string
  campaign: string
  content: string
  term?: string
  finalUrl: string
  utmUrl: string
  createdBy: string
  createdDate: string
}

export interface RawData {
  date: string
  channel: string
  metric: 'Impressions' | 'Clicks' | 'Spend' | 'Registrations' | 'Leads' | 'Cost'
  value: number
}

export interface KPI {
  metric: string
  target: number
  current: number
  delta: number
  status: 'success' | 'warning'
  lastUpdated: string
}

export interface AlertSetting {
  id: string
  metric: string
  threshold: number
  direction: 'above' | 'below'
  recipientEmails: string[]
  slackChannel?: string
  active: boolean
}

export interface AlertLog {
  id: string
  timestamp: string
  metric: string
  value: number
  threshold: number
  recipients: string[]
}

interface CampaignState {
  // These are now empty by default - data comes from database via API
  assets: Asset[]
  utmParameters: UTMParameter[]
  rawData: RawData[]
  kpis: KPI[]
  alertSettings: AlertSetting[]
  alertLogs: AlertLog[]
  
  // UI state setters - used for temporary local state only
  setAssets: (assets: Asset[]) => void
  addAsset: (asset: Asset) => void
  updateAsset: (id: string, updates: Partial<Asset>) => void
  deleteAsset: (id: string) => void
  
  setUTMParameters: (utms: UTMParameter[]) => void
  addUTM: (utm: UTMParameter) => void
  deleteUTM: (id: string) => void
  
  setRawData: (data: RawData[]) => void
  addRawData: (data: RawData) => void
  clearRawData: () => void
  
  setKPIs: (kpis: KPI[]) => void
  updateKPI: (metric: string, updates: Partial<KPI>) => void
  
  setAlertSettings: (settings: AlertSetting[]) => void
  addAlertSetting: (setting: AlertSetting) => void
  updateAlertSetting: (id: string, updates: Partial<AlertSetting>) => void
  deleteAlertSetting: (id: string) => void
  
  addAlertLog: (log: AlertLog) => void
}

// Empty initial state - all data comes from database
export const useCampaignStore = create<CampaignState>((set) => ({
  assets: [],
  utmParameters: [],
  rawData: [],
  kpis: [],
  alertSettings: [],
  alertLogs: [],
  
  setAssets: (assets) => set({ assets }),
  addAsset: (asset) => set((state) => ({ assets: [...state.assets, asset] })),
  updateAsset: (id, updates) => set((state) => ({
    assets: state.assets.map((a) => a.id === id ? { ...a, ...updates } : a)
  })),
  deleteAsset: (id) => set((state) => ({
    assets: state.assets.filter((a) => a.id !== id)
  })),
  
  setUTMParameters: (utmParameters) => set({ utmParameters }),
  addUTM: (utm) => set((state) => ({ utmParameters: [...state.utmParameters, utm] })),
  deleteUTM: (id) => set((state) => ({
    utmParameters: state.utmParameters.filter((u) => u.id !== id)
  })),
  
  setRawData: (rawData) => set({ rawData }),
  addRawData: (data) => set((state) => ({ rawData: [...state.rawData, data] })),
  clearRawData: () => set({ rawData: [] }),
  
  setKPIs: (kpis) => set({ kpis }),
  updateKPI: (metric, updates) => set((state) => ({
    kpis: state.kpis.map((k) => k.metric === metric ? { ...k, ...updates } : k)
  })),
  
  setAlertSettings: (alertSettings) => set({ alertSettings }),
  addAlertSetting: (setting) => set((state) => ({
    alertSettings: [...state.alertSettings, setting]
  })),
  updateAlertSetting: (id, updates) => set((state) => ({
    alertSettings: state.alertSettings.map((a) => a.id === id ? { ...a, ...updates } : a)
  })),
  deleteAlertSetting: (id) => set((state) => ({
    alertSettings: state.alertSettings.filter((a) => a.id !== id)
  })),
  
  addAlertLog: (log) => set((state) => ({ alertLogs: [...state.alertLogs, log] })),
}))
