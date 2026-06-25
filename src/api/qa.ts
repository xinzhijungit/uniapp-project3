import { get, post, del } from './request'

export interface QAAnswer {
  conversationId: number
  question: string
  answer: string
  charts: Array<{
    chartType: string
    title: string
    data: Array<{ month?: string; type?: string; count: number }>
  }>
  keyFindings: string[]
  extensions: string[]
}

export interface QAHistoryItem {
  id: number
  question: string
  answer: string
  dataScope: string
  conversationMode: string
  status: string
  createTime: string
}

export interface QAHistoryResult {
  list: QAHistoryItem[]
  total: number
  page: number
  size: number
}

export interface ChartDataItem {
  id: number
  chartType: string
  title: string
  config: object
  data: Array<{ month?: string; type?: string; count: number }>
}

export async function askQA(data: {
  question: string
  dataScope?: string
  conversationMode?: string
  contextId?: number
}): Promise<QAAnswer> {
  return post<QAAnswer>('/qa/ask', data)
}

export async function getQAHistory(params: {
  page?: number
  size?: number
}): Promise<QAHistoryResult> {
  const query = new URLSearchParams()
  if (params.page) query.append('page', params.page.toString())
  if (params.size) query.append('size', params.size.toString())
  
  return get<QAHistoryResult>(`/qa/history?${query.toString()}`)
}

export async function getChartData(conversationId: number): Promise<ChartDataItem[]> {
  return get<ChartDataItem[]>(`/qa/chart/${conversationId}`)
}

export async function deleteQAHistory(id: number): Promise<void> {
  await del(`/qa/history/${id}`)
}