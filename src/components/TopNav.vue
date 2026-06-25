<template>
  <view class="top-nav">
    <view class="logo-section">
      <view class="logo-icon">
        <text class="logo-text">DEMO</text>
      </view>
    </view>
    
    <view class="nav-menu">
      <view 
        v-for="item in menuItems" 
        :key="item.name"
        class="nav-item"
        :class="{ active: currentMenu === item.name }"
        @click="handleMenuClick(item.name)"
      >
        {{ item.name }}
      </view>
    </view>
    
    <view class="right-section">
      <view class="search-icon" @click="handleSearch">
        <text>🔍</text>
      </view>
      <view class="user-info">
        <view class="user-avatar">
          <text>A</text>
        </view>
        <view class="user-detail">
          <text class="user-role">指挥中心</text>
          <text class="user-name">张强</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const currentMenu = ref('智汇人联')

const menuItems = [
  { name: '盯办管理' },
  { name: '数据研判' },
  { name: '智汇人联' },
  { name: '数据管理' },
  { name: '配置管理' },
  { name: '系统管理' }
]

const handleMenuClick = (name: string) => {
  currentMenu.value = name
  uni.showToast({
    title: `切换到${name}`,
    icon: 'none'
  })
}

const handleSearch = () => {
  uni.showToast({
    title: '搜索功能',
    icon: 'none'
  })
}
</script>

<style lang="scss" scoped>
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  background: linear-gradient(135deg, #0F40F5 0%, #0A2B9B 100%);
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: #FFFFFF;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  font-size: 14px;
  font-weight: bold;
  color: #0F40F5;
}

.nav-menu {
  display: flex;
  gap: 30px;
}

.nav-item {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 2px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #FFFFFF;
  }
  
  &.active {
    background: #FFFFFF;
    color: #165DFF;
    font-weight: 600;
  }
}

.right-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.search-icon {
  font-size: 18px;
  cursor: pointer;
  color: #BBBBBB;
  padding: 8px;
  border-radius: 2px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #FFFFFF;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.15);
  padding: 6px 12px;
  border-radius: 16px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  text {
    font-size: 14px;
    font-weight: bold;
    color: #0F40F5;
  }
}

.user-detail {
  display: flex;
  flex-direction: column;
}

.user-role {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.user-name {
  font-size: 13px;
  color: #FFFFFF;
  font-weight: 500;
}
</style>