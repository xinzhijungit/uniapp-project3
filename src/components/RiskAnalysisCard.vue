<template>
  <view class="risk-card">
    <view class="card-header">
      <view class="header-left">
        <view class="icon-wrap">
          <text class="icon-text">AI</text>
        </view>
        <view class="header-info">
          <text class="title">AI分析原因</text>
          <text class="sub-title">基于多维度数据智能研判</text>
        </view>
      </view>
      <view class="tags-wrap" v-if="tags.length > 0">
        <view 
          class="tag-item" 
          v-for="tag in tags" 
          :key="tag.tagCode"
          :class="getPriorityClass(tag.priority)"
        >
          {{ tag.tagName }}
        </view>
      </view>
    </view>
    
    <view class="analysis-content">
      <text class="analysis-text">{{ analysisText }}</text>
    </view>
    
    <view class="analysis-list">
      <view class="list-header">
        <text class="list-title">本体特征</text>
        <text class="list-count">共{{ features.length }}条</text>
      </view>
      <view class="feature-items">
        <view class="feature-item" v-for="(item, index) in features" :key="index">
          <view class="feature-dot" :class="item.type"></view>
          <view class="feature-content">
            <text class="feature-title">{{ item.title }}</text>
            <text class="feature-desc">{{ item.desc }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <view class="tag-descriptions" v-if="tags.length > 0">
      <view class="tag-desc-header">
        <text class="tag-desc-title">标签描述</text>
      </view>
      <view class="tag-desc-list">
        <view class="tag-desc-item" v-for="tag in tags" :key="tag.tagCode">
          <text class="tag-desc-text">{{ tag.description }}</text>
        </view>
      </view>
    </view>
    
    <view class="suggestions">
      <view class="suggestions-header">
        <text class="suggestions-title">处置建议</text>
      </view>
      <view class="suggestions-list">
        <view class="suggestion-item" v-for="(suggestion, index) in suggestions" :key="index">
          <text class="suggestion-num">{{ index + 1 }}</text>
          <text class="suggestion-text">{{ suggestion }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Feature {
  type: string
  title: string
  desc: string
}

interface TagInfo {
  tagCode: string
  tagName: string
  priority: number
  description: string
}

const props = defineProps<{
  analysisText: string
  features: Feature[]
  suggestions: string[]
  tags: TagInfo[]
}>()

function getPriorityClass(priority: number) {
  if (priority === 3) return 'priority-3'
  if (priority === 2) return 'priority-2'
  return 'priority-1'
}
</script>

<style lang="scss" scoped>
.risk-card {
  background: linear-gradient(135deg, #FFF5F5, #FFFFFF);
  border-radius: 16rpx;
  padding: 32rpx;
  border: 1rpx solid #FFE4E1;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.icon-wrap {
  width: 64rpx;
  height: 64rpx;
  background: linear-gradient(135deg, #F44336, #E91E63);
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-text {
  font-size: 24rpx;
  font-weight: 600;
  color: #fff;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.sub-title {
  font-size: 24rpx;
  color: #999;
}

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-item {
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-weight: 500;
  
  &.priority-3 {
    background: #ffebee;
    color: #F44336;
    border: 2rpx solid #F44336;
  }
  
  &.priority-2 {
    background: #fff3e0;
    color: #FF9800;
    border: 2rpx solid #FF9800;
  }
  
  &.priority-1 {
    background: #e3f2fd;
    color: #1E88E5;
    border: 2rpx solid #1E88E5;
  }
}

.analysis-content {
  background: #fff;
  padding: 24rpx;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
}

.analysis-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

.analysis-list {
  margin-bottom: 24rpx;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.list-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.list-count {
  font-size: 24rpx;
  color: #999;
}

.feature-items {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.feature-item {
  display: flex;
  gap: 16rpx;
}

.feature-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin-top: 8rpx;
  
  &.high { background: #F44336; }
  &.medium { background: #FF9800; }
  &.low { background: #4CAF50; }
}

.feature-dot-icon {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4rpx;
  
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

.feature-content {
  flex: 1;
}

.feature-title {
  font-size: 26rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 4rpx;
  display: block;
}

.feature-desc {
  font-size: 24rpx;
  color: #666;
}

.tag-descriptions {
  background: #fff;
  padding: 24rpx;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
}

.tag-desc-header {
  margin-bottom: 16rpx;
}

.tag-desc-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.tag-desc-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.tag-desc-item {
  padding: 16rpx;
  background: #f9fafc;
  border-radius: 8rpx;
}

.tag-desc-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}

.suggestions-header {
  margin-bottom: 16rpx;
}

.suggestions-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.suggestion-item {
  display: flex;
  gap: 12rpx;
}

.suggestion-num {
  width: 40rpx;
  height: 40rpx;
  background: #1E88E5;
  border-radius: 50%;
  color: #fff;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.suggestion-text {
  font-size: 26rpx;
  color: #333;
  line-height: 1.5;
  padding-top: 6rpx;
}
</style>
