<template>
  <view class="side-menu">
    <view 
      v-for="menu in menuList" 
      :key="menu.id"
      class="menu-item"
    >
      <view 
        class="menu-header"
        :class="{ active: currentMenu === menu.id }"
        @click="toggleMenu(menu.id)"
      >
        <view class="menu-icon">
          <text>{{ menu.icon }}</text>
        </view>
        <text class="menu-name">{{ menu.name }}</text>
        <view 
          v-if="menu.children && menu.children.length > 0" 
          class="menu-arrow"
          :class="{ expanded: expandedMenu === menu.id }"
        >
          ▶
        </view>
      </view>
      
      <view 
        v-if="menu.children && menu.children.length > 0 && expandedMenu === menu.id"
        class="sub-menu"
      >
        <template v-for="sub in menu.children" :key="sub.id">
          <view 
            class="sub-menu-item"
            :class="{ active: currentSubMenu === sub.id }"
            @click="handleSubMenuClick(sub)"
          >
            <view class="sub-menu-dot"></view>
            <text>{{ sub.name }}</text>
            <view 
              v-if="sub.children && sub.children.length > 0" 
              class="sub-arrow"
              :class="{ expanded: expandedSubMenu === sub.id }"
              @click.stop="toggleSubMenu(sub.id)"
            >▶</view>
            <view v-if="sub.badge" class="sub-menu-badge">{{ sub.badge }}</view>
          </view>
          
          <view 
            v-if="sub.children && sub.children.length > 0 && expandedSubMenu === sub.id"
            class="third-menu"
          >
            <view 
              v-for="third in sub.children" 
              :key="third.id"
              class="third-menu-item"
              :class="{ active: currentThirdMenu === third.id }"
              @click="handleThirdMenuClick(third)"
            >
              <view class="third-menu-dot"></view>
              <text>{{ third.name }}</text>
            </view>
          </view>
        </template>
      </view>
    </view>
    
    <view class="menu-footer">
      <view class="collapse-btn" @click="handleCollapse">
        <text>☰</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const expandedMenu = ref('data-analysis')
const expandedSubMenu = ref('police-warning')
const currentMenu = ref('data-analysis')
const currentSubMenu = ref('police-warning')
const currentThirdMenu = ref('warning-management')

const menuList = [
  {
    id: 'data-analysis',
    name: '数据研判',
    icon: '📊',
    children: [
      { 
        id: 'police-warning', 
        name: '警情预警', 
        badge: '',
        children: [
          { id: 'warning-management', name: '预警管理' },
          { id: 'warning-indicator', name: '预警指标' },
          { id: 'warning-rule', name: '预警规则' }
        ]
      },
      { id: 'statistical-analysis', name: '统计分析', badge: '' },
      { id: 'intelligent-qa', name: '智能问答', badge: '' }
    ]
  },
  {
    id: 'zhihui',
    name: '智汇人联',
    icon: '🔗',
    children: [
      { id: 'person-analysis', name: '人联研判', badge: '' },
      { id: 'intelligent-tags', name: '智能标签', badge: '1' }
    ]
  }
]

const toggleMenu = (menuId: string) => {
  const menu = menuList.find(m => m.id === menuId)
  if (menu && menu.children && menu.children.length > 0) {
    expandedMenu.value = menuId
    currentMenu.value = menuId
  } else {
    currentMenu.value = menuId
    expandedMenu.value = ''
    uni.showToast({
      title: `切换到${menu?.name}`,
      icon: 'none'
    })
  }
}

const toggleSubMenu = (subId: string) => {
  expandedSubMenu.value = expandedSubMenu.value === subId ? '' : subId
}

const handleSubMenuClick = (sub: { id: string; name: string; children?: any[] }) => {
  currentSubMenu.value = sub.id
  currentThirdMenu.value = ''
  
  if (sub.children && sub.children.length > 0) {
    return
  }
  
  if (sub.id === 'person-analysis') {
    uni.navigateTo({ url: '/pages/person-analysis/index' })
  } else if (sub.id === 'intelligent-tags') {
    uni.navigateTo({ url: '/pages/intelligent-tags/index' })
  } else if (sub.id === 'statistical-analysis') {
    uni.navigateTo({ url: '/pages/statistics/index' })
  } else if (sub.id === 'intelligent-qa') {
    uni.navigateTo({ url: '/pages/qa/index' })
  }
}

const handleThirdMenuClick = (third: { id: string; name: string }) => {
  currentThirdMenu.value = third.id
  
  expandedMenu.value = 'data-analysis'
  expandedSubMenu.value = 'police-warning'
  
  if (third.id === 'warning-management') {
    uni.navigateTo({ url: '/pages/warning/index' })
  } else if (third.id === 'warning-indicator') {
    uni.navigateTo({ url: '/pages/warning/indicator/index' })
  } else if (third.id === 'warning-rule') {
    uni.navigateTo({ url: '/pages/warning/rule/index' })
  }
}

const handleCollapse = () => {
  uni.showToast({
    title: '折叠菜单',
    icon: 'none'
  })
}
</script>

<style lang="scss" scoped>
.side-menu {
  width: 200px;
  min-height: calc(100vh - 60px);
  background: linear-gradient(180deg, #0F40F5 0%, #0A2B9B 100%);
  padding: 15px 0;
  display: flex;
  flex-direction: column;
}

.menu-item {
  margin-bottom: 4px;
}

.menu-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  
  &.active {
    background: #165DFF;
  }
}

.menu-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.menu-name {
  flex: 1;
  font-size: 14px;
  color: #FFFFFF;
}

.menu-arrow {
  font-size: 10px;
  color: #BBBBBB;
  transition: transform 0.3s ease;
  
  &.expanded {
    transform: rotate(90deg);
  }
}

.sub-menu {
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 0;
}

.sub-menu-item {
  display: flex;
  align-items: center;
  padding: 10px 20px 10px 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  
  &.active {
    background: rgba(22, 93, 255, 0.3);
    
    .sub-menu-dot {
      background: #165DFF;
    }
  }
  
  text {
    flex: 1;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.9);
  }
}

.sub-menu-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #BBBBBB;
  margin-right: 10px;
  transition: all 0.3s ease;
}

.sub-menu-badge {
  background: #FF5252;
  color: #FFFFFF;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}

.sub-arrow {
  font-size: 10px;
  color: #BBBBBB;
  margin-right: 8px;
  cursor: pointer;
  transition: transform 0.3s ease;
  
  &.expanded {
    transform: rotate(90deg);
  }
}

.third-menu {
  padding: 2px 0;
  margin-left: 25px;
}

.third-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 20px 8px 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  
  &.active {
    background: rgba(22, 93, 255, 0.3);
    
    .third-menu-dot {
      background: #165DFF;
    }
  }
  
  text {
    flex: 1;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.75);
  }
}

.third-menu-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #AAAAAA;
  margin-right: 10px;
  transition: all 0.3s ease;
}

.menu-footer {
  margin-top: auto;
  padding: 15px 0;
  display: flex;
  justify-content: center;
}

.collapse-btn {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  text {
    font-size: 16px;
    color: #BBBBBB;
  }
}
</style>