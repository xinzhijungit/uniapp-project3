<template>
  <view class="main-layout">
    <TopNav />
    
    <view class="layout-body">
      <SideMenu />
      
      <view class="main-content">
        <view class="page-header">
          <view class="header-left">
            <view class="back-btn" @click="handleBack">
              <text class="back-icon">←</text>
            </view>
            <text class="page-title">{{ isEdit ? '编辑标签' : '新建标签' }}</text>
          </view>
          <view class="header-right">
            <view class="placeholder"></view>
          </view>
        </view>
        
        <scroll-view scroll-y class="page-content">
          <view class="form-section">
            <text class="section-title">标签值</text>
            
            <view class="form-item">
              <text class="form-label">标签标识符</text>
              <view class="input-row">
                <input 
                  class="form-input" 
                  placeholder="自动生成或手动输入" 
                  v-model="formData.TAG_CODE"
                  :disabled="isEdit"
                />
                <view v-if="!isEdit" class="generate-btn" @click="generateTagCode">
                  <text>生成</text>
                </view>
              </view>
            </view>
            
            <view class="form-item">
              <text class="form-label">标签名称</text>
              <input 
                class="form-input" 
                placeholder="请输入标签名称" 
                v-model="formData.TAG_NAME"
              />
            </view>
            
            <view class="form-item">
              <text class="form-label">标签值描述</text>
              <textarea 
                class="form-textarea" 
                placeholder="请输入标签描述" 
                v-model="formData.DESCRIPTION"
              />
            </view>
            
            <view class="form-item">
              <view class="form-label-row">
                <text class="form-label">提示词</text>
                <text class="smart-generate-btn" @click="handleSmartGenerate">智能生成</text>
              </view>
              <textarea 
                class="form-textarea tall" 
                placeholder="请输入AI提示词模板，使用{{entity}}作为实体占位符" 
                v-model="formData.PROMPT_TEMPLATE"
              />
            </view>
            
            <view class="form-item">
              <text class="form-label">优先级</text>
              <view class="priority-options">
                <view 
                  class="priority-option" 
                  :class="{ active: formData.PRIORITY === 3 }"
                  @click="formData.PRIORITY = 3"
                >
                  <text class="priority-icon">⚠️</text>
                  <text class="priority-text">高优先级</text>
                </view>
                <view 
                  class="priority-option" 
                  :class="{ active: formData.PRIORITY === 2 }"
                  @click="formData.PRIORITY = 2"
                >
                  <text class="priority-icon">🔶</text>
                  <text class="priority-text">中优先级</text>
                </view>
                <view 
                  class="priority-option" 
                  :class="{ active: formData.PRIORITY === 1 }"
                  @click="formData.PRIORITY = 1"
                >
                  <text class="priority-icon">🔵</text>
                  <text class="priority-text">低优先级</text>
                </view>
              </view>
            </view>
            
            <view class="form-item">
              <text class="form-label">适用对象</text>
              <view class="target-options">
                <view 
                  class="target-option" 
                  :class="{ active: formData.TARGET_TYPE === 'CITIZEN' }"
                  @click="formData.TARGET_TYPE = 'CITIZEN'; formData.CATEGORY = '人员标签'"
                >
                  人员标签
                </view>
                <view 
                  class="target-option" 
                  :class="{ active: formData.TARGET_TYPE === 'CASE' }"
                  @click="formData.TARGET_TYPE = 'CASE'; formData.CATEGORY = '警情标签'"
                >
                  警情标签
                </view>
              </view>
            </view>
          </view>
          
          <view class="examples-section">
            <view class="section-header">
              <text class="section-title">示例</text>
              <!-- 隐藏添加示例按钮 -->
              <!-- <view class="add-example-btn" @click="showAddExample = true">
                <text>+ 添加示例</text>
              </view> -->
              <view class="batch-test-container">
                <text class="test-label">单次测试</text>
                <input 
                  type="number" 
                  v-model="batchTestCount" 
                  class="batch-test-input"
                  placeholder="5"
                />
                <text class="test-label">条</text>
                <button class="action-btn warning small-btn" @click="handleBatchTest">开始测试</button>
              </view>
            </view>
            
            <view class="examples-table" v-if="pagedExamples.length > 0">
              <view class="table-header">
                <text class="th">主键</text>
                <text class="th graph-th">图谱数据</text>
                <text class="th person-th">人员本体描述</text>
                <text class="th">测试结果</text>
                <text class="th">操作</text>
              </view>
              <view class="table-body">
                <view class="table-row" v-for="example in pagedExamples" :key="example.ID">
                  <text class="td">{{ example.entityKey || example.ENTITY_KEY || '-' }}</text>
                  <view class="td graph-td">
                    <view v-if="example.entityKey || example.ENTITY_KEY" class="view-btn" @click="showGraphData(example)">
                      <text>查看</text>
                    </view>
                    <text v-else class="no-data">-</text>
                  </view>
                  <view class="td person-td">
                    <view class="person-content">
                      <text class="person-text">{{ truncateText(example.AI_SUMMARY || example.aiSummary || example.EXAMPLE_TEXT || '', 40) }}</text>
                      <view v-if="(example.AI_SUMMARY || example.aiSummary || example.EXAMPLE_TEXT || '').length > 40" class="view-btn inline" @click="showDetail('人员本体描述', example.AI_SUMMARY || example.aiSummary || example.EXAMPLE_TEXT || '')">
                        <text>查看</text>
                      </view>
                    </view>
                  </view>
                  <view class="td">
                    <view v-if="example.TEST_RESULT !== null" class="result-tag" :class="getResultClass(example)">
                      {{ example.TEST_RESULT === 1 ? '是' : '否' }}
                    </view>
                    <text v-else class="no-result">-</text>
                  </view>
                  <view class="td">
                    <view class="delete-btn" @click="handleDeleteExample(example.ID)">
                      <text>删除</text>
                    </view>
                  </view>
                </view>
              </view>
              
              <view class="pagination">
                <text class="total-count">共 {{ examples.length }} 条</text>
                <view class="page-btn" :class="{ disabled: currentPage === 1 }" @click="prevPage">
                  <text>上一页</text>
                </view>
                <text class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</text>
                <view class="page-btn" :class="{ disabled: currentPage === totalPages }" @click="nextPage">
                  <text>下一页</text>
                </view>
              </view>
            </view>
            
            <view class="empty-state" v-else>
              <text class="empty-icon">📋</text>
              <text class="empty-text">暂无示例数据，点击上方按钮添加</text>
            </view>
            
            <text class="section-desc">示例需要读取实体表的"主键"，"图谱数据"(缩略，点击查看弹窗展示) 以及"AI总结文本描述"。</text>
          </view>
          
          <view class="add-example-modal" v-if="showAddExample" @click.self="showAddExample = false">
            <view class="modal-content large">
              <text class="modal-title">添加示例</text>
              <view class="modal-body">
                <view class="form-item">
                  <text class="form-label">主键</text>
                  <input 
                    class="form-input" 
                    placeholder="请输入实体主键" 
                    v-model="newExample.entityKey"
                  />
                </view>
                <view class="form-item">
                  <text class="form-label">图谱数据（JSON格式）</text>
                  <textarea 
                    class="form-textarea tall" 
                    placeholder="请输入图谱数据JSON" 
                    v-model="newExample.graphData"
                  />
                </view>
                <view class="form-item">
                  <text class="form-label">AI总结文本描述</text>
                  <textarea 
                    class="form-textarea tall" 
                    placeholder="请输入AI总结文本描述" 
                    v-model="newExample.aiSummary"
                  />
                </view>
                <view class="form-item">
                  <text class="form-label">预期结果</text>
                  <view class="expected-options">
                    <view 
                      class="expected-option" 
                      :class="{ active: newExample.expected === '是' }"
                      @click="newExample.expected = '是'"
                    >
                      正例（应命中）
                    </view>
                    <view 
                      class="expected-option" 
                      :class="{ active: newExample.expected === '否' }"
                      @click="newExample.expected = '否'"
                    >
                      反例（不应命中）
                    </view>
                  </view>
                </view>
              </view>
              <view class="modal-footer">
                <button class="btn secondary" @click="showAddExample = false">取消</button>
                <button class="btn primary" @click="handleAddExample">确认添加</button>
              </view>
            </view>
          </view>
          
          <view class="bottom-actions">
            <button class="btn secondary" @click="handleBack">取消</button>
            <button class="btn primary" @click="handleSave">确认</button>
          </view>
          
          <view class="bottom-spacing"></view>
        </scroll-view>
      </view>
    </view>
    
    <!-- 图谱数据查看弹窗 -->
    <view class="graph-modal" v-if="showGraphModal" @click.self="showGraphModal = false">
      <view class="modal-content large">
        <view class="modal-header">
          <text class="modal-title">图谱数据详情</text>
          <view class="close-btn" @click="showGraphModal = false">×</view>
        </view>
        <view class="modal-body">
          <view class="graph-data-container">
            <text class="graph-json">{{ selectedGraphData }}</text>
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn primary" @click="showGraphModal = false">关闭</button>
        </view>
      </view>
    </view>
    
    <!-- 详情查看弹窗 -->
    <view class="detail-modal" v-if="showDetailModal" @click.self="showDetailModal = false">
      <view class="modal-content large">
        <view class="modal-header">
          <text class="modal-title">{{ selectedDetailTitle }}</text>
          <view class="close-btn" @click="showDetailModal = false">×</view>
        </view>
        <view class="modal-body">
          <view class="detail-content">
            <text class="detail-text">{{ selectedDetailContent }}</text>
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn primary" @click="showDetailModal = false">关闭</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import TopNav from '@/components/TopNav.vue'
import SideMenu from '@/components/SideMenu.vue'
import { 
  createTag, 
  updateTag, 
  getTagDetail, 
  getTagExamples, 
  addTagExample, 
  deleteTagExample,
  testTag,
  batchTestTag,
  type TagConfig,
  type TagExample
} from '@/api/tagManagement'
import { queryGraph } from '@/api/personAnalysis'

