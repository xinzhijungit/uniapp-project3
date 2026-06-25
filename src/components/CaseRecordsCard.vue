<template>
  <view class="card">
    <view class="card-header">
      <view class="header-left">
        <text class="header-icon">📊</text>
        <text class="header-title">警情报警记录</text>
      </view>
      <view class="header-badge" v-if="caseRecords.length > 0">{{ caseRecords.length }}条</view>
    </view>
    
    <view class="card-body" v-if="caseRecords.length > 0">
      <view class="record-item" v-for="(record, index) in caseRecords" :key="index">
        <view class="record-header">
          <text class="record-number">警情编号: {{ record.caseNumber }}</text>
          <text class="record-time">{{ formatTime(record.alarmTime) }}</text>
        </view>
        <text class="record-content">报警内容: {{ record.content }}</text>
        <view class="record-disposal" v-if="record.disposalContent">
          <text class="disposal-label">处置情况:</text>
          <text class="disposal-content">{{ record.disposalContent }}</text>
        </view>
        <view class="record-result" v-if="record.disposalResult">
          <text class="result-label">处置结果:</text>
          <text class="result-value" :class="getResultClass(record.disposalResult)">{{ record.disposalResult }}</text>
        </view>
      </view>
    </view>
    
    <view class="empty-tip" v-else>
      <text>暂无警情记录</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { CaseRecord } from '@/api/personAnalysis'

defineProps<{
  caseRecords: CaseRecord[]
}>()

function formatTime(time: string) {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function getResultClass(result: string) {
  if (result.includes('已处理') || result.includes('已结案')) return 'success'
  if (result.includes('处理中')) return 'warning'
  return ''
}
</script>

<style lang="scss" scoped>
.card {
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #eee;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.header-icon {
  font-size: 32rpx;
}

.header-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.header-badge {
  background: #1E88E5;
  color: #fff;
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.card-body {
  padding: 24rpx;
}

.record-item {
  padding: 20rpx;
  background: #f9fafc;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.record-number {
  font-size: 26rpx;
  font-weight: 500;
  color: #333;
}

.record-time {
  font-size: 22rpx;
  color: #999;
}

.record-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

.record-disposal {
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx dashed #ddd;
}

.disposal-label {
  font-size: 24rpx;
  color: #999;
  margin-right: 8rpx;
}

.disposal-content {
  font-size: 24rpx;
  color: #666;
}

.record-result {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
}

.result-label {
  font-size: 24rpx;
  color: #999;
  margin-right: 8rpx;
}

.result-value {
  font-size: 24rpx;
  font-weight: 500;
  
  &.success {
    color: #4CAF50;
  }
  
  &.warning {
    color: #FF9800;
  }
}

.empty-tip {
  padding: 48rpx;
  text-align: center;
  color: #999;
  font-size: 26rpx;
}
</style>