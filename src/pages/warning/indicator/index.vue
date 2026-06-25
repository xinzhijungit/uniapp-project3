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
              placeholder="请输入指标名称/指标说明" 
              v-model="filterForm.keyword"
              @confirm="handleSearch"
            />
          </view>
          <view class="filter-item">
            <input 
              class="search-input" 
              placeholder="请输入指标标签名称" 
              v-model="filterForm.tag"
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
          <button class="btn btn-success" @click="goToEdit()">新建</button>
        </view>
      </view>

      <view class="table-section">
        <view class="table-header">
          <view class="col col-no">序号</view>
          <view class="col col-name">指标名称</view>
          <view class="col col-desc">指标说明</view>
          <view class="col col-type">指标配置类型</view>
          <view class="col col-tags">指标标签</view>
          <view class="col col-status">启用</view>
          <view class="col col-creator">创建人</view>
          <view class="col col-time">创建时间</view>
          <view class="col col-action">操作</view>
        </view>
        <scroll-view class="table-body" scroll-y>
          <view 
            v-for="(item, index) in indicatorList" 
            :key="item.id" 
            class="table-row"
          >
            <view class="col col-no">{{ (currentPage - 1) * pageSize + index + 1 }}</view>
            <view class="col col-name">{{ item.indicatorName }}</view>
            <view class="col col-desc">{{ item.indicatorDesc }}</view>
            <view class="col col-type">{{ item.configTypeName }}</view>
            <view class="col col-tags">
              <view class="tag-list">
                <view v-for="tag in item.indicatorTags" :key="tag" class="tag">{{ tag }}</view>
              </view>
            </view>
            <view class="col col-status">
              <switch 
                :checked="item.enabled === 1" 
                @change="(e: any) => toggleIndicator(item.id, e.detail.value ? 1 : 0)"
              />
            </view>
            <view class="col col-creator">{{ item.createBy }}</view>
            <view class="col col-time">{{ formatTime(item.createTime) }}</view>
            <view class="col col-action">
              <view class="action-btn" @click="goToEdit(item.id)">编辑</view>
              <view class="action-btn danger" @click="deleteIndicator(item)">删除</view>
            </view>
          </view>
          <view v-if="indicatorList.length === 0" class="empty-state">
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
  getIndicatorList, 
  deleteIndicator, 
  toggleIndicatorStatus,
  type WarningIndicator
} from '@/api/warning'

const indicatorList = ref<WarningIndicator[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)

const statusOptions = ['全部状态', '启用', '停用']
const pageSizeOptions = ['10', '20', '50']

const filterForm = ref({
  keyword: '',
  tag: '',
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

const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const onStatusChange = (e: any) => {
  filterForm.value.statusIndex = e.detail.value
}

const onPageSizeChange = (e: any) => {
  pageSizeIndex.value = e.detail.value
  pageSize.value = parseInt(pageSizeOptions[e.detail.value])
  currentPage.value = 1
  loadIndicators()
}

const handleSearch = () => {
  currentPage.value = 1
  loadIndicators()
}

const resetFilter = () => {
  filterForm.value = {
    keyword: '',
    tag: '',
    statusIndex: 0
  }
  currentPage.value = 1
  loadIndicators()
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadIndicators()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadIndicators()
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
  loadIndicators()
}

const goToEdit = (id?: number) => {
  const url = id ? `/pages/warning/indicator/edit?id=${id}` : '/pages/warning/indicator/edit'
  uni.navigateTo({ url })
}

const toggleIndicator = async (id: number, enabled: number) => {
  try {
    await toggleIndicatorStatus(id, enabled)
    uni.showToast({ 
      title: enabled ? '已启用' : '已停用', 
      icon: 'success' 
    })
    loadIndicators()
  } catch (error: any) {
    uni.showToast({ 
      title: error.message || (enabled ? '启用失败' : '停用失败'), 
      icon: 'error' 
    })
  }
}

const deleteIndicator = (item: WarningIndicator) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除指标【${item.indicatorName}】吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteIndicator(item.id)
          uni.showToast({ title: '删除成功', icon: 'success' })
          loadIndicators()
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

const loadIndicators = async () => {
  try {
    const params: any = {
      page: currentPage.value,
      size: pageSize.value
    }
    
    if (filterForm.value.keyword) {
      params.keyword = filterForm.value.keyword
    }
    if (filterForm.value.tag) {
      params.tag = filterForm.value.tag
    }
    if (filterForm.value.statusIndex > 0) {
      params.enabled = filterForm.value.statusIndex === 1 ? 1 : 0
    }
    
    const result = await getIndicatorList(params)
    indicatorList.value = result.list
    totalCount.value = result.total
  } catch (error) {
    console.error('加载预警指标失败', error)
  }
}

onMounted(() => {
  loadIndicators()
})
</script>

<style lang="scss" scoped>
.indicator-page {
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
  min-width: 150px;
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
  
  &.col-no { width: 60px; }
  &.col-name { width: 150px; }
  &.col-desc { flex: 1; min-width: 150px; }
  &.col-type { width: 120px; }
  &.col-tags { width: 120px; }
  &.col-status { width: 80px; justify-content: center; }
  &.col-creator { width: 80px; }
  &.col-time { width: 100px; }
  &.col-action { 
    width: 120px; 
    display: flex;
    gap: 8px;
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  padding: 2px 6px;
  background: #E6F4FF;
  color: #165DFF;
  border-radius: 4px;
  font-size: 11px;
}

.action-btn {
  padding: 4px 10px;
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