const isEdit = ref(false)
const tagCode = ref('')
const showAddExample = ref(false)
const showGraphModal = ref(false)
const showDetailModal = ref(false)
const selectedDetailTitle = ref('')
const selectedDetailContent = ref('')
const selectedGraphData = ref('')
const examples = ref<TagExample[]>([])
const currentPage = ref(1)
const pageSize = ref(15)
const totalPages = ref(1)
const batchTestCount = ref(5)

const formData = reactive({
  TAG_CODE: '',
  TAG_NAME: '',
  DESCRIPTION: '',
  PROMPT_TEMPLATE: '',
  PRIORITY: 2,
  TARGET_TYPE: 'CITIZEN',
  CATEGORY: '人员标签',
  STATUS: 1
})

const newExample = reactive({
  entityKey: '',
  graphData: '',
  aiSummary: '',
  expected: '是'
})

onLoad(async (options) => {
  if (options?.tagCode) {
    isEdit.value = true
    tagCode.value = options.tagCode
    await loadTagData()
  }
})

async function loadTagData() {
  uni.showLoading({ title: '加载中...' })
  try {
    const tag = await getTagDetail(tagCode.value)
    formData.TAG_CODE = tag.TAG_CODE
    formData.TAG_NAME = tag.TAG_NAME
    formData.DESCRIPTION = tag.DESCRIPTION || ''
    formData.PROMPT_TEMPLATE = tag.PROMPT_TEMPLATE || ''
    formData.PRIORITY = tag.PRIORITY
    formData.TARGET_TYPE = tag.TARGET_TYPE
    formData.CATEGORY = tag.CATEGORY
    formData.STATUS = tag.STATUS
    
    examples.value = await getTagExamples(tagCode.value)
    currentPage.value = 1
    totalPages.value = Math.ceil(examples.value.length / pageSize.value)
  } catch (error) {
    console.error('加载标签数据失败', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

function generateTagCode() {
  if (formData.TAG_NAME) {
    formData.TAG_CODE = formData.TAG_NAME.toUpperCase().replace(/[\s\u4e00-\u9fa5]+/g, '_')
  }
}

function handleBack() {
  uni.navigateBack()
}

function handleSmartGenerate() {
  uni.showLoading({ title: '智能生成中...' })
  setTimeout(() => {
    const targetTypeText = formData.TARGET_TYPE === 'CITIZEN' ? '人员' : 
                          formData.TARGET_TYPE === 'CASE' ? '警情' :
                          formData.TARGET_TYPE === 'VEHICLE' ? '车辆' : '手机号'
    formData.PROMPT_TEMPLATE = `根据以下${targetTypeText}信息，判断该${targetTypeText}是否属于'${formData.TAG_NAME}'。${formData.DESCRIPTION || '高风险特征包括各种风险行为。'}输出是或否，不要解释。${targetTypeText}信息：{{entity}}`
    uni.hideLoading()
    uni.showToast({ title: '生成成功', icon: 'none' })
  }, 1500)
}

async function handleTest() {
  if (!formData.TAG_CODE) {
    uni.showToast({ title: '请先保存标签', icon: 'none' })
    return
  }
  
  if (!formData.PROMPT_TEMPLATE) {
    uni.showToast({ title: '请输入提示词', icon: 'none' })
    return
  }
  
  uni.showLoading({ title: '测试中...' })
  try {
    const result = await testTag(formData.TAG_CODE)
    
    // 将测试结果添加到示例列表
    if (result) {
      const newExample = {
        ID: Date.now(),
        TAG_CODE: formData.TAG_CODE,
        EXAMPLE_TEXT: `[BH:${result.entityKey}]${result.fullAiSummary}`,
        EXPECTED_RESULT: result.result,
        TEST_RESULT: result.result,
        ENTITY_KEY: result.entityKey,
        AI_SUMMARY: result.fullAiSummary,
        GRAPH_DATA: null,
        CREATE_TIME: new Date().toISOString()
      }
      examples.value.unshift(newExample)
    }
    
    uni.hideLoading()
    uni.showToast({ title: `测试结果：${result.result === 1 ? '是' : '否'}`, icon: 'none' })
  } catch (error) {
    uni.hideLoading()
    console.error('测试失败:', error)
    uni.showToast({ title: '测试失败', icon: 'none' })
  }
}

async function handleBatchTest() {
  if (!formData.TAG_CODE) {
    uni.showToast({ title: '请先输入标签标识', icon: 'none' })
    return
  }
  
  if (!formData.PROMPT_TEMPLATE) {
    uni.showToast({ title: '请输入提示词', icon: 'none' })
    return
  }
  
  uni.showLoading({ title: '准备测试...' })
  
  try {
    if (!isEdit.value) {
      await createTag({
        TAG_CODE: formData.TAG_CODE,
        TAG_NAME: formData.TAG_NAME,
        DESCRIPTION: formData.DESCRIPTION,
        PROMPT_TEMPLATE: formData.PROMPT_TEMPLATE,
        PRIORITY: formData.PRIORITY,
        TARGET_TYPE: formData.TARGET_TYPE,
        CATEGORY: formData.CATEGORY,
        STATUS: formData.STATUS
      })
      isEdit.value = true
      tagCode.value = formData.TAG_CODE
    }
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '保存标签失败', icon: 'none' })
    return
  }
  
  uni.showLoading({ title: '批量测试中...' })
  try {
    const result = await batchTestTag(formData.TAG_CODE, batchTestCount.value)
    
    // 测试完成后，重新从数据库获取完整的示例数据
    examples.value = await getTagExamples(formData.TAG_CODE)
    currentPage.value = 1
    totalPages.value = Math.ceil(examples.value.length / pageSize.value)
    
    uni.hideLoading()
    const message = result.addedCount 
      ? `批量测试完成，共处理 ${result.totalCount} 个实体，命中 ${result.hitCount} 个，已添加 ${result.addedCount} 条示例`
      : `测试完成，准确率：${result.accuracy}%`
    uni.showToast({ title: message, icon: 'none' })
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '批量测试失败', icon: 'none' })
  }
}

