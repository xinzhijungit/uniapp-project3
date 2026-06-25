<template>
  <view class="main-layout">
    <TopNav />
    
    <view class="layout-body">
      <SideMenu />
      
      <view class="main-content">
        <view class="content">
      <view class="filter-section">
        <view class="filter-row">
          <view class="filter-item">
            <input 
              class="search-input" 
              placeholder="请输入规则名称" 
              v-model="filterForm.ruleName"
              @confirm="handleSearch"
            />
          </view>
          <view class="filter-item">
            <picker :value="filterForm.statusIndex" :range="statusOptions" @change="onStatusChange">
              <view class="picker-value">
                {{ statusOptions[filterForm.statusIndex] }}
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
        </view>
        <view class="filter-actions">
          <button class="btn btn-primary" @click="handleSearch">查询</button>
          <button class="btn btn-secondary" @click="resetFilter">重置</button>
          <button class="btn btn-success" @click="goToEdit()">新建规则</button>
        </view>
      </view>

      <view class="rule-list">
        <view 
          v-for="rule in ruleList" 
          :key="rule.id" 
          class="rule-card"
        >
          <view class="card-header">
            <view class="header-left">
              <view class="level-badge" :class="rule.alertLevel.toLowerCase()">
                {{ rule.alertLevelName }}
              </view>
              <view class="rule-name">{{ rule.ruleName }}</view>
            </view>
            <view class="header-right">
              <switch 
                :checked="rule.enabled === 1" 
                @change="(e: any) => toggleRule(rule.id, e.detail.value ? 1 : 0)"
              />
            </view>
          </view>
          
          <view class="card-body">
            <view class="desc">{{ rule.ruleDesc }}</view>
            
            <view class="info-row">
              <view class="info-item">
                <view class="info-label">规则分类</view>
                <view class="info-value">{{ rule.category }}</view>
              </view>
              <view class="info-item">
                <view class="info-label">生效时间</view>
                <view class="info-value">{{ formatTimeRange(rule.startTime, rule.endTime) }}</view>
              </view>
              <view class="info-item">
                <view class="info-label">通知频率</view>
                <view class="info-value">{{ rule.notifyFrequencyType === 'REALTIME' ? '实时触发' : '定时触发' }}</view>
              </view>
            </view>

            <view class="info-row">
              <view class="info-item">
                <view class="info-label">通知对象</view>
                <view class="info-value">
                  <view class="object-list">
                    <view v-for="obj in rule.notificationObjects" :key="obj.objectName" class="object-tag">
                      {{ obj.objectName }}
                    </view>
                  </view>
                </view>
              </view>
              <view class="info-item">
                <view class="info-label">通知渠道</view>
                <view class="info-value">{{ getChannelNames(rule.notificationChannels) }}</view>
              </view>
              <view class="info-item trigger-count">
                <view class="info-label">触发次数</view>
                <view class="info-value highlight" @click="showRuleEvents(rule.id)">
                  {{ rule.triggerCount }}
                </view>
              </view>
            </view>
          </view>

          <view class="card-footer">
            <view class="creator-info">
              <text>{{ rule.createBy }} | {{ formatTime(rule.createTime) }}</text>
            </view>
            <view class="actions">
              <view class="action-btn" @click="goToEdit(rule.id)">编辑</view>
              <view class="action-btn danger" @click="deleteRule(rule)">删除</view>
            </view>
          </view>
        </view>
        
        <view v-if="ruleList.length === 0" class="empty-state">
          <text>暂无数据</text>
        </view>
      </view>

      <view class="pagination">
        <view class="pagination-info">共 {{ totalCount }} 条</view>
        <view class="pagination-controls">
          <view class="page-btn" :class="{ disabled: currentPage <= 1 }" @click="prevPage">上一页</view>
          <view class="page-numbers">
            <view 
              v-for="page in visiblePages" 
              :key="page"
              class="page-number"
              :class="{ active: currentPage === page }"
              @click="goToPage(page)"
            >{{ page }}</view>
          </view>
          <view class="page-btn" :class="{ disabled: currentPage >= totalPages }" @click="nextPage">下一页</view>
          <view class="page-size">
            <picker :value="pageSizeIndex" :range="pageSizeOptions" @change="onPageSizeChange">
              <view class="picker-value small">
                {{ pageSizeOptions[pageSizeIndex] }}条/页
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
        </view>
      </view>
    </view>

    <view v-if="showEventsModal" class="modal-overlay" @click="showEventsModal = false">
      <view class="modal-content large" @click.stop>
        <view class="modal-header">
          <text class="modal-title">关联预警事件</text>
          <view class="modal-close" @click="showEventsModal = false">×</view>
        </view>
        <view class="modal-body">
          <view class="incident-table">
            <view class="table-header">
              <view class="th">预警编号</view>
              <view class="th">预警等级</view>
              <view class="th">触发时间</view>
              <view class="th">状态</view>
            </view>
            <view 
              v-for="event in relatedEvents" 
              :key="event.eventNo"
              class="table-row"
            >
              <view class="td">{{ event.eventNo }}</view>
              <view class="td">
                <view class="level-tag" :class="event.alertLevel.toLowerCase()">
                  {{ event.alertLevelName }}
                </view>
              </view>
              <view class="td">{{ formatTime(event.triggerTime) }}</view>
              <view class="td">
                <view class="status-tag" :class="getStatusClass(event.status)">
                  {{ event.statusName }}
                </view>
              </view>
            </view>
            <view v-if="relatedEvents.length === 0" class="empty-state">
              <text>暂无关联事件</text>
            </view>
          </view>
        </view>
      </view>
      </view>
    </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TopNav from '@/components/TopNav.vue'
