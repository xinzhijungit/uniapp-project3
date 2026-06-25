<template>
  <view class="search-panel">
    <view class="panel-header">
      <text class="panel-title">警务本体检索</text>
      <view class="alert-badge" v-if="alertCount > 0">{{ alertCount }}</view>
    </view>
    <view class="search-form">
      <view class="form-item">
        <text class="form-label">身份证号</text>
        <input 
          class="form-input" 
          placeholder="请输入身份证号" 
          v-model="searchForm.idCard"
          maxlength="18"
        />
      </view>
      <view class="form-item">
        <text class="form-label">车牌号</text>
        <input 
          class="form-input" 
          placeholder="请输入车牌号" 
          v-model="searchForm.plateNumber"
        />
      </view>
      <view class="form-item">
        <text class="form-label">案件/警情编号</text>
        <input 
          class="form-input" 
          placeholder="请输入案件/警情编号" 
          v-model="searchForm.caseNumber"
        />
      </view>
      <view class="form-item">
        <text class="form-label">手机号</text>
        <input 
          class="form-input" 
          placeholder="请输入手机号" 
          v-model="searchForm.phoneNumber"
          maxlength="11"
        />
      </view>
    </view>
    <button class="search-btn" @click="handleSearch">开始检索</button>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

const emit = defineEmits<{
  (e: 'search', params: { idCard?: string; plateNumber?: string; caseNumber?: string; phoneNumber?: string }): void
}>()

const alertCount = ref(1)

const searchForm = reactive({
  idCard: '',
  plateNumber: '',
  caseNumber: '',
  phoneNumber: ''
})

function handleSearch() {
  const params: { idCard?: string; plateNumber?: string; caseNumber?: string; phoneNumber?: string } = {}
  
  if (searchForm.idCard) params.idCard = searchForm.idCard
  if (searchForm.plateNumber) params.plateNumber = searchForm.plateNumber
  if (searchForm.caseNumber) params.caseNumber = searchForm.caseNumber
  if (searchForm.phoneNumber) params.phoneNumber = searchForm.phoneNumber
  
  emit('search', params)
}
</script>

<style lang="scss" scoped>
.search-panel {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.panel-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.alert-badge {
  width: 40rpx;
  height: 40rpx;
  background: #F44336;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24rpx;
  font-weight: 600;
}

.search-form {
  margin-bottom: 24rpx;
}

.form-item {
  margin-bottom: 20rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
  display: block;
}

.form-input {
  width: 100%;
  height: 80rpx;
  background: #F8F9FA;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.search-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #1E88E5, #1565C0);
  border-radius: 8rpx;
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  border: none;
}
</style>
