<template>
  <view class="main-layout">
    <TopNav />
    
    <view class="layout-body">
      <SideMenu />
      
      <view class="main-content">
        <view class="page-header">
          <text class="page-title">人联研判</text>
          <view class="header-actions">
            <view class="action-btn" @click="handleRefresh">
              <text class="action-icon">🔄</text>
            </view>
            <view class="action-btn" @click="handleRegenerateGraph">
              <text class="action-icon">🔄</text>
              <text class="action-text">重置图谱</text>
            </view>
          </view>
        </view>
        
        <view class="page-body">
          <view class="main-area">
            <view class="results-section" v-if="hasSearchResult">
              <RiskAnalysisCard 
                :analysisText="analysisResult.analysisText || '暂无分析数据'"
                :features="analysisResult.features"
                :suggestions="analysisResult.suggestions"
                :tags="analysisResult.tags || []"
              />
              
              <PersonInfoCard 
                :person="analysisResult.personInfo"
                :riskScore="analysisResult.riskScore"
                :riskTags="analysisResult.riskTags"
              />
              
              <CaseRecordsCard 
                :caseRecords="analysisResult.caseRecords"
              />
              
              <HouseholdCard 
                :householdInfo="analysisResult.householdInfo"
                :householdMembers="analysisResult.householdMembers"
                :personCriminalRecords="analysisResult.personCriminalRecords"
                :householdCriminalRecords="analysisResult.householdCriminalRecords"
              />
              
              <!-- 预警等级为后台判断逻辑，不对外展示 -->
              
              <SuggestionCard 
                :suggestions="analysisResult.suggestions"
              />
              
              <KnowledgeGraph 
                :nodes="analysisResult.graphData.nodes"
                :links="analysisResult.graphData.links"
                @node-click="handleNodeClick"
              />
            </view>
            
            <view class="empty-section" v-else>
              <view class="empty-icon">🔍</view>
              <text class="empty-title">请进行检索</text>
              <text class="empty-desc">输入身份证号、车牌号、案件编号或手机号进行人员研判分析</text>
            </view>
          </view>
          
          <view class="side-panel">
            <SearchPanel @search="handleSearch" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TopNav from '@/components/TopNav.vue'
import SideMenu from '@/components/SideMenu.vue'
import SearchPanel from '@/components/SearchPanel.vue'
import PersonInfoCard from '@/components/PersonInfoCard.vue'
import RiskAnalysisCard from '@/components/RiskAnalysisCard.vue'
import KnowledgeGraph from '@/components/KnowledgeGraph.vue'
import CaseRecordsCard from '@/components/CaseRecordsCard.vue'
import HouseholdCard from '@/components/HouseholdCard.vue'
// WarningLevelCard 已移除，预警等级为后台判断逻辑，不对外展示
import SuggestionCard from '@/components/SuggestionCard.vue'
import { searchEntity, regenerateGraph, type AnalysisResult } from '@/api/personAnalysis'

const analysisResult = ref<AnalysisResult>({
  personInfo: null,
  riskScore: 0,
  riskTags: [],
  riskDetails: [],
  caseRecords: [],
  householdInfo: null,
  householdMembers: [],
  personCriminalRecords: [],
  householdCriminalRecords: [],
  warningLevel: null,
  suggestions: [],
  graphData: { nodes: [], links: [] },
  analysisText: '',
  features: []
})

const hasSearchResult = computed(() => analysisResult.value.personInfo !== null)

async function handleSearch(params: { idCard?: string; plateNumber?: string; caseNumber?: string; phoneNumber?: string }) {
  uni.showLoading({ title: '检索中...' })
  
  try {
    const result = await searchEntity(params)
    analysisResult.value = result
  } catch (error) {
    console.error('检索失败', error)
    uni.showToast({ title: '检索失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

function handleRefresh() {
  analysisResult.value = {
    personInfo: null,
    riskScore: 0,
    riskTags: [],
    riskDetails: [],
    caseRecords: [],
    householdInfo: null,
    householdMembers: [],
    personCriminalRecords: [],
    householdCriminalRecords: [],
    warningLevel: null,
    suggestions: [],
    graphData: { nodes: [], links: [] },
    analysisText: '',
    features: []
  }
}

async function handleRegenerateGraph() {
  uni.showLoading({ title: '生成中...' })
  
  try {
    const result = await regenerateGraph()
    if (result.success) {
      uni.showToast({ title: '图谱数据已更新', icon: 'success' })
    } else {
      uni.showToast({ title: '更新失败', icon: 'none' })
    }
  } catch (error) {
    console.error('更新图谱失败', error)
    uni.showToast({ title: '更新失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

function handleNodeClick(node: any) {
  console.log('Node clicked:', node)
}
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

.page-header {
  background: white;
  padding: 20px 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #E8EEF4;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  height: 40px;
  background: #F5F7FA;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #E8EEF4;
  }
}

.action-icon {
  font-size: 16px;
}

.action-text {
  font-size: 13px;
  color: #666;
}

.page-body {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px 30px;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.side-panel {
  width: 320px;
  flex-shrink: 0;
}

.results-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.empty-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 48px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #999;
  text-align: center;
}

.node-detail-panel {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-top: 20px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #F8FAFC;
  border-bottom: 1px solid #E8ECF0;
}

.node-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.panel-body {
  padding: 16px 20px;
  max-height: 400px;
  overflow-y: auto;
}

.property-item {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #F0F2F5;
  
  &:last-child {
    border-bottom: none;
  }
}

.property-label {
  font-size: 13px;
  color: #666;
  flex-shrink: 0;
  min-width: 100px;
}

.property-value {
  font-size: 13px;
  color: #333;
  flex: 1;
  word-break: break-all;
}

@media screen and (max-width: 750px) {
  .page-body {
    flex-direction: column;
  }
  
  .side-panel {
    width: 100%;
    order: -1;
  }
}
</style>