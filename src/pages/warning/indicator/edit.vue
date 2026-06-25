<template>
  <view class="main-layout">
    <TopNav :title="isEdit ? '编辑指标' : '新建指标'" @back="handleBack" />
    
    <view class="layout-body">
      <SideMenu />
      
      <view class="main-content">
        <view class="content">
          <view class="form-card">
            <view class="form-section">
              <view class="form-label">指标名称 <text class="required">*</text></view>
              <input 
                class="form-input" 
                placeholder="请输入指标名称（100字符以内）" 
                v-model="form.indicatorName"
              />
              <view class="char-count">{{ form.indicatorName.length }}/100</view>
            </view>

            <view class="form-section">
              <view class="form-label">指标说明</view>
              <textarea 
                class="form-textarea" 
                placeholder="请输入指标说明（500字符以内）" 
                v-model="form.indicatorDesc"
              />
              <view class="char-count">{{ form.indicatorDesc.length }}/500</view>
            </view>

            <view class="form-section">
              <view class="form-label">指标标签</view>
              <view class="tag-input-area">
                <view class="selected-tags">
                  <view 
                    v-for="(tag, index) in form.indicatorTags" 
                    :key="index"
                    class="selected-tag"
                  >
                    {{ tag }}
                    <view class="tag-remove" @click="removeTag(index)">×</view>
                  </view>
                </view>
                <view class="tag-input-wrap">
                  <input 
                    class="tag-input" 
                    placeholder="输入标签后按回车添加" 
                    v-model="newTag"
                    @confirm="addTag"
                  />
                </view>
              </view>
            </view>

            <view class="form-section">
              <view class="form-label">指标配置类型 <text class="required">*</text></view>
              <view class="radio-group">
                <view 
                  class="radio-item"
                  :class="{ active: form.configType === 'SQL' }"
                  @click="form.configType = 'SQL'"
                >
                  <view class="radio-circle"></view>
                  <text>SQL</text>
                </view>
                <view 
                  class="radio-item"
                  :class="{ active: form.configType === 'CUSTOM_CALC' }"
                  @click="form.configType = 'CUSTOM_CALC'"
                >
                  <view class="radio-circle"></view>
                  <text>自定义计算器</text>
                </view>
                <view 
                  class="radio-item"
                  :class="{ active: form.configType === 'AGENT' }"
                  @click="form.configType = 'AGENT'"
                >
                  <view class="radio-circle"></view>
                  <text>指标定义Agent</text>
                </view>
              </view>
            </view>

            <view v-if="form.configType === 'SQL'" class="form-section">
              <view class="form-label">SQL内容 <text class="required">*</text></view>
              <view class="sql-editor">
                <textarea 
                  class="sql-textarea" 
                  placeholder="请输入SQL查询语句（1000字符以内）" 
                  :value="form.sqlContent"
                  @input="handleSqlInput"
                  :maxlength="1000"
                />
                <view class="char-count">{{ form.sqlContent.length }}/1000</view>
                <view class="sql-actions">
                  <button class="btn btn-secondary" @click="showSqlExample = true">SQL示例</button>
                </view>
              </view>
            </view>

            <view class="form-actions">
              <button class="btn btn-secondary" @click="handleBack">返回</button>
              <button class="btn btn-primary" @click="submitForm">提交</button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="showSqlExample" class="modal-overlay" @click="showSqlExample = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">SQL示例</text>
          <view class="modal-close" @click="showSqlExample = false">×</view>
        </view>
        <view class="modal-body">
          <pre class="sql-example">{{ sqlExample }}</pre>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TopNav from '@/components/TopNav.vue'
import SideMenu from '@/components/SideMenu.vue'
import { createIndicator, updateIndicator, getIndicatorDetail } from '@/api/warning'

const isEdit = ref(false)
const indicatorId = ref<number | null>(null)
const showSqlExample = ref(false)

const form = ref({
  indicatorName: '',
  indicatorDesc: '',
  configType: 'SQL',
  sqlContent: '',
  indicatorTags: [] as string[]
})

const newTag = ref('')

const sqlExample = `SELECT 
  NORM_ADDR AS 归一化地址,
  COUNT(*) AS 警情数量,
  CASE 
    WHEN COUNT(*) >= 5 THEN 'I级红色警告'
    WHEN COUNT(*) >= 3 THEN 'II级橙色警告'
    ELSE 'III级黄色关注'
  END AS 预警等级,
  MIN(BJSJ) AS 最早报警时间,
  MAX(BJSJ) AS 最晚报警时间
FROM jjd_jjd
WHERE XZQH = '610103'
  AND BJSJ >= DATE_SUB(NOW(), INTERVAL 3 DAY)
GROUP BY NORM_ADDR
HAVING COUNT(*) >= 2;`

const handleSqlInput = (e: any) => {
  const value = e.detail.value
  if (value.length <= 1000) {
    form.value.sqlContent = value
  }
}

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !form.value.indicatorTags.includes(tag)) {
    form.value.indicatorTags.push(tag)
  }
  newTag.value = ''
}

