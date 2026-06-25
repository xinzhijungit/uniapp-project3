import { get, post, put, del } from './request'

export interface TagConfig {
  TAG_CODE: string
  TAG_NAME: string
  PRIORITY: number
  TARGET_TYPE: string
  CATEGORY: string
  STATUS: number
  DESCRIPTION: string
  PROMPT_TEMPLATE: string
  CREATE_TIME: string
  UPDATE_TIME: string
}

export interface TagStatistics {
  totalTags: number
  enabledTags: number
  rulesCount: number
  modelName: string
}

export interface TagListResult {
  list: TagConfig[]
  total: number
  page: number
  size: number
}

export interface TagExample {
  ID: number
  TAG_CODE: string
  EXAMPLE_TEXT: string
  EXPECTED_RESULT: number
  TEST_RESULT: number | null
  CREATE_TIME: string
  ENTITY_KEY?: string
  GRAPH_DATA?: string
  AI_SUMMARY?: string
}

export interface TestResult {
  result: string
  prompt: string
}

export interface BatchTestResult {
  totalCount: number
  successCount: number
  accuracy: number
  details: {
    id: number
    exampleText: string
    expectedResult: string
    testResult: string
    isCorrect: boolean
  }[]
}

export async function getTagList(params: {
  page?: number
  size?: number
  targetType?: string
  status?: number
  keyword?: string
}): Promise<TagListResult> {
  const query = new URLSearchParams()
  if (params.page) query.append('page', params.page.toString())
  if (params.size) query.append('size', params.size.toString())
  if (params.targetType) query.append('targetType', params.targetType)
  if (params.status !== undefined) query.append('status', params.status.toString())
  if (params.keyword) query.append('keyword', params.keyword)
  
  return get<TagListResult>(`/tags?${query.toString()}`)
}

export async function getTagStatistics(): Promise<TagStatistics> {
  return get<TagStatistics>('/tags/statistics')
}

export async function createTag(tag: Omit<TagConfig, 'CREATE_TIME' | 'UPDATE_TIME'>): Promise<{ TAG_CODE: string }> {
  return post<{ TAG_CODE: string }>('/tags', tag)
}

export async function updateTag(tagCode: string, tag: Partial<TagConfig>): Promise<void> {
  await put(`/tags/${tagCode}`, tag)
}

export async function deleteTag(tagCode: string): Promise<void> {
  await del(`/tags/${tagCode}`)
}

export async function getTagDetail(tagCode: string): Promise<TagConfig> {
  return get<TagConfig>(`/tags/${tagCode}`)
}

export async function getTagExamples(tagCode: string): Promise<TagExample[]> {
  return get<TagExample[]>(`/tags/${tagCode}/examples`)
}

export async function addTagExample(tagCode: string, exampleText: string, expectedResult: string, entityKey?: string, graphData?: string, aiSummary?: string): Promise<void> {
  await post(`/tags/${tagCode}/examples`, { 
    EXAMPLE_TEXT: exampleText, 
    EXPECTED_RESULT: expectedResult,
    ENTITY_KEY: entityKey,
    GRAPH_DATA: graphData,
    AI_SUMMARY: aiSummary
  })
}

export async function deleteTagExample(tagCode: string, exampleId: number): Promise<void> {
  await del(`/tags/${tagCode}/examples/${exampleId}`)
}

export async function testTag(tagCode: string): Promise<TestResult> {
  return post<TestResult>(`/tags/${tagCode}/test`, {})
}

export async function batchTestTag(tagCode: string, count: number = 5): Promise<BatchTestResult> {
  return post<BatchTestResult>(`/tags/${tagCode}/batch-test`, { mode: 'full', count })
}