import { get, post, put, del } from './request'

export interface WarningEvent {
  id: number
  eventNo: string
  ruleId: number
  ruleName: string
  alertLevel: string
  alertLevelName: string
  triggerTime: string
  regionName: string
  status: string
  statusName: string
  disposalDeptName: string
  isAdopted: number | null
  notifyTime?: string
  notifyObject?: string
  notifyChannel?: string
  aiAnalysisSuggestion?: string
  triggerBasis?: string
  adoptTime?: string
  disposalContent?: string
}

export interface WarningEventDetail extends WarningEvent {
  relatedIncidents: RelatedIncident[]
}

export interface RelatedIncident {
  jjdbh: string
  bjnr: string
  bjlxdm: string
  involvedAmount: string
  disposalStatus: string
  urgencyLevel: string
}

export interface WarningStatistics {
  totalCount: number
  pendingCount: number
  adoptedCount: number
  rejectedCount: number
  trendData: { date: string; count: number }[]
}

export interface WarningEventListResult {
  list: WarningEvent[]
  total: number
  page: number
  size: number
}

export interface WarningIndicator {
  id: number
  indicatorName: string
  indicatorDesc: string
  configType: string
  configTypeName: string
  sqlContent?: string
  indicatorTags: string[]
  enabled: number
  createBy: string
  createTime: string
  updateTime: string
}

export interface WarningIndicatorListResult {
  list: WarningIndicator[]
  total: number
  page: number
  size: number
}

export interface IndicatorOption {
  id: number
  indicatorName: string
}

export interface WarningRule {
  id: number
  ruleName: string
  ruleDesc: string
  category: string
  alertLevel: string
  alertLevelName: string
  startTime: string
  endTime: string | null
  notificationChannels: string[]
  associatedPlatform: string
  notifyFrequencyType: string
  notifyCronExpr: string | null
  notifyTemplate: string
  enabled: number
  triggerCount: number
  createBy: string
  createTime: string
  notificationObjects: { objectType: string; objectCode?: string; objectName: string }[]
  conditions?: RuleCondition[]
}

export interface RuleCondition {
  id?: number
  groupIndex: number
  indicatorId: number
  indicatorName?: string
  operator: string
  thresholdSingle?: string
  thresholdMin?: string
  thresholdMax?: string
}

export interface WarningRuleListResult {
  list: WarningRule[]
  total: number
  page: number
  size: number
}

export async function getWarningEvents(params: {
  page?: number
  size?: number
  timeRange?: string
  startTime?: string
  endTime?: string
  alertLevel?: string
  status?: string
  keyword?: string
}): Promise<WarningEventListResult> {
  const query = new URLSearchParams()
  if (params.page) query.append('page', params.page.toString())
  if (params.size) query.append('size', params.size.toString())
  if (params.timeRange) query.append('timeRange', params.timeRange)
  if (params.startTime) query.append('startTime', params.startTime)
  if (params.endTime) query.append('endTime', params.endTime)
  if (params.alertLevel) query.append('alertLevel', params.alertLevel)
  if (params.status) query.append('status', params.status)
  if (params.keyword) query.append('keyword', params.keyword)
  
  return get<WarningEventListResult>(`/warning/events?${query.toString()}`)
}

export async function getWarningEventDetail(eventNo: string): Promise<WarningEventDetail> {
  return get<WarningEventDetail>(`/warning/events/${eventNo}`)
}

export async function feedbackWarningEvent(eventNo: string, data: {
  isAdopted: number
  adoptTime?: string
  disposalContent: string
}): Promise<void> {
  await put(`/warning/events/${eventNo}/feedback`, data)
}

export async function getWarningStatistics(): Promise<WarningStatistics> {
  return get<WarningStatistics>('/warning/events/statistics')
}

