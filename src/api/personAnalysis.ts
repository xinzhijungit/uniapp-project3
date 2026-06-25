import { post } from './request'

export interface PersonInfo {
  BH: string
  XM: string
  XB: number
  ZJHM: string
  HJXZ: string
  XZXZ: string
  GZDW: string
  LXDH: string
  SFZDRY: string
  ZY: string
  ZDRYSX: string
  CPH_ontology: string
  SJZT_ontology: string
  AI_TAG_ontology: string
}

export interface RiskDetail {
  type: string
  description: string
  suggestion: string
}

export interface Feature {
  type: string
  title: string
  desc: string
}

export interface GraphNode {
  id: string
  type: string
  label: string
  color: string
  properties: Record<string, any>
}

export interface GraphLink {
  source: string
  target: string
  relation: string
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export interface CaseRecord {
  caseNumber: string
  content: string
  alarmTime: string
  disposalContent: string
  disposalResult: string
}

export interface HouseholdInfo {
  id_card: string
  name: string
  gender: string
  birth_date: string
  birthplace: string
  native_place: string
  ethnicity: string
  religion: string
  education: string
  marital_status: string
  military_service: string
  blood_type: string
  height: number
  occupation: string
  workplace: string
  relation_to_head: string
  add_reason: string
  add_date: string
  previous_address: string
  move_in_address: string
  page_number: number
  registrar: string
  household_id: string
  household_number: string
  address: string
  household_type: string
  created_date: string
  last_issued_date: string
  issuing_authority: string
  issuing_officer: string
  official_seal: string
  head_id_card: string
}

export interface CriminalRecord {
  record_id: number
  id_card: string
  name: string
  gender: string
  birth_date: string
  household_addr: string
  case_number: string
  crime_type: string
  crime_detail: string
  arrest_date: string
  sentence_date: string
  sentence_months: number
  prison_status: string
  escape_notice_no: string
  created_time: string
}

export interface WarningLevel {
  level: 'high' | 'medium' | 'normal'
  label: string
  description: string
}

export interface TagInfo {
  tagCode: string
  tagName: string
  priority: number
  description: string
}

export interface AnalysisResult {
  personInfo: PersonInfo | null
  riskScore: number
  riskTags: string[]
  riskDetails: RiskDetail[]
  caseRecords: CaseRecord[]
  householdInfo: HouseholdInfo | null
  householdMembers: HouseholdInfo[]
  personCriminalRecords: CriminalRecord[]
  householdCriminalRecords: CriminalRecord[]
  warningLevel: WarningLevel | null
  suggestions: string[]
  graphData: GraphData
  analysisText: string
  features: Feature[]
  tags: TagInfo[]
}

export async function searchEntity(params: {
  idCard?: string
  plateNumber?: string
  caseNumber?: string
  phoneNumber?: string
}): Promise<AnalysisResult> {
  return post<AnalysisResult>('/search/entity', params)
}

export async function queryGraph(params: {
  entityId: string
  entityType?: string
  maxDepth?: number
  maxNodes?: number
}): Promise<GraphData> {
  return post<GraphData>('/graph/query', params)
}

export interface RegenerateResult {
  success: boolean
  nodeCount: number
  linkCount: number
  message: string
}

export async function regenerateGraph(): Promise<RegenerateResult> {
  return post<RegenerateResult>('/graph/regenerate', {})
}