<template>
  <view class="person-card" v-if="person">
    <view class="card-header">
      <view class="avatar-wrap">
        <view class="avatar">
          <text class="avatar-text">{{ person.XM?.charAt(0) || '?' }}</text>
        </view>
        <view class="danger-badge" v-if="isHighRisk">高危人员</view>
      </view>
      <view class="person-info">
        <view class="name-row">
          <text class="person-name">{{ person.XM }}</text>
          <view class="risk-score" :class="scoreClass">{{ riskScore }}</view>
        </view>
        <view class="basic-info">
          <text class="info-item">身份证：{{ maskIdCard(person.ZJHM) }}</text>
          <text class="info-item">手机号：{{ maskPhone(person.LXDH) }}</text>
        </view>
      </view>
    </view>
    
    <view class="card-body">
      <view class="info-section">
        <text class="section-title">基本信息</text>
        <view class="info-grid">
          <view class="info-cell">
            <text class="cell-label">性别</text>
            <text class="cell-value">{{ person.XB === 1 ? '男' : person.XB === 2 ? '女' : '未知' }}</text>
          </view>
          <view class="info-cell">
            <text class="cell-label">职业</text>
            <text class="cell-value">{{ person.ZY || '-' }}</text>
          </view>
          <view class="info-cell">
            <text class="cell-label">户籍地</text>
            <text class="cell-value">{{ person.HJXZ || '-' }}</text>
          </view>
          <view class="info-cell">
            <text class="cell-label">现住址</text>
            <text class="cell-value">{{ person.XZXZ || '-' }}</text>
          </view>
          <view class="info-cell">
            <text class="cell-label">工作单位</text>
            <text class="cell-value">{{ person.GZDW || '-' }}</text>
          </view>
          <view class="info-cell">
            <text class="cell-label">车牌号</text>
            <text class="cell-value">{{ person.CPH_ontology || '-' }}</text>
          </view>
        </view>
      </view>
      
      <view class="info-section" v-if="riskTags.length > 0">
        <text class="section-title">风险标签</text>
        <view class="tags-wrap">
          <view 
            class="tag-item" 
            :class="getTagClass(tag)" 
            v-for="tag in riskTags" 
            :key="tag"
          >
            {{ tag }}
          </view>
        </view>
      </view>
    </view>
  </view>
  
  <view class="empty-card" v-else>
    <text class="empty-text">暂无人员信息</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PersonInfo } from '@/api/personAnalysis'

const props = defineProps<{
  person: PersonInfo | null
  riskScore: number
  riskTags: string[]
}>()

const isHighRisk = computed(() => props.riskScore >= 80)

const scoreClass = computed(() => {
  if (props.riskScore >= 80) return 'high'
  if (props.riskScore >= 50) return 'medium'
  return 'low'
})

function maskIdCard(idCard: string) {
  if (!idCard) return '-'
  return idCard.replace(/(\d{4})\d{10}(\d{4})/, '$1**********$2')
}

function maskPhone(phone: string) {
  if (!phone) return '-'
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

function getTagClass(tag: string): string {
  const highTags = ['高危人员', '重点人员', '前科人员', '涉毒人员', '肇事肇祸精神病人', '扬言报复社会人员']
  const mediumTags = ['关注人员', '活动异常', '昼伏夜出']
  
  if (highTags.includes(tag)) return 'tag-high'
  if (mediumTags.includes(tag)) return 'tag-medium'
  return 'tag-low'
}
</script>

<style lang="scss" scoped>
.person-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #F0F0F0;
  margin-bottom: 24rpx;
}

.avatar-wrap {
  position: relative;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #1E88E5, #42A5F5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  font-size: 48rpx;
  font-weight: 600;
  color: #fff;
}

.danger-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  background: #F44336;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}

.person-info {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.person-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.risk-score {
  font-size: 48rpx;
  font-weight: 700;
  
  &.high { color: #F44336; }
  &.medium { color: #FF9800; }
  &.low { color: #4CAF50; }
}

.basic-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.info-item {
  font-size: 24rpx;
  color: #666;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.info-section {
  .section-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 16rpx;
    display: block;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.info-cell {
  background: #F8F9FA;
  padding: 16rpx;
  border-radius: 8rpx;
}

.cell-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
  display: block;
}

.cell-value {
  font-size: 26rpx;
  color: #333;
}

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-item {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  
  &.tag-high {
    background: rgba(244, 67, 54, 0.1);
    color: #F44336;
  }
  
  &.tag-medium {
    background: rgba(255, 152, 0, 0.1);
    color: #FF9800;
  }
  
  &.tag-low {
    background: rgba(76, 175, 80, 0.1);
    color: #4CAF50;
  }
}

.empty-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 60rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