function truncateText(text: string, maxLength: number): string {
  if (!text) return '-'
  // 将换行符替换为空格
  const normalizedText = text.replace(/[\n\r]/g, ' ')
  if (normalizedText.length <= maxLength) return normalizedText
  return normalizedText.substring(0, maxLength) + '...'
}

function showDetail(title: string, content: string) {
  selectedDetailTitle.value = title
  selectedDetailContent.value = content
  showDetailModal.value = true
}

const pagedExamples = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return examples.value.slice(start, end)
  })

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

async function handleAddExample() {
  if (!formData.TAG_CODE) {
    uni.showToast({ title: '请先保存标签', icon: 'none' })
    return
  }
  
  try {
    await addTagExample(
      formData.TAG_CODE, 
      newExample.aiSummary || '', 
      newExample.expected,
      newExample.entityKey,
      newExample.graphData,
      newExample.aiSummary
    )
    examples.value = await getTagExamples(formData.TAG_CODE)
    newExample.entityKey = ''
    newExample.graphData = ''
    newExample.aiSummary = ''
    newExample.expected = '是'
    showAddExample.value = false
    uni.showToast({ title: '添加成功', icon: 'none' })
  } catch (error) {
    uni.showToast({ title: '添加失败', icon: 'none' })
  }
}