const removeTag = (index: number) => {
  form.value.indicatorTags.splice(index, 1)
}

const handleBack = () => {
  uni.navigateBack()
}

const validateForm = () => {
  if (!form.value.indicatorName.trim()) {
    uni.showToast({ title: '请输入指标名称', icon: 'none' })
    return false
  }
  if (form.value.indicatorName.length > 100) {
    uni.showToast({ title: '指标名称不能超过100字符', icon: 'none' })
    return false
  }
  if (form.value.configType === 'SQL' && !form.value.sqlContent.trim()) {
    uni.showToast({ title: '请输入SQL内容', icon: 'none' })
    return false
  }
  return true
}

const submitForm = async () => {
  if (!validateForm()) return
  
  try {
    if (isEdit.value && indicatorId.value) {
      await updateIndicator(indicatorId.value, {
        indicatorName: form.value.indicatorName,
        indicatorDesc: form.value.indicatorDesc,
        configType: form.value.configType,
        sqlContent: form.value.configType === 'SQL' ? form.value.sqlContent : undefined,
        indicatorTags: form.value.indicatorTags
      })
      uni.showToast({ title: '更新成功', icon: 'success' })
    } else {
      await createIndicator({
        indicatorName: form.value.indicatorName,
        indicatorDesc: form.value.indicatorDesc,
        configType: form.value.configType,
        sqlContent: form.value.configType === 'SQL' ? form.value.sqlContent : undefined,
        indicatorTags: form.value.indicatorTags
      })
      uni.showToast({ title: '创建成功', icon: 'success' })
    }
    
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error: any) {
    uni.showToast({ title: error.message || '操作失败', icon: 'error' })
  }
}

const getUrlParam = (name: string): string | null => {
  const search = window.location.search.substring(1)
  const params = new URLSearchParams(search)
  return params.get(name)
}

const loadDetail = async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  
  let id = null
  if (typeof window !== 'undefined' && window.location) {
    id = getUrlParam('id')
  }
  
  if (!id && (currentPage as any)?.options?.id) {
    id = (currentPage as any).options.id
  }
  
  console.log('页面参数ID:', id)
  
  if (id) {
    isEdit.value = true
    indicatorId.value = parseInt(id)
    try {
      const detail = await getIndicatorDetail(indicatorId.value!)
      console.log('获取到的详情:', detail)
      form.value = {
        indicatorName: detail.indicatorName,
        indicatorDesc: detail.indicatorDesc,
        configType: detail.configType,
        sqlContent: detail.sqlContent || '',
        indicatorTags: detail.indicatorTags || []
      }
    } catch (error: any) {
      console.error('加载指标详情失败', error.message)
    }
  }
}

onMounted(() => {
  loadDetail()
})
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

.edit-page {
  min-height: 100vh;
  background: #F5F7FA;
}

.content {
  padding: 20px;
}

.form-card {
  background: #FFFFFF;
  border-radius: 8px;
  padding: 24px;
}

.form-section {
  margin-bottom: 24px;
}

.form-label {
  font-size: 14px;
  color: #101010;
  margin-bottom: 8px;
  
  .required {
    color: #FF4D4F;
  }
}

.form-input {
  width: 100%;
  padding: 12px;
  background: #F5F7FA;
  border-radius: 4px;
  font-size: 14px;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #999999;
  margin-top: 4px;
}

.form-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  background: #F5F7FA;
  border-radius: 4px;
  font-size: 14px;
}

.tag-input-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #E6F4FF;
  color: #165DFF;
  border-radius: 4px;
  font-size: 13px;
}

.tag-remove {
  cursor: pointer;
  font-size: 16px;
  color: #165DFF;
}

.tag-input-wrap {
  width: 100%;
}

.tag-input {
  width: 100%;
  padding: 10px 12px;
  background: #F5F7FA;
  border-radius: 4px;
  font-size: 14px;
}

.radio-group {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 10px 16px;
  border-radius: 4px;
  transition: all 0.3s ease;
  
  &.active {
    background: #E6F4FF;
    
    .radio-circle {
      border-color: #165DFF;
      background: #165DFF;
    }
  }
}

.radio-circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #D9D9D9;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #FFFFFF;
    opacity: 0;
  }
  
  .radio-item.active &::after {
    opacity: 1;
  }
}

.sql-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sql-textarea {
  width: 100%;
  min-height: 200px;
  padding: 12px;
  background: #1E1E1E;
  color: #D4D4D4;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.sql-actions {
  display: flex;
  justify-content: flex-end;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
}

.btn {
  padding: 10px 24px;
  border-radius: 4px;
  font-size: 14px;
  border: none;
  cursor: pointer;
  
  &.btn-primary {
    background: #165DFF;
    color: #FFFFFF;
  }
  
  &.btn-secondary {
    background: #F5F7FA;
    color: #666666;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 80%;
  max-width: 800px;
  background: #FFFFFF;
  border-radius: 8px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #F0F0F0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #101010;
}

.modal-close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #999999;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.sql-example {
  padding: 16px;
  background: #1E1E1E;
  color: #D4D4D4;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>