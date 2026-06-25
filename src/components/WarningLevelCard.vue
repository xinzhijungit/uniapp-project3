<template>
  <view class="card">
    <view class="card-header">
      <view class="header-left">
        <text class="header-icon">⚠️</text>
        <text class="header-title">三个预警等级</text>
      </view>
      <view class="warning-badge" :class="warningLevel?.level" v-if="warningLevel">
        {{ warningLevel.label }}
      </view>
    </view>
    
    <view class="card-body" v-if="warningLevel">
      <view class="level-display">
        <view class="level-icon" :class="warningLevel.level">
          {{ getLevelIcon(warningLevel.level) }}
        </view>
        <view class="level-info">
          <text class="level-label">{{ warningLevel.label }}</text>
          <text class="level-desc">{{ warningLevel.description }}</text>
        </view>
      </view>
      
      <view class="level-rules">
        <view class="rule-item" :class="{ active: warningLevel.level === 'high' }">
          <view class="rule-icon high">🔴</view>
          <view class="rule-content">
            <text class="rule-title">高危预警</text>
            <text class="rule-desc">目标人员本人案底库的服刑状态是"通缉的"</text>
          </view>
        </view>
        
        <view class="rule-item" :class="{ active: warningLevel.level === 'medium' }">
          <view class="rule-icon medium">🟠</view>
          <view class="rule-content">
            <text class="rule-title">关注人员</text>
            <text class="rule-desc">目标人员本人或关联户籍成员有案底库的服刑状态是"已服刑"</text>
          </view>
        </view>
        
        <view class="rule-item" :class="{ active: warningLevel.level === 'normal' }">
          <view class="rule-icon normal">🟢</view>
          <view class="rule-content">
            <text class="rule-title">正常人员</text>
            <text class="rule-desc">目标人员本人及关联户籍成员无案底库关联记录</text>
          </view>
        </view>
      </view>
    </view>
    
    <view class="empty-tip" v-else>
      <text>暂无预警信息</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { WarningLevel } from '@/api/personAnalysis'

defineProps<{
  warningLevel: WarningLevel | null
}>()

function getLevelIcon(level: string) {
  const icons: Record<string, string> = {
    high: '🚨',
    medium: '⚠️',
    normal: '✅'
  }
  return icons[level] || 'ℹ️'
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

.warning-badge {
  font-size: 24rpx;
  font-weight: 600;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  
  &.high {
    background: #ffebee;
    color: #F44336;
    border: 2rpx solid #F44336;
  }
  
  &.medium {
    background: #fff3e0;
    color: #FF9800;
    border: 2rpx solid #FF9800;
  }
  
  &.normal {
    background: #e8f5e9;
    color: #4CAF50;
    border: 2rpx solid #4CAF50;
  }
}

.card-body {
  padding: 24rpx;
}

.level-display {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  background: #f9fafc;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
}

.level-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  
  &.high {
    background: #ffebee;
  }
  
  &.medium {
    background: #fff3e0;
  }
  
  &.normal {
    background: #e8f5e9;
  }
}

.level-info {
  flex: 1;
}

.level-label {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.level-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}

.level-rules {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.rule-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 20rpx;
  background: #f9fafc;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  
  &.active {
    border-color: #1E88E5;
    background: #e3f2fd;
  }
}

.rule-icon {
  font-size: 28rpx;
}

.rule-content {
  flex: 1;
}

.rule-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.rule-desc {
  font-size: 24rpx;
  color: #666;
  line-height: 1.5;
}

.empty-tip {
  padding: 48rpx;
  text-align: center;
  color: #999;
  font-size: 26rpx;
}
</style>