import SideMenu from '@/components/SideMenu.vue'
import { 
  getRuleList, 
  deleteRule, 
  toggleRuleStatus,
  getRuleEvents,
  type WarningRule,
  type WarningEvent
} from '@/api/warning'

const ruleList = ref<WarningRule[]>([])
const relatedEvents = ref<WarningEvent[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)
const showEventsModal = ref(false)
const currentRuleId = ref<number | null>(null)

const statusOptions = ['全部状态', '启用', '停用']
const pageSizeOptions = ['10', '20', '50']

const filterForm = ref({
  ruleName: '',
  statusIndex: 0
})

const pageSizeIndex = ref(0)

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))

const visiblePages = computed(() => {
  const pages: number[] = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, 5)
    } else if (current >= total - 2) {
      pages.push(total - 4, total - 3, total - 2, total - 1, total)
    } else {
      pages.push(current - 2, current - 1, current, current + 1, current + 2)
    }
  }
  return pages
})

const formatTime = (timeStr?: string) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const formatTimeRange = (startTime: string, endTime: string | null) => {
  const start = new Date(startTime)
  const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
  if (!endTime) return `${startStr} 至 永久`
  const end = new Date(endTime)
  const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
  return `${startStr} 至 ${endStr}`
}

const getChannelNames = (channels: string[]) => {
  const map: Record<string, string> = {
    'STATION_LETTER': '站内信',
    'SMS': '短信'
  }
  return channels.map(c => map[c] || c).join(', ')
}

const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    'PENDING': 'pending',
    'PROCESSING': 'processing',
    'ADOPTED': 'adopted',
    'REJECTED': 'rejected'
  }
  return classMap[status] || ''
}

const onStatusChange = (e: any) => {
  filterForm.value.statusIndex = e.detail.value
}

const onPageSizeChange = (e: any) => {
  pageSizeIndex.value = e.detail.value
  pageSize.value = parseInt(pageSizeOptions[e.detail.value])
  currentPage.value = 1
  loadRules()
}

const handleSearch = () => {
  currentPage.value = 1
  loadRules()
}

const resetFilter = () => {
  filterForm.value = {
    ruleName: '',
    statusIndex: 0
  }
  currentPage.value = 1
  loadRules()
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadRules()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadRules()
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
  loadRules()
}

const goToEdit = (id?: number) => {
  const url = id ? `/pages/warning/rule/edit?id=${id}` : '/pages/warning/rule/edit'
  uni.navigateTo({ url })
}

const toggleRule = async (id: number, enabled: number) => {
  try {
    await toggleRuleStatus(id, enabled)
    uni.showToast({ 
      title: enabled ? '已启用' : '已停用', 
      icon: 'success' 
    })
    loadRules()
  } catch (error: any) {
    uni.showToast({ 
      title: error.message || (enabled ? '启用失败' : '停用失败'), 
      icon: 'error' 
    })
  }
}

const deleteRule = (rule: WarningRule) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除规则【${rule.ruleName}】吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteRule(rule.id)
          uni.showToast({ title: '删除成功', icon: 'success' })
          loadRules()
        } catch (error: any) {
          uni.showToast({ 
            title: error.message || '删除失败', 
            icon: 'error' 
          })
        }
      }
    }
  })
}

const showRuleEvents = async (ruleId: number) => {
  currentRuleId.value = ruleId
  showEventsModal.value = true
  try {
    const result = await getRuleEvents(ruleId, { page: 1, size: 20 })
    relatedEvents.value = result.list
  } catch (error) {
    console.error('加载关联事件失败', error)
  }
}

