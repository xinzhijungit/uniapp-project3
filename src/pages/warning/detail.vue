<template>
  <view class="main-layout">
    <TopNav title="预警详情" @back="handleBack" />
    
    <view class="layout-body">
      <SideMenu />
      
      <view class="main-content">
        <view class="content" v-if="eventDetail">
          <view class="header-section">
            <view class="level-badge" :class="eventDetail.alertLevel.toLowerCase()">
              {{ eventDetail.alertLevelName }}
            </view>
            <view class="event-title">{{ eventDetail.ruleName }}</view>
          </view>

          <view class="info-card">
            <view class="card-title">预警事件基本信息</view>
            <view class="info-grid">
              <view class="info-item">
                <view class="info-label">触发规则</view>
                <view class="info-value">{{ eventDetail.ruleName }}</view>
              </view>
              <view class="info-item">
                <view class="info-label">通知时间</view>
                <view class="info-value">{{ formatTime(eventDetail.notifyTime) }}</view>
              </view>
              <view class="info-item">
                <view class="info-label">通知对象</view>
                <view class="info-value">{{ eventDetail.notifyObject }}</view>
              </view>
              <view class="info-item">
                <view class="info-label">通知方式</view>
                <view class="info-value">{{ getNotifyChannelName(eventDetail.notifyChannel) }}</view>
              </view>
              <view class="info-item full">
                <view class="info-label">涉及区域</view>
                <view class="info-value">{{ eventDetail.regionName }}</view>
              </view>
            </view>
          </view>

          <view class="info-card">
            <view class="card-title">AI预警分析建议</view>
            <view class="suggestion-content">
              {{ eventDetail.aiAnalysisSuggestion || '暂无分析建议' }}
            </view>
          </view>

          <view class="info-card">
            <view class="card-title">预警依据分析</view>
            <view class="analysis-content">
              <view class="analysis-item">
                <view class="analysis-label">关联预警规则</view>
                <view class="analysis-value">{{ eventDetail.ruleName }}</view>
              </view>
              <view class="analysis-item">
                <view class="analysis-label">关联触发分析</view>
                <view class="analysis-value">{{ eventDetail.ruleName }}</view>
              </view>
              <view class="analysis-item">
                <view class="analysis-label">规则触发分析</view>
                <view class="analysis-value">{{ eventDetail.triggerBasis || '暂无触发分析' }}</view>
              </view>
            </view>
          </view>

          <view class="info-card">
            <view class="card-title">关联警情（{{ eventDetail.relatedIncidents.length }}个）</view>
            <view class="incident-table">
              <view class="table-header">
                <view class="th">序号</view>
                <view class="th">工单编号</view>
                <view class="th">警情内容</view>
                <view class="th">警情类型</view>
                <view class="th">涉案金额</view>
                <view class="th">处置状态</view>
                <view class="th">紧急程度</view>
              </view>
              <view 
                v-for="(item, index) in eventDetail.relatedIncidents" 
                :key="index"
                class="table-row"
              >
                <view class="td">{{ index + 1 }}</view>
                <view class="td clickable" @click="viewIncident(item.jjdbh)">{{ item.jjdbh }}</view>
                <view class="td">{{ truncateText(item.bjnr, 30) }}</view>
                <view class="td">{{ item.bjlxdmName || item.bjlxdm }}</view>
                <view class="td">{{ item.involvedAmount || '-' }}</view>
                <view class="td">
                  <view class="status-tag" :class="getIncidentStatusClass(item.disposalStatusName || item.disposalStatus)">
                    {{ item.disposalStatusName || item.disposalStatus }}
                  </view>
                </view>
                <view class="td">
                  <view class="urgency-tag" :class="getUrgencyClass(item.urgencyLevelName || item.urgencyLevel)">
                    {{ item.urgencyLevelName || item.urgencyLevel }}
                  </view>
                </view>
              </view>
              <view v-if="eventDetail.relatedIncidents.length === 0" class="empty-state">
                <text>暂无关联警情</text>
              </view>
            </view>
          </view>

          <view class="info-card">
            <view class="card-title">反馈预警处置结果</view>
            <view class="feedback-form">
              <view class="form-section">
                <view class="form-label">处置部门</view>
                <view class="form-value readonly">{{ eventDetail.disposalDeptName }}</view>
              </view>
              
              <view class="form-section">
                <view class="form-label">预警内容是否采纳 <text class="required">*</text></view>
                <view class="radio-group">
                  <view 
                    class="radio-item"
                    :class="{ active: feedbackForm.isAdopted === 1 }"
                    @click="feedbackForm.isAdopted = 1"
                  >
                    <view class="radio-circle"></view>
                    <text>采纳</text>
                  </view>
                  <view 
                    class="radio-item"
                    :class="{ active: feedbackForm.isAdopted === 0 }"
                    @click="feedbackForm.isAdopted = 0"
                  >
                    <view class="radio-circle"></view>
                    <text>不采纳</text>
                  </view>
                </view>
              </view>

              <view class="form-section">
                <view class="form-label">是否采纳时间</view>
                <picker mode="date" :value="feedbackForm.adoptTime" @change="onAdoptTimeChange">
                  <view class="form-value picker">
                    {{ feedbackForm.adoptTime || '请选择时间' }}
                    <text class="picker-arrow">▼</text>
                  </view>
                </picker>
              </view>

              <view class="form-section">
                <view class="form-label">处置内容 <text class="required">*</text></view>
                <textarea 
                  class="form-textarea"
                  placeholder="请输入处置结果说明..."
                  v-model="feedbackForm.disposalContent"
                />
              </view>

              <view class="form-actions">
                <button class="btn btn-secondary" @click="handleBack">关闭</button>
                <button class="btn btn-primary" @click="submitFeedback">提交反馈</button>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TopNav from '@/components/TopNav.vue'
