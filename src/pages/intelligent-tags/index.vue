<template>
  <view class="main-layout">
    <TopNav />
    
    <view class="layout-body">
      <SideMenu />
      
      <view class="main-content">
        <view class="page-header">
          <text class="page-title">智能标签配置</text>
          <view class="page-desc">建立动态化警情标签体系，对警情全生命周期进行精细化管理，实现标签化分类与分级预警</view>
        </view>
        
        <view class="stats-section">
          <view class="stat-card">
            <view class="stat-icon purple">
              <text class="icon-text">🏷️</text>
            </view>
            <view class="stat-info">
              <text class="stat-value">{{ statistics.totalTags }}</text>
              <text class="stat-label">标签总数</text>
            </view>
          </view>
          
          <view class="stat-card">
            <view class="stat-icon green">
              <text class="icon-text">✅</text>
            </view>
            <view class="stat-info">
              <text class="stat-value">{{ statistics.enabledTags }}</text>
              <text class="stat-label">启用标签</text>
            </view>
          </view>
          
          <view class="stat-card">
            <view class="stat-icon pink">
              <text class="icon-text">📋</text>
            </view>
            <view class="stat-info">
              <text class="stat-value">{{ statistics.rulesCount }}</text>
              <text class="stat-label">识别规则</text>
            </view>
          </view>
          
          <view class="stat-card">
            <view class="stat-icon gradient">
              <text class="icon-text">🤖</text>
            </view>
            <view class="stat-info">
              <text class="stat-value">{{ statistics.modelName }}</text>
              <text class="stat-label">AI模型</text>
            </view>
          </view>
        </view>
        
        <view class="content-area">
          <view class="header-bar">
            <view class="tabs-section">
              <view 
                class="tab-item" 
                :class="{ active: activeTab === tab.key }"
                v-for="tab in tabs" 
                :key="tab.key"
                @click="activeTab = tab.key"
              >
                {{ tab.label }}
              </view>
            </view>
            
            <view class="add-tag-btn" @click="handleAddTag">
              <text class="btn-icon">+</text>
              <text class="btn-text">新建标签</text>
            </view>
          </view>
          
          <view class="search-bar">
            <input 
              class="search-input" 
              placeholder="搜索标签名称或编码" 
              v-model="searchKeyword"
              @confirm="handleSearch"
            />
            <view class="search-btn" @click="handleSearch">
              <text class="search-icon">🔍</text>
            </view>
          </view>
          
          <scroll-view scroll-y class="tags-list">
            <view class="tag-card" v-for="tag in tagList" :key="tag.TAG_CODE" @click="handleEditTag(tag.TAG_CODE)">
              <view class="tag-header">
                <view class="tag-icon" :class="getPriorityClass(tag.PRIORITY)">
                  <text class="icon-symbol">{{ getPrioritySymbol(tag.PRIORITY) }}</text>
                </view>
                <view class="tag-info">
                  <view class="tag-name-row">
                    <text class="tag-name">{{ tag.TAG_NAME }}</text>
                    <view class="priority-tag" :class="getPriorityClass(tag.PRIORITY)">
                      {{ getPriorityText(tag.PRIORITY) }}
                    </view>
                  </view>
                  <text class="tag-code">{{ tag.TAG_CODE }}</text>
                </view>
                <view class="tag-status" :class="{ active: tag.STATUS === 1 }">
                  {{ tag.STATUS === 1 ? '启用' : '禁用' }}
                </view>
              </view>
              
              <view class="tag-desc-row">
                <text class="tag-desc">{{ tag.DESCRIPTION }}</text>
                <view class="tag-actions">
                  <view class="action-btn edit" @click.stop="handleEditTag(tag.TAG_CODE)">编辑</view>
                  <view class="action-btn enable" :class="{ active: tag.STATUS === 1 }" @click.stop="handleToggleStatus(tag)">
                    {{ tag.STATUS === 1 ? '禁用' : '启用' }}
                  </view>
                  <view class="action-btn delete" @click.stop="handleDeleteTag(tag.TAG_CODE)">删除</view>
                </view>
              </view>
            </view>
            
            <view class="empty-state" v-if="tagList.length === 0">
              <text class="empty-icon">📭</text>
              <text class="empty-text">暂无标签数据</text>
            </view>
          </scroll-view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import TopNav from '@/components/TopNav.vue'
import SideMenu from '@/components/SideMenu.vue'
import { getTagList, getTagStatistics, updateTag, deleteTag, type TagConfig, type TagStatistics } from '@/api/tagManagement'

const statistics = ref<TagStatistics>({
  totalTags: 0,
  enabledTags: 0,
  rulesCount: 0,
  modelName: 'DeepSeek'
})

const activeTab = ref('CITIZEN')
const tabs = [
  { key: 'CITIZEN', label: '人员标签' },
  { key: 'CASE', label: '警情标签' }
]

const searchKeyword = ref('')
const tagList = ref<TagConfig[]>([])

onLoad(async () => {
  await loadData()
})

watch(activeTab, () => {
  loadData()
})

