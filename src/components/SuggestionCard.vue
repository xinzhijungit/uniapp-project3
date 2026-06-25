<template>
  <view class="card">
    <view class="card-header">
      <view class="header-left">
        <text class="header-icon">💡</text>
        <text class="header-title">风险处置建议 (AI建议)</text>
      </view>
    </view>
    
    <view class="card-body" v-if="suggestions.length > 0">
      <view class="suggestion-list">
        <view class="suggestion-item" v-for="(suggestion, index) in suggestions" :key="index">
          <view class="suggestion-number">{{ index + 1 }}</view>
          <view class="suggestion-content">
            <text class="suggestion-text">{{ suggestion }}</text>
          </view>
        </view>
      </view>
      
      <view class="suggestion-footer">
        <text class="footer-text">以上建议仅供参考，请结合实际情况进行处置</text>
      </view>
    </view>
    
    <view class="empty-tip" v-else>
      <text>暂无处置建议</text>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  suggestions: string[]
}>()
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

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.suggestion-item {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
}

.suggestion-number {
  width: 48rpx;
  height: 48rpx;
  background: linear-gradient(135deg, #1E88E5, #1565C0);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.suggestion-content {
  flex: 1;
  padding: 16rpx 20rpx;
  background: #f9fafc;
  border-radius: 12rpx;
}

.suggestion-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

.suggestion-footer {
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 1rpx dashed #ddd;
}

.footer-text {
  font-size: 24rpx;
  color: #999;
  text-align: center;
}

.empty-tip {
  padding: 48rpx;
  text-align: center;
  color: #999;
  font-size: 26rpx;
}
</style>