import SideMenu from '@/components/SideMenu.vue'
import { getWarningEventDetail, feedbackWarningEvent, type WarningEventDetail } from '@/api/warning'

const eventDetail = ref<WarningEventDetail | null>(null)

const feedbackForm = ref({
  isAdopted: -1,
  adoptTime: '',
  disposalContent: ''
})

const formatTime = (timeStr?: string) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getNotifyChannelName = (channel?: string) => {
  const channelMap: Record<string, string> = {
    'STATION_LETTER': '站内信',
    'SMS': '短信'
  }
  return channelMap[channel || ''] || channel || ''
}

const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

const getIncidentStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    '已派发': 'dispatched',
    '处置中': 'processing',
    '已办结': 'completed'
  }
  return classMap[status] || ''
}

const getUrgencyClass = (urgency: string) => {
  const classMap: Record<string, string> = {
    '非常紧急': 'critical',
    '紧急': 'urgent',
    '一般': 'normal'
  }
  return classMap[urgency] || ''
}

const onAdoptTimeChange = (e: any) => {
  feedbackForm.value.adoptTime = e.detail.value
}

const handleBack = () => {
  uni.navigateBack()
}

const viewIncident = (jjdbh: string) => {
  uni.showToast({
    title: `查看接警单: ${jjdbh}`,
    icon: 'none'
  })
}

const submitFeedback = async () => {
  if (feedbackForm.value.isAdopted === -1) {
    uni.showToast({ title: '请选择是否采纳', icon: 'none' })
    return
  }
  if (!feedbackForm.value.disposalContent.trim()) {
    uni.showToast({ title: '请填写处置内容', icon: 'none' })
    return
  }
  
  try {
    await feedbackWarningEvent(eventDetail.value!.eventNo, {
      isAdopted: feedbackForm.value.isAdopted,
      adoptTime: feedbackForm.value.adoptTime || undefined,
      disposalContent: feedbackForm.value.disposalContent
    })
    uni.showToast({ title: '提交成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    uni.showToast({ title: '提交失败', icon: 'error' })
  }
}

const loadDetail = async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const eventNo = (currentPage as any)?.options?.eventNo
  
  if (!eventNo) {
    uni.showToast({ title: '参数错误', icon: 'error' })
    return
  }
  
  try {
    eventDetail.value = await getWarningEventDetail(eventNo)
    const now = new Date()
    feedbackForm.value.adoptTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  } catch (error) {
    console.error('加载预警详情失败', error)
    uni.showToast({ title: '加载失败', icon: 'error' })
  }
}

onMounted(() => {
  loadDetail()
})
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

.content {
  padding: 20px;
}

.header-section {
  background: #FFFFFF;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
}

.level-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  color: #FFFFFF;
  margin-bottom: 12px;
  
  &.red { background: #FF4D4F; }
  &.orange { background: #FF8C00; }
  &.yellow { background: #FAAD14; }
}

.event-title {
  font-size: 20px;
  font-weight: 600;
  color: #101010;
}

.info-card {
  background: #FFFFFF;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #101010;
  margin-bottom: 16px;
  padding-left: 8px;
  border-left: 4px solid #165DFF;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  &.full {
    grid-column: 1 / -1;
  }
}

.info-label {
  font-size: 13px;
  color: #666666;
}

.info-value {
  font-size: 14px;
  color: #101010;
  
  &.readonly {
    background: #F5F7FA;
    padding: 8px 12px;
    border-radius: 4px;
  }
  
  &.picker {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #F5F7FA;
    padding: 10px 12px;
    border-radius: 4px;
  }
}

.suggestion-content {
  background: #F6FFED;
  border: 1px solid #B7EB8F;
  border-radius: 8px;
  padding: 16px;
  font-size: 14px;
  color: #101010;
  line-height: 1.6;
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.analysis-item {
  display: flex;
  gap: 12px;
}

.analysis-label {
  width: 120px;
  font-size: 13px;
  color: #666666;
  flex-shrink: 0;
}

.analysis-value {
  flex: 1;
  font-size: 14px;
  color: #101010;
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
  
  &:first-child { width: 60px; flex: none; }
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
  
  &:first-child { width: 60px; flex: none; }
  &.clickable { color: #165DFF; cursor: pointer; }
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  
  &.dispatched { background: #E6F7FF; color: #1890FF; }
  &.processing { background: #FFF7E6; color: #FA8C16; }
  &.completed { background: #F6FFED; color: #52C41A; }
}

.urgency-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  
  &.critical { background: #FF4D4F; color: #FFFFFF; }
  &.urgent { background: #FF8C00; color: #FFFFFF; }
  &.normal { background: #FAAD14; color: #FFFFFF; }
}

.empty-state {
  padding: 30px;
  text-align: center;
  color: #999999;
}

.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  color: #101010;
  
  .required {
    color: #FF4D4F;
  }
}

.form-value {
  font-size: 14px;
  color: #101010;
}

.form-textarea {
  width: 100%;
  min-height: 60px;
  height: 60px;
  padding: 12px;
  background: #F5F7FA;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.radio-group {
  display: flex;
  gap: 32px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s ease;
  
  &.active {
    background: #E6F4FF;
    
    .radio-circle {
      border-color: #165DFF;
      background: #165DFF;
    }
  }
}

.radio-circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #D9D9D9;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #FFFFFF;
    opacity: 0;
  }
  
  .radio-item.active &::after {
    opacity: 1;
  }
}

.picker-arrow {
  font-size: 10px;
  color: #BBBBBB;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
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
</style>
