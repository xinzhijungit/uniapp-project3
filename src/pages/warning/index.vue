<template>
  <view class="main-layout">
    <TopNav />
    
    <view class="layout-body">
      <SideMenu />
      
      <view class="main-content">
        <view class="content">
      <view class="stats-card">
        <view class="stat-item" @click="filterByStatus('')">
          <view class="stat-value">{{ statistics.totalCount }}</view>
          <view class="stat-label">累计预警</view>
          <view class="stat-trend up">↑ 12%</view>
        </view>
        <view class="stat-item" @click="filterByStatus('PENDING')">
          <view class="stat-value pending">{{ statistics.pendingCount }}</view>
          <view class="stat-label">待反馈预警</view>
          <view class="stat-trend up">↑ 5%</view>
        </view>
        <view class="stat-item" @click="filterByStatus('ADOPTED')">
          <view class="stat-value adopted">{{ statistics.adoptedCount }}</view>
          <view class="stat-label">预警采纳</view>
          <view class="stat-trend down">↓ 8%</view>
        </view>
        <view class="stat-item" @click="filterByStatus('REJECTED')">
          <view class="stat-value rejected">{{ statistics.rejectedCount }}</view>
          <view class="stat-label">预警未采纳</view>
          <view class="stat-trend up">↑ 3%</view>
        </view>
      </view>

      <view class="filter-section">
        <view class="filter-row">
          <view class="filter-item">
            <view class="filter-label">时间范围</view>
            <picker :value="filterForm.timeRangeIndex" :range="timeRangeOptions" @change="onTimeRangeChange">
              <view class="picker-value">
                {{ timeRangeOptions[filterForm.timeRangeIndex] }}
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
          <view class="filter-item">
            <view class="filter-label">预警等级</view>
            <picker :value="filterForm.alertLevelIndex" :range="alertLevelOptions" @change="onAlertLevelChange">
              <view class="picker-value">
                {{ alertLevelOptions[filterForm.alertLevelIndex] }}
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
          <view class="filter-item">
            <view class="filter-label">处理状态</view>
            <picker :value="filterForm.statusIndex" :range="statusOptions" @change="onStatusChange">
              <view class="picker-value">
                {{ statusOptions[filterForm.statusIndex] }}
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
          <view class="filter-item search-item">
            <view class="filter-label">案件名称/编号</view>
            <input 
              class="search-input" 
              placeholder="请输入案件名称或编号" 
              v-model="filterForm.keyword"
              @confirm="handleSearch"
            />
          </view>
        </view>
        <view class="filter-actions">
          <button class="btn btn-primary" @click="handleSearch">查询</button>
          <button class="btn btn-secondary" @click="resetFilter">重置</button>
        </view>
      </view>

      <view class="table-section">
        <view class="table-header">
          <view class="col col-no">序号</view>
          <view class="col col-no">预警编号</view>
          <view class="col col-name">案件名称</view>
          <view class="col col-region">案发区域</view>
          <view class="col col-station">辖区派出所</view>
          <view class="col col-level">预警等级</view>
          <view class="col col-time">预警时间</view>
          <view class="col col-status">处理状态</view>
          <view class="col col-action">操作</view>
        </view>
        <scroll-view class="table-body" scroll-y>
          <view 
            v-for="(item, index) in eventList" 
            :key="item.id" 
            class="table-row"
          >
            <view class="col col-no">{{ (currentPage - 1) * pageSize + index + 1 }}</view>
            <view class="col col-no">{{ item.eventNo }}</view>
            <view class="col col-name">{{ item.ruleName }}</view>
            <view class="col col-region">{{ item.regionName }}</view>
            <view class="col col-station">{{ item.disposalDeptName }}</view>
            <view class="col col-level">
              <view class="level-tag" :class="item.alertLevel.toLowerCase()">
                {{ item.alertLevelName }}
              </view>
            </view>
            <view class="col col-time">{{ formatTime(item.triggerTime) }}</view>
            <view class="col col-status">
              <view class="status-tag" :class="getStatusClass(item.status)">
                {{ item.statusName }}
              </view>
            </view>
            <view class="col col-action">
              <view class="action-btn" @click="handleAdopt(item)">采纳</view>
              <view class="action-btn" @click="handleReject(item)">不采纳</view>
              <view class="action-btn primary" @click="viewDetail(item)">查看</view>
            </view>
          </view>
          <view v-if="eventList.length === 0" class="empty-state">
            <text>暂无数据</text>
          </view>
        </scroll-view>
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
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TopNav from '@/components/TopNav.vue'
import SideMenu from '@/components/SideMenu.vue'
import { 
  getWarningEvents, 
  getWarningStatistics, 
  feedbackWarningEvent,
  type WarningEvent,
  type WarningStatistics
} from '@/api/warning'