const loadRules = async () => {
  try {
    const params: any = {
      page: currentPage.value,
      size: pageSize.value
    }
    
    if (filterForm.value.ruleName) {
      params.ruleName = filterForm.value.ruleName
    }
    if (filterForm.value.statusIndex > 0) {
      params.enabled = filterForm.value.statusIndex === 1 ? 1 : 0
    }
    
    const result = await getRuleList(params)
    ruleList.value = result.list
    totalCount.value = result.total
  } catch (error) {
    console.error('加载预警规则失败', error)
  }
}

onMounted(() => {
  loadRules()
})
</script>

<style lang="scss" scoped>
.rule-page {
  min-height: 100vh;
  background: #F5F7FA;
}

.content {
  padding: 20px;
}

.filter-section {
  background: #FFFFFF;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-item {
  flex: 1;
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  background: #F5F7FA;
  border-radius: 4px;
  font-size: 14px;
}

.picker-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #F5F7FA;
  border-radius: 4px;
  font-size: 14px;
  color: #101010;
  
  &.small {
    padding: 6px 10px;
    font-size: 12px;
  }
}

.picker-arrow {
  font-size: 10px;
  color: #BBBBBB;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.btn {
  padding: 10px 24px;
  border-radius: 4px;
  font-size: 14px;
  border: none;
  cursor: pointer;
  
  &.btn-primary {
    background: #165DFF;
    color: #FFFFFF;
  }
  
  &.btn-secondary {
    background: #F5F7FA;
    color: #666666;
  }
  
  &.btn-success {
    background: #52C41A;
    color: #FFFFFF;
  }
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.rule-card {
  background: #FFFFFF;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #F0F0F0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.level-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #FFFFFF;
  
  &.red { background: #FF4D4F; }
  &.orange { background: #FF8C00; }
  &.yellow { background: #FAAD14; }
}

.rule-name {
  font-size: 16px;
  font-weight: 600;
  color: #101010;
}

.card-body {
  padding: 16px;
}

.desc {
  font-size: 13px;
  color: #666666;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.info-item {
  flex: 1;
  min-width: 120px;
  
  &.trigger-count .info-value.highlight {
    background: #FF4D4F;
    color: #FFFFFF;
    padding: 4px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
  }
}

.info-label {
  font-size: 12px;
  color: #999999;
  margin-bottom: 4px;
}

.info-value {
  font-size: 13px;
  color: #101010;
}

.object-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.object-tag {
  padding: 2px 8px;
  background: #E6F4FF;
  color: #165DFF;
  border-radius: 4px;
  font-size: 12px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #FAFAFA;
}

.creator-info {
  font-size: 12px;
  color: #999999;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 4px 12px;
  background: #F5F7FA;
  border-radius: 4px;
  font-size: 12px;
  color: #666666;
  cursor: pointer;
  
  &.danger {
    background: #FFF2F0;
    color: #FF4D4F;
  }
  
  &:hover {
    opacity: 0.8;
  }
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #999999;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #FFFFFF;
  border-radius: 8px;
}

.pagination-info {
  font-size: 13px;
  color: #666666;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-btn {
  padding: 6px 16px;
  background: #F5F7FA;
  border-radius: 4px;
  font-size: 13px;
  color: #666666;
  cursor: pointer;
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 13px;
  color: #666666;
  cursor: pointer;
  
  &.active {
    background: #165DFF;
    color: #FFFFFF;
  }
}

.page-size {
  margin-left: 8px;
}

.modal-overlay {
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
  width: 80%;
  max-width: 600px;
  background: #FFFFFF;
  border-radius: 8px;
  overflow: hidden;
  
  &.large {
    max-width: 800px;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #F0F0F0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #101010;
}

.modal-close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #999999;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.incident-table {
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: flex;
  background: #F5F7FA;
  padding: 12px;
}

.th {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #666666;
  text-align: center;
}

.table-row {
  display: flex;
  padding: 12px;
  border-bottom: 1px solid #F0F0F0;
  
  &:last-child {
    border-bottom: none;
  }
}

.td {
  flex: 1;
  font-size: 13px;
  color: #101010;
  text-align: center;
}

.level-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #FFFFFF;
  
  &.red { background: #FF4D4F; }
  &.orange { background: #FF8C00; }
  &.yellow { background: #FAAD14; }
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  
  &.pending { background: #FFF7E6; color: #FA8C16; }
  &.processing { background: #E6F7FF; color: #1890FF; }
  &.adopted { background: #F6FFED; color: #52C41A; }
  &.rejected { background: #FFF2F0; color: #FF4D4F; }
}

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
</style>