export async function getIndicatorList(params: {
  page?: number
  size?: number
  keyword?: string
  tag?: string
  enabled?: number
}): Promise<WarningIndicatorListResult> {
  const query = new URLSearchParams()
  if (params.page) query.append('page', params.page.toString())
  if (params.size) query.append('size', params.size.toString())
  if (params.keyword) query.append('keyword', params.keyword)
  if (params.tag) query.append('tag', params.tag)
  if (params.enabled !== undefined) query.append('enabled', params.enabled.toString())
  
  return get<WarningIndicatorListResult>(`/warning/indicators?${query.toString()}`)
}

export async function getIndicatorDetail(id: number): Promise<WarningIndicator> {
  return get<WarningIndicator>(`/warning/indicators/${id}`)
}

export async function createIndicator(data: {
  indicatorName: string
  indicatorDesc: string
  configType: string
  sqlContent?: string
  indicatorTags: string[]
}): Promise<{ id: number }> {
  return post<{ id: number }>('/warning/indicators', data)
}

export async function updateIndicator(id: number, data: Partial<{
  indicatorName: string
  indicatorDesc: string
  configType: string
  sqlContent?: string
  indicatorTags: string[]
}>): Promise<void> {
  await put(`/warning/indicators/${id}`, data)
}

export async function deleteIndicator(id: number): Promise<void> {
  await del(`/warning/indicators/${id}`)
}

export async function toggleIndicatorStatus(id: number, enabled: number): Promise<void> {
  await put(`/warning/indicators/${id}/status`, { enabled })
}

export async function getIndicatorSelect(): Promise<IndicatorOption[]> {
  return get<IndicatorOption[]>('/warning/indicators/select')
}

export async function getRuleList(params: {
  page?: number
  size?: number
  ruleName?: string
  enabled?: number
  category?: string
  alertLevel?: string
}): Promise<WarningRuleListResult> {
  const query = new URLSearchParams()
  if (params.page) query.append('page', params.page.toString())
  if (params.size) query.append('size', params.size.toString())
  if (params.ruleName) query.append('ruleName', params.ruleName)
  if (params.enabled !== undefined) query.append('enabled', params.enabled.toString())
  if (params.category) query.append('category', params.category)
  if (params.alertLevel) query.append('alertLevel', params.alertLevel)
  
  return get<WarningRuleListResult>(`/warning/rules?${query.toString()}`)
}

export async function getRuleDetail(id: number): Promise<WarningRule> {
  return get<WarningRule>(`/warning/rules/${id}`)
}

export async function createRule(data: {
  ruleName: string
  ruleDesc: string
  category: string
  alertLevel: string
  startTime: string
  endTime?: string
  notificationChannels: string[]
  associatedPlatform?: string
  notifyFrequencyType: string
  notifyCronExpr?: string
  notifyTemplate: string
  conditions: RuleCondition[]
  notificationObjects: { objectType: string; objectCode: string; objectName: string }[]
}): Promise<{ id: number }> {
  return post<{ id: number }>('/warning/rules', data)
}

export async function updateRule(id: number, data: Partial<{
  ruleName: string
  ruleDesc: string
  category: string
  alertLevel: string
  startTime: string
  endTime?: string
  notificationChannels: string[]
  associatedPlatform?: string
  notifyFrequencyType: string
  notifyCronExpr?: string
  notifyTemplate: string
  conditions: RuleCondition[]
  notificationObjects: { objectType: string; objectCode: string; objectName: string }[]
}>): Promise<void> {
  await put(`/warning/rules/${id}`, data)
}

export async function deleteRule(id: number): Promise<void> {
  await del(`/warning/rules/${id}`)
}

export async function toggleRuleStatus(id: number, enabled: number): Promise<void> {
  await put(`/warning/rules/${id}/status`, { enabled })
}

export async function getRuleEvents(id: number, params: {
  page?: number
  size?: number
}): Promise<WarningEventListResult> {
  const query = new URLSearchParams()
  if (params.page) query.append('page', params.page.toString())
  if (params.size) query.append('size', params.size.toString())
  
  return get<WarningEventListResult>(`/warning/rules/${id}/events?${query.toString()}`)
}