const statistics = ref<WarningStatistics>({
  totalCount: 0,
  pendingCount: 0,
  adoptedCount: 0,
  rejectedCount: 0,
  trendData: []
})

const eventList = ref<WarningEvent[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)

const timeRangeOptions = ['近7天', '近30天', '近90天', '自定义']
const alertLevelOptions = ['全部等级', '红色特急', '橙色紧急', '黄色关注']
const statusOptions = ['全部状态', '待处置', '处置中', '已采纳', '不采纳']
const pageSizeOptions = ['10', '20', '50']

const filterForm = ref({
  timeRangeIndex: 0,
  alertLevelIndex: 0,
  statusIndex: 0,
  keyword: ''
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

const alertLevelMap: Record<string, string> = {
  '红色特急': 'RED',
  '橙色紧急': 'ORANGE',
  '黄色关注': 'YELLOW'
}

const statusMap: Record<string, string> = {
  '待处置': 'PENDING',
  '处置中': 'PROCESSING',
  '已采纳': 'ADOPTED',
  '不采纳': 'REJECTED'
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

const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const onTimeRangeChange = (e: any) => {
  filterForm.value.timeRangeIndex = e.detail.value
}

const onAlertLevelChange = (e: any) => {
  filterForm.value.alertLevelIndex = e.detail.value
}

const onStatusChange = (e: any) => {
  filterForm.value.statusIndex = e.detail.value
}

const onPageSizeChange = (e: any) => {
  pageSizeIndex.value = e.detail.value
  pageSize.value = parseInt(pageSizeOptions[e.detail.value])
  currentPage.value = 1
  loadEvents()
}

const handleSearch = () => {
  currentPage.value = 1
  loadEvents()
}

const resetFilter = () => {
  filterForm.value = {
    timeRangeIndex: 0,
    alertLevelIndex: 0,
    statusIndex: 0,
    keyword: ''
  }
  currentPage.value = 1
  loadEvents()
}

const filterByStatus = (status: string) => {
  if (status) {
    filterForm.value.statusIndex = status === 'PENDING' ? 1 : status === 'ADOPTED' ? 3 : 4
  }
  currentPage.value = 1
  loadEvents()
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadEvents()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadEvents()
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
  loadEvents()
}

const viewDetail = (item: WarningEvent) => {
  uni.navigateTo({
    url: `/pages/warning/detail?eventNo=${item.eventNo}`
  })
}

const handleAdopt = (item: WarningEvent) => {
  uni.showModal({
    title: '确认采纳',
    content: `确定要采纳预警【${item.eventNo}】吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await feedbackWarningEvent(item.eventNo, {
            isAdopted: 1,
            disposalContent: '已采纳该预警'
          })
          uni.showToast({ title: '采纳成功', icon: 'success' })
          loadEvents()
          loadStatistics()
        } catch (error) {
          uni.showToast({ title: '操作失败', icon: 'error' })
        }
      }
    }
  })
}

const handleReject = (item: WarningEvent) => {
  uni.showModal({
    title: '确认不采纳',
    content: `确定要不采纳预警【${item.eventNo}】吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await feedbackWarningEvent(item.eventNo, {
            isAdopted: 0,
            disposalContent: '不采纳该预警'
          })
          uni.showToast({ title: '操作成功', icon: 'success' })
          loadEvents()
          loadStatistics()
        } catch (error) {
          uni.showToast({ title: '操作失败', icon: 'error' })
        }
      }
    }
  })
}

