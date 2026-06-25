<template>
  <view class="main-layout">
    <TopNav />
    
    <view class="layout-body">
      <SideMenu />
      
      <view class="main-content">
        <view class="statistics-container">
          <!-- 嵌入外部统计分析页面 -->
          <iframe 
            class="statistics-iframe"
            src="https://aichat.jointpilot.com/front/?tenantName=%E4%B8%8A%E6%B5%B7%E5%B8%82%E5%A7%94%E5%85%9A%E6%A0%A1#/dashboard/manage?uniqKey=1807"
            frameborder="0"
            allowfullscreen
          ></iframe>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import TopNav from '@/components/TopNav.vue'
import SideMenu from '@/components/SideMenu.vue'
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

.statistics-container {
  height: calc(100vh - 60px);
  background: #FFFFFF;
  margin: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  position: relative;
}

.statistics-iframe {
  width: 100%;
  height: calc(100% + 60px);
  border: none;
  margin-top: -60px;
  position: absolute;
  top: 0;
  left: 0;
}
</style>