async function handleDeleteExample(exampleId: number) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除该示例吗？',
    success: async (res) => {
      if (res.confirm && formData.TAG_CODE) {
        try {
          await deleteTagExample(formData.TAG_CODE, exampleId)
          examples.value = examples.value.filter(e => e.ID !== exampleId)
          uni.showToast({ title: '删除成功', icon: 'none' })
        } catch (error) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

async function handleSave() {
  if (!formData.TAG_NAME.trim()) {
    uni.showToast({ title: '请输入标签名称', icon: 'none' })
    return
  }
  
  if (!formData.TAG_CODE.trim()) {
    generateTagCode()
  }
  
  if (!formData.TAG_CODE.trim()) {
    uni.showToast({ title: '请输入标签标识符', icon: 'none' })
    return
  }
  
  uni.showLoading({ title: '保存中...' })
  
  try {
    if (isEdit.value) {
      await updateTag(tagCode.value, {
        TAG_NAME: formData.TAG_NAME,
        DESCRIPTION: formData.DESCRIPTION,
        PROMPT_TEMPLATE: formData.PROMPT_TEMPLATE,
        PRIORITY: formData.PRIORITY,
        TARGET_TYPE: formData.TARGET_TYPE,
        CATEGORY: formData.CATEGORY
      })
    } else {
      await createTag({
        TAG_CODE: formData.TAG_CODE,
        TAG_NAME: formData.TAG_NAME,
        DESCRIPTION: formData.DESCRIPTION,
        PROMPT_TEMPLATE: formData.PROMPT_TEMPLATE,
        PRIORITY: formData.PRIORITY,
        TARGET_TYPE: formData.TARGET_TYPE,
        CATEGORY: formData.CATEGORY,
        STATUS: formData.STATUS
      })
    }
    
    uni.hideLoading()
    uni.showToast({ title: isEdit.value ? '修改成功' : '创建成功', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1000)
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

function getResultClass(example: TagExample): string {
  if (example.TEST_RESULT === example.EXPECTED_RESULT) {
    return 'correct'
  }
  return 'incorrect'
}

async function showGraphData(example: TagExample) {
  const entityKey = example.entityKey || example.ENTITY_KEY
  if (!entityKey) return
  
  uni.showLoading({ title: '加载图谱数据...' })
  try {
    const entityType = formData.CATEGORY === '警情标签' ? 'case' : 'citizen'
    const graphData = await queryGraph({
      entityId: entityKey,
      entityType: entityType,
      maxDepth: 3,
      maxNodes: 50,
      cnFields: true
    })
    selectedGraphData.value = JSON.stringify(graphData, null, 2)
    showGraphModal.value = true
  } catch (error) {
    console.error('加载图谱数据失败', error)
    uni.showToast({ title: '加载图谱数据失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}
</script>

<style lang="scss" scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.layout-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main-content {
  flex: 1;
  background: #F5F7FA;
  overflow-y: auto;
}

.page-header {
  background: #FFFFFF;
  padding: 16px 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #E8EEF4;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  width: 40px;
  height: 40px;
  background: #F5F5F5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    background: #E8EEF4;
  }
}

.back-icon {
  font-size: 18px;
  color: #101010;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #101010;
}

.header-right {
  display: flex;
  align-items: center;
}

.placeholder {
  width: 40px;
}

.page-content {
  padding: 20px 30px;
  height: calc(100vh - 120px);
}

.form-section {
  background: #FFFFFF;
  border-radius: 4px;
  padding: 24px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #101010;
  margin-bottom: 20px;
  display: block;
}

.form-item {
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  font-size: 14px;
  color: #666666;
  margin-bottom: 10px;
  display: block;
}

.form-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.smart-generate-btn {
  font-size: 14px;
  color: #165DFF;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
}

.input-row {
  display: flex;
  gap: 10px;
}

.form-input {
  flex: 1;
  height: 44px;
  background: #F8F9FA;
  border-radius: 2px;
  padding: 0 16px;
  font-size: 14px;
  border: none;
  outline: none;
  box-sizing: border-box;
  
  &[disabled] {
    background: #E8E8E8;
    color: #BBBBBB;
  }
}

.generate-btn {
  height: 44px;
  padding: 0 20px;
  background: #165DFF;
  color: #FFFFFF;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    background: #0F40F5;
  }
}

.form-textarea {
  width: 100%;
  height: 100px;
  background: #F8F9FA;
  border-radius: 2px;
  padding: 12px 16px;
  font-size: 14px;
  border: none;
  outline: none;
  box-sizing: border-box;
  
  &.tall {
    height: 140px;
  }
}

.priority-options {
  display: flex;
  gap: 12px;
}

.priority-option {
  flex: 1;
  padding: 16px;
  background: #F8F9FA;
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.active {
    background: rgba(22, 93, 255, 0.1);
    border: 2px solid #165DFF;
  }
}

.priority-icon {
  font-size: 24px;
}

.priority-text {
  font-size: 13px;
  color: #666666;
}

.target-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.target-option {
  padding: 12px 20px;
  background: #F8F9FA;
  border-radius: 2px;
  font-size: 14px;
  color: #666666;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.active {
    background: #165DFF;
    color: #FFFFFF;
  }
}

.action-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.action-btn {
  flex: 1;
  height: 44px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    opacity: 0.9;
  }
  
  &.primary {
    background: linear-gradient(135deg, #4CAF50, #388E3C);
    color: #FFFFFF;
  }
  
  &.secondary {
    background: linear-gradient(135deg, #165DFF, #0F40F5);
    color: #FFFFFF;
  }
  
  &.warning {
    background: linear-gradient(135deg, #FF9800, #F57C00);
    color: #FFFFFF;
  }
  
  &.small-btn {
    flex: none;
    height: 32px;
    padding: 0 16px;
  }
}

.batch-test-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.test-label {
  font-size: 14px;
  color: #333333;
}

.batch-test-input {
  width: 60px;
  height: 32px;
  border-radius: 4px;
  font-size: 14px;
  padding: 0 8px;
  border: 1px solid #E0E0E0;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #165DFF;
  }
}

.examples-section {
  background: #FFFFFF;
  border-radius: 4px;
  padding: 24px;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.add-example-btn {
  padding: 10px 16px;
  background: #165DFF;
  color: #FFFFFF;
  border-radius: 2px;
  font-size: 13px;
  cursor: pointer;
  
  &:hover {
    background: #0F40F5;
  }
}

.examples-table {
  width: 100%;
}

.table-header {
  display: flex;
  padding: 12px 0;
  border-bottom: 2px solid #F0F0F0;
}

.th {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #666666;
  text-align: center;
  
  &:first-child {
    flex: 1.5;
    text-align: left;
    padding-left: 12px;
  }
  
  &.graph-th {
    flex: 0.8;
  }
  
  &.person-th {
    flex: 3;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  &.reason-th {
    flex: 0.8;
  }
}

.table-body {
  margin-top: 6px;
}

.table-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F5F5F5;
  
  &:last-child {
    border-bottom: none;
  }
}

.td {
  flex: 1;
  font-size: 13px;
  color: #101010;
  text-align: center;
  
  &:first-child {
    flex: 1.5;
    text-align: left;
    padding-left: 12px;
  }
  
  &.graph-td {
    flex: 0.8;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  &.person-td {
    flex: 3;
    text-align: left;
    padding-right: 8px;
  }
  
  &.reason-td {
    flex: 0.8;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.result-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 2px;
  font-size: 12px;
  
  &.positive {
    background: rgba(76, 175, 80, 0.1);
    color: #4CAF50;
  }
  
  &.negative {
    background: rgba(244, 67, 54, 0.1);
    color: #F44336;
  }
  
  &.correct {
    background: rgba(76, 175, 80, 0.1);
    color: #4CAF50;
  }
  
  &.incorrect {
    background: rgba(244, 67, 54, 0.1);
    color: #F44336;
  }
}

.no-result {
  color: #BBBBBB;
}

.delete-btn {
  padding: 4px 12px;
  background: rgba(244, 67, 54, 0.1);
  color: #F44336;
  border-radius: 2px;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background: rgba(244, 67, 54, 0.2);
  }
}

.person-content {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  height: 20px;
  line-height: 20px;
}

.person-text {
  flex: 1;
  font-size: 13px;
  color: #101010;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.view-btn {
  padding: 4px 10px;
  background: rgba(52, 131, 235, 0.1);
  color: #3483EB;
  border-radius: 2px;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background: rgba(52, 131, 235, 0.2);
  }
  
  &.inline {
    flex-shrink: 0;
    padding: 2px 8px;
    font-size: 11px;
  }
  
  &.small {
    padding: 2px 8px;
    font-size: 11px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
  color: #BBBBBB;
}

.add-example-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 500px;
  background: #FFFFFF;
  border-radius: 4px;
  overflow: hidden;
}

.modal-title {
  display: block;
  padding: 24px;
  font-size: 16px;
  font-weight: 600;
  color: #101010;
  border-bottom: 1px solid #F0F0F0;
}

.modal-body {
  padding: 24px;
}

.expected-options {
  display: flex;
  gap: 12px;
}

.expected-option {
  flex: 1;
  padding: 16px;
  background: #F8F9FA;
  border-radius: 2px;
  text-align: center;
  font-size: 14px;
  color: #666666;
  cursor: pointer;
  
  &.active {
    background: #165DFF;
    color: #FFFFFF;
  }
}

.modal-footer {
  display: flex;
  gap: 20px;
  padding: 20px 24px;
  border-top: 1px solid #F0F0F0;
}

.bottom-actions {
  display: flex;
  gap: 20px;
}

.btn {
  flex: 1;
  height: 44px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    opacity: 0.9;
  }
  
  &.primary {
    background: linear-gradient(135deg, #165DFF, #0F40F5);
    color: #FFFFFF;
  }
  
  &.secondary {
    background: #F5F5F5;
    color: #666666;
  }
}

.section-desc {
  font-size: 12px;
  color: #F57C00;
  margin-left: 12px;
  flex: 1;
}

.graph-data-btn {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(22, 93, 255, 0.1);
  color: #165DFF;
  border-radius: 2px;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background: rgba(22, 93, 255, 0.2);
  }
}

.view-btn {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(22, 93, 255, 0.1);
  color: #165DFF;
  border-radius: 2px;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background: rgba(22, 93, 255, 0.2);
  }
  
  &.small {
    padding: 2px 6px;
    font-size: 11px;
    margin-left: 4px;
  }
}

.text-cell {
  flex: 2;
  text-align: left;
  padding-left: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
}

.text-content {
  font-size: 13px;
  color: #101010;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.no-data {
  color: #BBBBBB;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px 0;
  border-top: 1px solid #F5F5F5;
}

.total-count {
  font-size: 13px;
  color: #999999;
}

.page-btn {
  padding: 6px 16px;
  background: #F5F5F5;
  color: #666666;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  
  &:hover {
    background: #E8E8E8;
  }
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      background: #F5F5F5;
    }
  }
}

.page-info {
  font-size: 13px;
  color: #666666;
}

.detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.detail-content {
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

.detail-text {
  font-size: 14px;
  color: #101010;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-all;
}

.ai-summary {
  flex: 2;
  text-align: left;
  padding-left: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.graph-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content.large {
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #F0F0F0;
}

.close-btn {
  font-size: 24px;
  color: #BBBBBB;
  cursor: pointer;
  
  &:hover {
    color: #101010;
  }
}

.graph-data-container {
  max-height: 400px;
  overflow-y: auto;
  background: #F8F9FA;
  border-radius: 2px;
  padding: 16px;
}

.graph-json {
  font-family: monospace;
  font-size: 12px;
  color: #333333;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.bottom-spacing {
  height: 32px;
}
</style>