async function loadData() {
  uni.showLoading({ title: '加载中...' })
  try {
    statistics.value = await getTagStatistics()
    const result = await getTagList({
      targetType: activeTab.value,
      keyword: searchKeyword.value
    })
    tagList.value = result.list
  } catch (error) {
    console.error('加载失败', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

function handleSearch() {
  loadData()
}

function handleAddTag() {
  uni.navigateTo({ url: '/pages/intelligent-tags/edit' })
}

function handleEditTag(tagCode: string) {
  uni.navigateTo({ url: `/pages/intelligent-tags/edit?tagCode=${tagCode}` })
}

async function handleToggleStatus(tag: TagConfig) {
  const newStatus = tag.STATUS === 1 ? 0 : 1
  try {
    await updateTag(tag.TAG_CODE, { STATUS: newStatus })
    tag.STATUS = newStatus
    uni.showToast({ title: newStatus === 1 ? '已启用' : '已禁用', icon: 'none' })
  } catch (error) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

async function handleDeleteTag(tagCode: string) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除该标签吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteTag(tagCode)
          tagList.value = tagList.value.filter(t => t.TAG_CODE !== tagCode)
          statistics.value.totalTags--
          uni.showToast({ title: '删除成功', icon: 'none' })
        } catch (error) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

function getPriorityClass(priority: number): string {
  if (priority === 3) return 'high'
  if (priority === 2) return 'medium'
  return 'low'
}

function getPrioritySymbol(priority: number): string {
  if (priority === 3) return '⚠️'
  if (priority === 2) return '🔶'
  return '🔵'
}

function getPriorityText(priority: number): string {
  if (priority === 3) return '高优先级'
  if (priority === 2) return '中优先级'
  return '低优先级'
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
  padding: 24px 30px;
  background: #FFFFFF;
  border-bottom: 1px solid #E8EEF4;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #101010;
  display: block;
  margin-bottom: 8px;
}

.page-desc {
  font-size: 14px;
  color: #666666;
  line-height: 1.5;
}

.stats-section {
  display: flex;
  gap: 16px;
  padding: 20px 30px;
}

.stat-card {
  flex: 1;
  background: #FFFFFF;
  border-radius: 4px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.purple {
    background: linear-gradient(135deg, #667EEA, #764BA2);
  }
  
  &.green {
    background: linear-gradient(135deg, #11998E, #38EF7D);
  }
  
  &.pink {
    background: linear-gradient(135deg, #FC4A1A, #F7B733);
  }
  
  &.gradient {
    background: linear-gradient(135deg, #4776E6, #8E54E9);
  }
}

.icon-text {
  font-size: 28px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #101010;
  display: block;
}

.stat-label {
  font-size: 13px;
  color: #666666;
}

.content-area {
  padding: 0 30px 30px;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-tag-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #165DFF;
  color: #FFFFFF;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #0F40F5;
  }
}

.btn-icon {
  font-size: 18px;
}

.btn-text {
  font-size: 14px;
}

.tabs-section {
  display: inline-flex;
  background: #FFFFFF;
  border-radius: 2px;
  padding: 4px;
}

.tab-item {
  padding: 10px 24px;
  font-size: 14px;
  color: #666666;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.active {
    background: #165DFF;
    color: #FFFFFF;
  }
}

.search-bar {
  display: flex;
  background: #FFFFFF;
  border-radius: 4px;
  padding: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-input {
  flex: 1;
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
  border: none;
  outline: none;
}

.search-btn {
  width: 48px;
  height: 40px;
  background: #165DFF;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.search-icon {
  font-size: 16px;
}

.tags-list {
  height: calc(100vh - 420px);
}

.tag-card {
  background: #FFFFFF;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
}

.tag-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.tag-icon {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.high { background: rgba(244, 67, 54, 0.1); }
  &.medium { background: rgba(255, 152, 0, 0.1); }
  &.low { background: rgba(76, 175, 80, 0.1); }
}

.icon-symbol {
  font-size: 22px;
}

.tag-info {
  flex: 1;
}

.tag-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.tag-name {
  font-size: 16px;
  font-weight: 600;
  color: #101010;
}

.priority-tag {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 2px;
  
  &.high {
    background: rgba(244, 67, 54, 0.1);
    color: #F44336;
  }
  &.medium {
    background: rgba(255, 152, 0, 0.1);
    color: #FF9800;
  }
  &.low {
    background: rgba(76, 175, 80, 0.1);
    color: #4CAF50;
  }
}

.tag-code {
  font-size: 13px;
  color: #666666;
}

.tag-status {
  font-size: 12px;
  color: #666666;
  padding: 6px 14px;
  background: #F5F5F5;
  border-radius: 16px;
  
  &.active {
    background: rgba(76, 175, 80, 0.1);
    color: #4CAF50;
  }
}

.tag-desc {
  font-size: 14px;
  color: #666666;
  line-height: 1.5;
  margin-bottom: 12px;
  display: block;
}

.tag-desc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tag-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  font-size: 13px;
  padding: 6px 16px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    opacity: 0.8;
  }
  
  &.edit {
    background: #F5F5F5;
    color: #666666;
  }
  
  &.enable {
    background: rgba(255, 152, 0, 0.1);
    color: #FF9800;
    
    &.active {
      background: rgba(76, 175, 80, 0.1);
      color: #4CAF50;
    }
  }
  
  &.delete {
    background: rgba(244, 67, 54, 0.1);
    color: #F44336;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
  color: #BBBBBB;
}
</style>