const loadStatistics = async () => {
  try {
    statistics.value = await getWarningStatistics()
  } catch (error) {
    console.error('加载统计数据失败', error)
  }
}

const loadEvents = async () => {
  try {
    const params: any = {
      page: currentPage.value,
      size: pageSize.value
    }
    
    if (filterForm.value.timeRangeIndex === 3) {
      params.timeRange = 'CUSTOM'
    } else {
      const ranges: Record<number, string> = { 0: '7D', 1: '30D', 2: '90D' }
      params.timeRange = ranges[filterForm.value.timeRangeIndex]
    }
    
    if (filterForm.value.alertLevelIndex > 0) {
      params.alertLevel = alertLevelMap[alertLevelOptions[filterForm.value.alertLevelIndex]]
    }
    
    if (filterForm.value.statusIndex > 0) {
      params.status = statusMap[statusOptions[filterForm.value.statusIndex]]
    }
    
    if (filterForm.value.keyword) {
      params.keyword = filterForm.value.keyword
    }
    
    const result = await getWarningEvents(params)
    eventList.value = result.list
    totalCount.value = result.total
  } catch (error) {
    console.error('加载预警事件失败', error)
  }
}

onMounted(() => {
  loadStatistics()
  loadEvents()
})
</script>

<style lang="scss" scoped>
.warning-page {
  min-height: 100vh;
  background: #F5F7FA;
}

.content {
  padding: 20px;
}

.stats-card {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  flex: 1;
  background: #FFFFFF;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #101010;
  margin-bottom: 8px;
  
  &.pending { color: #FF6B6B; }
  &.adopted { color: #52C41A; }
  &.rejected { color: #FAAD14; }
}

.stat-label {
  font-size: 14px;
  color: #666666;
  margin-bottom: 8px;
}

.stat-trend {
  font-size: 12px;
  
  &.up { color: #FF6B6B; }
  &.down { color: #52C41A; }
}

.filter-section {
  background: #FFFFFF;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  &.search-item {
    flex: 1;
    min-width: 200px;
  }
}

.filter-label {
  font-size: 13px;
  color: #666666;
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

.search-input {
  padding: 10px 12px;
  background: #F5F7FA;
  border-radius: 4px;
  font-size: 14px;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
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
}

.table-section {
  background: #FFFFFF;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  background: #F5F7FA;
  padding: 12px 16px;
  font-weight: 500;
  font-size: 13px;
  color: #666666;
}

.table-body {
  max-height: 400px;
}

.table-row {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #F0F0F0;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #FAFAFA;
  }
}

.col {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #101010;
  
  &.col-no { width: 80px; }
  &.col-name { flex: 1; min-width: 150px; }
  &.col-region { width: 150px; }
  &.col-station { width: 120px; }
  &.col-level { width: 100px; }
  &.col-time { width: 100px; }
  &.col-status { width: 80px; }
  &.col-action { 
    width: 180px; 
    display: flex;
    gap: 8px;
  }
}

.level-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #FFFFFF;
  
  &.red { background: #FF4D4F; }
  &.orange { background: #FF8C00; }
  &.yellow { background: #FAAD14; }
}

.status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  
  &.pending { background: #FFF7E6; color: #FA8C16; }
  &.processing { background: #E6F7FF; color: #1890FF; }
  &.adopted { background: #F6FFED; color: #52C41A; }
  &.rejected { background: #FFF2F0; color: #FF4D4F; }
}

.action-btn {
  padding: 4px 10px;
  background: #F5F7FA;
  border-radius: 4px;
  font-size: 12px;
  color: #666666;
  cursor: pointer;
  
  &.primary {
    background: #165DFF;
    color: #FFFFFF;
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