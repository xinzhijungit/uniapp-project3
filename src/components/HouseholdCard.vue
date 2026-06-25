<template>
  <view class="card">
    <view class="card-header">
      <view class="header-left">
        <text class="header-icon">🏠</text>
        <text class="header-title">人口库、案底库关联结果信息</text>
      </view>
    </view>
    
    <view class="card-body">
      <view class="section" v-if="householdInfo">
        <view class="section-title">户籍信息</view>
        <view class="info-grid">
          <view class="info-item">
            <text class="info-label">姓名</text>
            <text class="info-value">{{ householdInfo.name }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">性别</text>
            <text class="info-value">{{ householdInfo.gender }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">出生日期</text>
            <text class="info-value">{{ formatDate(householdInfo.birth_date) }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">籍贯</text>
            <text class="info-value">{{ householdInfo.native_place }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">民族</text>
            <text class="info-value">{{ householdInfo.ethnicity }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">文化程度</text>
            <text class="info-value">{{ householdInfo.education }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">婚姻状况</text>
            <text class="info-value">{{ householdInfo.marital_status }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">职业</text>
            <text class="info-value">{{ householdInfo.occupation }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">服务处所</text>
            <text class="info-value">{{ householdInfo.workplace }}</text>
          </view>
          <view class="info-item full-width">
            <text class="info-label">户籍地址</text>
            <text class="info-value">{{ householdInfo.address }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">户别</text>
            <text class="info-value">{{ householdInfo.household_type }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">与户主关系</text>
            <text class="info-value">{{ householdInfo.relation_to_head }}</text>
          </view>
        </view>
      </view>
      
      <view class="section" v-if="householdMembers.length > 0">
        <view class="section-title">户籍成员 ({{ householdMembers.length }}人)</view>
        <view class="member-list">
          <view class="member-item" v-for="(member, index) in householdMembers" :key="index">
            <view class="member-info">
              <text class="member-name">{{ member.name }}</text>
              <text class="member-relation">{{ member.relation_to_head }}</text>
            </view>
            <view class="member-detail">
              <text class="detail-text">{{ member.gender }} | {{ member.occupation }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="section" v-if="personCriminalRecords.length > 0">
        <view class="section-title danger">本人案底记录 ({{ personCriminalRecords.length }}条)</view>
        <view class="record-list">
          <view class="record-item danger" v-for="(record, index) in personCriminalRecords" :key="index">
            <view class="record-header">
              <text class="record-title">{{ record.crime_type }}</text>
              <text class="record-status" :class="getStatusClass(record.prison_status)">{{ record.prison_status }}</text>
            </view>
            <text class="record-detail">{{ record.crime_detail }}</text>
            <view class="record-meta">
              <text class="meta-item">案件编号: {{ record.case_number }}</text>
              <text class="meta-item">逮捕日期: {{ formatDate(record.arrest_date) }}</text>
              <text class="meta-item" v-if="record.sentence_months">刑期: {{ record.sentence_months }}个月</text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="section" v-if="householdCriminalRecords.length > 0">
        <view class="section-title warning">户籍成员案底记录 ({{ householdCriminalRecords.length }}条)</view>
        <view class="record-list">
          <view class="record-item warning" v-for="(record, index) in householdCriminalRecords" :key="index">
            <view class="record-header">
              <text class="record-title">{{ record.name }} - {{ record.crime_type }}</text>
              <text class="record-status" :class="getStatusClass(record.prison_status)">{{ record.prison_status }}</text>
            </view>
            <text class="record-detail">{{ record.crime_detail }}</text>
            <view class="record-meta">
              <text class="meta-item">案件编号: {{ record.case_number }}</text>
              <text class="meta-item">逮捕日期: {{ formatDate(record.arrest_date) }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="empty-tip" v-if="!householdInfo && householdMembers.length === 0 && personCriminalRecords.length === 0 && householdCriminalRecords.length === 0">
        <text>暂无人口库和案底库关联信息</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { HouseholdInfo, CriminalRecord } from '@/api/personAnalysis'

defineProps<{
  householdInfo: HouseholdInfo | null
  householdMembers: HouseholdInfo[]
  personCriminalRecords: CriminalRecord[]
  householdCriminalRecords: CriminalRecord[]
}>()

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getStatusClass(status: string) {
  if (status === '通缉的') return 'danger'
  if (status === '已服刑') return 'warning'
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

.card-body {
  padding: 24rpx;
}

.section {
  margin-bottom: 32rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
  padding-bottom: 12rpx;
  border-bottom: 2rpx solid #1E88E5;
  
  &.danger {
    border-color: #F44336;
    color: #F44336;
  }
  
  &.warning {
    border-color: #FF9800;
    color: #FF9800;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.info-item {
  background: #f9fafc;
  padding: 16rpx;
  border-radius: 8rpx;
  
  &.full-width {
    grid-column: span 3;
  }
}

.info-label {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-bottom: 4rpx;
}

.info-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.member-list {
  background: #f9fafc;
  border-radius: 12rpx;
  overflow: hidden;
}

.member-item {
  padding: 16rpx 20rpx;
  border-bottom: 1rpx solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
}

.member-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.member-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.member-relation {
  font-size: 24rpx;
  color: #666;
}

.member-detail {
  margin-top: 8rpx;
}

.detail-text {
  font-size: 24rpx;
  color: #999;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.record-item {
  background: #fef5f5;
  padding: 20rpx;
  border-radius: 12rpx;
  border-left: 6rpx solid #F44336;
  
  &.warning {
    background: #fffbf5;
    border-left-color: #FF9800;
  }
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.record-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.record-status {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  background: #f0f0f0;
  color: #666;
  
  &.danger {
    background: #ffebee;
    color: #F44336;
  }
  
  &.warning {
    background: #fff3e0;
    color: #FF9800;
  }
}

.record-detail {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  display: block;
  margin-bottom: 12rpx;
}

.record-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.meta-item {
  font-size: 22rpx;
  color: #999;
}

.empty-tip {
  padding: 48rpx;
  text-align: center;
  color: #999;
  font-size: 26rpx;
}
</style>