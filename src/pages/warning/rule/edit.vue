<template>
  <view class="main-layout">
    <TopNav :title="isEdit ? '编辑规则' : '新建规则'" />
    
    <view class="layout-body">
      <SideMenu />
      
      <view class="main-content">
        <view class="content">
          <view class="form-card">
        <view class="section-title">基本信息</view>
        
        <view class="form-row">
          <view class="form-item">
            <view class="form-label">规则名称 <text class="required">*</text></view>
            <input 
              class="form-input" 
              placeholder="请输入规则名称" 
              v-model="form.ruleName"
            />
          </view>
          <view class="form-item">
            <view class="form-label">预警等级 <text class="required">*</text></view>
            <view class="radio-group">
              <view 
                v-for="level in levelOptions" 
                :key="level.value"
                class="radio-item"
                :class="{ active: form.alertLevel === level.value }"
                @click="form.alertLevel = level.value"
              >
                <view class="radio-circle" :class="level.value.toLowerCase()"></view>
                <text>{{ level.label }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="form-row">
          <view class="form-item">
            <view class="form-label">规则分类</view>
            <picker :value="categoryIndex" :range="categoryOptions" @change="onCategoryChange">
              <view class="picker-value">
                {{ categoryOptions[categoryIndex] }}
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
          <view class="form-item">
            <view class="form-label">生效时间</view>
            <view class="time-range">
              <picker mode="date" :value="form.startTime" @change="onStartTimeChange">
                <view class="date-picker">{{ form.startTime || '选择开始时间' }}</view>
              </picker>
              <text class="time-separator">至</text>
              <picker mode="date" :value="form.endTime" @change="onEndTimeChange">
                <view class="date-picker">{{ form.endTime || '永久' }}</view>
              </picker>
            </view>
          </view>
        </view>

        <view class="form-item">
          <view class="form-label">规则描述</view>
          <textarea 
            class="form-textarea" 
            placeholder="请输入规则描述" 
            v-model="form.ruleDesc"
          />
        </view>
      </view>

      <view class="form-card">
        <view class="section-title">指标配置</view>
        
        <view class="indicator-select">
          <view class="select-header">
            <text>选择关联指标</text>
            <button class="btn btn-primary" @click="showIndicatorModal = true">选择指标</button>
          </view>
          <view v-if="selectedIndicators.length === 0" class="empty-state">
            <text>请选择关联的预警指标</text>
          </view>
          <view v-else class="selected-list">
            <view 
              v-for="(item, index) in selectedIndicators" 
              :key="index"
              class="selected-item"
            >
              <view class="item-info">
                <view class="item-name">{{ item.indicatorName }}</view>
                <view class="item-desc">{{ item.indicatorDesc }}</view>
              </view>
              <view class="item-actions">
                <view class="action-btn" @click="removeIndicator(index)">移除</view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="form-card">
        <view class="section-title">条件配置</view>
        
        <view class="condition-list">
          <view 
            v-for="(condition, index) in form.conditions" 
            :key="index"
            class="condition-item"
          >
            <view class="condition-header">
              <text class="condition-label">条件 {{ index + 1 }}</text>
              <view v-if="form.conditions.length > 1" class="remove-btn" @click="removeCondition(index)">×</view>
            </view>
            <view class="condition-body">
              <view class="condition-row">
                <view class="condition-col">
                  <view class="form-label">字段</view>
                  <picker :value="condition.fieldIndex" :range="fieldOptions" @change="(e: any) => updateConditionField(index, e)">
                    <view class="picker-value small">{{ fieldOptions[condition.fieldIndex] }}</view>
                  </picker>
                </view>
                <view class="condition-col">
                  <view class="form-label">操作符</view>
                  <picker :value="condition.operatorIndex" :range="operatorOptions" @change="(e: any) => updateConditionOperator(index, e)">
                    <view class="picker-value small">{{ operatorOptions[condition.operatorIndex] }}</view>
                  </picker>
                </view>
                <view class="condition-col">
                  <view class="form-label">值</view>
                  <input 
                    class="form-input small" 
                    placeholder="输入值" 
                    v-model="condition.value"
                  />
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <view class="add-condition" @click="addCondition">
          <text>+ 添加条件</text>
        </view>
      </view>

      <view class="form-card">
        <view class="section-title">通知配置</view>
        
        <view class="form-row">
          <view class="form-item">
            <view class="form-label">通知频率</view>
            <view class="radio-group">
              <view 
                class="radio-item"
                :class="{ active: form.notifyFrequencyType === 'REALTIME' }"
                @click="form.notifyFrequencyType = 'REALTIME'"
              >
                <view class="radio-circle"></view>
                <text>实时触发</text>
              </view>
              <view 
                class="radio-item"
                :class="{ active: form.notifyFrequencyType === 'SCHEDULED' }"
                @click="form.notifyFrequencyType = 'SCHEDULED'"
              >
                <view class="radio-circle"></view>
                <text>定时触发</text>
              </view>
            </view>
          </view>
          <view class="form-item">
            <view class="form-label">通知渠道</view>
            <view class="channel-options">
              <view 
                v-for="channel in channelOptions" 
                :key="channel.value"
                class="channel-item"
                :class="{ active: form.notificationChannels.includes(channel.value) }"
                @click="toggleChannel(channel.value)"
              >
                {{ channel.label }}
              </view>
            </view>
          </view>
        </view>

        <view class="form-item">
          <view class="form-label">通知对象</view>
          <view class="object-select">
            <view class="select-header">
              <text>选择通知对象</text>
              <button class="btn btn-primary" @click="showObjectModal = true">选择对象</button>
            </view>
            <view v-if="form.notificationObjects.length === 0" class="empty-state">
              <text>请选择通知对象</text>
            </view>
            <view v-else class="object-tags">
              <view 
                v-for="(obj, index) in form.notificationObjects" 
                :key="index"
                class="object-tag"
              >
                {{ obj.objectName }}
                <view class="tag-remove" @click="removeObject(index)">×</view>
              </view>
            </view>
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

    <view v-if="showIndicatorModal" class="modal-overlay" @click="showIndicatorModal = false">
      <view class="modal-content large" @click.stop>
        <view class="modal-header">
          <text class="modal-title">选择指标</text>
          <view class="modal-close" @click="showIndicatorModal = false">×</view>
        </view>
        <view class="modal-body">
          <view class="modal-filter">
            <input 
              class="search-input" 
              placeholder="搜索指标" 
              v-model="indicatorSearch"
              @confirm="loadIndicatorOptions"
            />
          </view>
          <view class="indicator-options">
            <view 
              v-for="item in indicatorOptions" 
              :key="item.id"
              class="indicator-option"
              :class="{ selected: isIndicatorSelected(item.id) }"
              @click="toggleIndicatorSelect(item)"
            >
              <view class="option-checkbox">
                <view v-if="isIndicatorSelected(item.id)" class="check-icon">✓</view>
              </view>
              <view class="option-info">
                <view class="option-name">{{ item.indicatorName }}</view>
                <view class="option-desc">{{ item.indicatorDesc }}</view>
              </view>
            </view>
          </view>
          <view class="modal-footer">
            <button class="btn btn-secondary" @click="showIndicatorModal = false">取消</button>
            <button class="btn btn-primary" @click="confirmIndicatorSelect">确定</button>
          </view>
        </view>
      </view>
    </view>

    <view v-if="showObjectModal" class="modal-overlay" @click="showObjectModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">选择通知对象</text>
          <view class="modal-close" @click="showObjectModal = false">×</view>
        </view>
        <view class="modal-body">
          <view class="modal-filter">
            <input 
              class="search-input" 
              placeholder="搜索对象" 
              v-model="objectSearch"
            />
          </view>
          <view class="object-options">
            <view 
              v-for="item in objectOptions" 
              :key="item.objectId"
              class="object-option"
              :class="{ selected: isObjectSelected(item.objectId) }"
              @click="toggleObjectSelect(item)"
            >
              <view class="option-checkbox">
                <view v-if="isObjectSelected(item.objectId)" class="check-icon">✓</view>
              </view>
              <view class="option-info">
                <view class="option-name">{{ item.objectName }}</view>
                <view class="option-desc">{{ item.objectType }}</view>
              </view>
            </view>
          </view>
          <view class="modal-footer">
            <button class="btn btn-secondary" @click="showObjectModal = false">取消</button>
            <button class="btn btn-primary" @click="confirmObjectSelect">确定</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TopNav from '@/components/TopNav.vue'
import SideMenu from '@/components/SideMenu.vue'
import { 
  createRule, 
  updateRule, 
  getRuleDetail,
  getIndicatorList,
  type WarningRule,
  type WarningIndicator
} from '@/api/warning'

const isEdit = ref(false)
const ruleId = ref<number | null>(null)
const showIndicatorModal = ref(false)
const showObjectModal = ref(false)
const indicatorSearch = ref('')
const objectSearch = ref('')

const levelOptions = [
  { value: 'RED', label: 'I级红色警告' },
  { value: 'ORANGE', label: 'II级橙色警告' },
  { value: 'YELLOW', label: 'III级黄色关注' }
]

const categoryOptions = ['人员密集', '治安热点', '重点场所', '其他']
const fieldOptions = ['警情数量', '指标值', '时间', '地域']
const operatorOptions = ['>', '<', '=', '>=', '<=', '包含']
const channelOptions = [
  { value: 'STATION_LETTER', label: '站内信' },
  { value: 'SMS', label: '短信' }
]

const categoryIndex = ref(0)
const indicatorOptions = ref<WarningIndicator[]>([])
const selectedIndicators = ref<any[]>([])
const objectOptions = ref<any[]>([
  { objectId: '1', objectName: '张三', objectType: '管理员' },
  { objectId: '2', objectName: '李四', objectType: '民警' },
  { objectId: '3', objectName: '王五', objectType: '管理员' },
  { objectId: '4', objectName: '赵六', objectType: '民警' }
])

const form = ref({
  ruleName: '',
  alertLevel: 'YELLOW',
  category: '',
  startTime: '',
  endTime: '',
  ruleDesc: '',
  notifyFrequencyType: 'REALTIME' as 'REALTIME' | 'SCHEDULED',
  notificationChannels: [] as string[],
  notificationObjects: [] as any[],
  conditions: [{ fieldIndex: 0, operatorIndex: 0, value: '' }]
})

const onCategoryChange = (e: any) => {
  categoryIndex.value = e.detail.value
  form.value.category = categoryOptions[e.detail.value]
}

const onStartTimeChange = (e: any) => {
  form.value.startTime = e.detail.value
}

const onEndTimeChange = (e: any) => {
  form.value.endTime = e.detail.value
}

const updateConditionField = (index: number, e: any) => {
  form.value.conditions[index].fieldIndex = e.detail.value
}

const updateConditionOperator = (index: number, e: any) => {
  form.value.conditions[index].operatorIndex = e.detail.value
}

const addCondition = () => {
  form.value.conditions.push({ fieldIndex: 0, operatorIndex: 0, value: '' })
}

const removeCondition = (index: number) => {
  form.value.conditions.splice(index, 1)
}

const toggleChannel = (channel: string) => {
  const index = form.value.notificationChannels.indexOf(channel)
  if (index > -1) {
    form.value.notificationChannels.splice(index, 1)
  } else {
    form.value.notificationChannels.push(channel)
  }
}

const removeObject = (index: number) => {
  form.value.notificationObjects.splice(index, 1)
}

const removeIndicator = (index: number) => {
  selectedIndicators.value.splice(index, 1)
}

const isIndicatorSelected = (id: number) => {
  return selectedIndicators.value.some(item => item.id === id)
}

const isObjectSelected = (objectId: string) => {
  return form.value.notificationObjects.some(item => item.objectId === objectId)
}

const toggleIndicatorSelect = (item: any) => {
  const index = selectedIndicators.value.findIndex(i => i.id === item.id)
  if (index > -1) {
    selectedIndicators.value.splice(index, 1)
  } else {
    selectedIndicators.value.push(item)
  }
}

const toggleObjectSelect = (item: any) => {
  const index = form.value.notificationObjects.findIndex(i => i.objectId === item.objectId)
  if (index > -1) {
    form.value.notificationObjects.splice(index, 1)
  } else {
    form.value.notificationObjects.push(item)
  }
}

const loadIndicatorOptions = async () => {
  try {
    const result = await getIndicatorList({ page: 1, size: 50 })
    indicatorOptions.value = result.list
  } catch (error) {
    console.error('加载指标选项失败', error)
  }
}

const confirmIndicatorSelect = () => {
  showIndicatorModal.value = false
}

const confirmObjectSelect = () => {
  showObjectModal.value = false
}

const handleBack = () => {
  uni.navigateBack()
}

const validateForm = () => {
  if (!form.value.ruleName.trim()) {
    uni.showToast({ title: '请输入规则名称', icon: 'none' })
    return false
  }
  if (!form.value.startTime) {
    uni.showToast({ title: '请选择生效开始时间', icon: 'none' })
    return false
  }
  if (selectedIndicators.value.length === 0) {
    uni.showToast({ title: '请选择关联指标', icon: 'none' })
    return false
  }
  if (form.value.notificationObjects.length === 0) {
    uni.showToast({ title: '请选择通知对象', icon: 'none' })
    return false
  }
  return true
}

const submitForm = async () => {
  if (!validateForm()) return
  
  try {
    const conditions = form.value.conditions.map((c, index) => ({
      groupIndex: 1,
      indicatorId: selectedIndicators.value[0]?.id || 1,
      operator: operatorOptions[c.operatorIndex],
      thresholdSingle: c.value,
      thresholdMin: null,
      thresholdMax: null
    }))
    
    const params: any = {
      ruleName: form.value.ruleName,
      alertLevel: form.value.alertLevel,
      category: form.value.category || '其他',
      startTime: form.value.startTime,
      endTime: form.value.endTime || null,
      ruleDesc: form.value.ruleDesc,
      notifyFrequencyType: form.value.notifyFrequencyType,
      notificationChannels: form.value.notificationChannels,
      notificationObjects: form.value.notificationObjects,
      indicatorIds: selectedIndicators.value.map(i => i.id),
      conditions: conditions
    }
    
    if (isEdit.value && ruleId.value) {
      await updateRule(ruleId.value, params)
      uni.showToast({ title: '更新成功', icon: 'success' })
    } else {
      await createRule(params)
      uni.showToast({ title: '创建成功', icon: 'success' })
    }
    
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error: any) {
    uni.showToast({ title: error.message || '操作失败', icon: 'error' })
  }
}

const loadDetail = async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const id = (currentPage as any)?.options?.id
  
  if (id) {
    isEdit.value = true
    ruleId.value = parseInt(id)
    try {
      const detail: WarningRule = await getRuleDetail(ruleId.value!)
      const loadedConditions = detail.conditions && detail.conditions.length > 0 
        ? detail.conditions.map(c => ({
            fieldIndex: fieldOptions.indexOf(c.indicatorName || '警情数量'),
            operatorIndex: operatorOptions.indexOf(c.operator || '>'),
            value: c.thresholdSingle || ''
          }))
        : [{ fieldIndex: 0, operatorIndex: 0, value: '' }]
      
      form.value = {
        ruleName: detail.ruleName,
        alertLevel: detail.alertLevel,
        category: detail.category || '',
        startTime: formatDate(detail.startTime),
        endTime: detail.endTime ? formatDate(detail.endTime) : '',
        ruleDesc: detail.ruleDesc,
        notifyFrequencyType: detail.notifyFrequencyType,
        notificationChannels: detail.notificationChannels,
        notificationObjects: detail.notificationObjects,
        conditions: loadedConditions
      }
      categoryIndex.value = categoryOptions.indexOf(detail.category || '其他')
      if (detail.indicators && detail.indicators.length > 0) {
        selectedIndicators.value = detail.indicators
      } else if (detail.indicatorIds) {
        await loadIndicatorOptions()
        selectedIndicators.value = indicatorOptions.value.filter(i => 
          detail.indicatorIds.includes(i.id)
        )
      }
    } catch (error) {
      console.error('加载规则详情失败', error)
    }
  }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

onMounted(() => {
  loadIndicatorOptions()
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

.content {
  padding: 20px;
}

.form-card {
  background: #FFFFFF;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #101010;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F0F0F0;
}

.form-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.form-item {
  flex: 1;
  min-width: 300px;
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
  
  &.small {
    padding: 8px 12px;
    font-size: 13px;
  }
}

.form-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  background: #F5F7FA;
  border-radius: 4px;
  font-size: 14px;
}

.radio-group {
  display: flex;
  gap: 16px;
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
  
  &.red {
    &.active, & {
      border-color: #FF4D4F;
      background: #FF4D4F;
    }
  }
  
  &.orange {
    &.active, & {
      border-color: #FF8C00;
      background: #FF8C00;
    }
  }
  
  &.yellow {
    &.active, & {
      border-color: #FAAD14;
      background: #FAAD14;
    }
  }
  
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

.picker-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #F5F7FA;
  border-radius: 4px;
  font-size: 14px;
  color: #101010;
  
  &.small {
    padding: 8px 10px;
    font-size: 13px;
  }
}

.picker-arrow {
  font-size: 10px;
  color: #BBBBBB;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-picker {
  padding: 10px 12px;
  background: #F5F7FA;
  border-radius: 4px;
  font-size: 14px;
  color: #101010;
}

.time-separator {
  color: #999999;
}

.indicator-select, .object-select {
  border: 1px dashed #D9D9D9;
  border-radius: 4px;
  padding: 16px;
}

.select-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.empty-state {
  padding: 30px;
  text-align: center;
  color: #999999;
}

.selected-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selected-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #F5F7FA;
  border-radius: 4px;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: #101010;
}

.item-desc {
  font-size: 12px;
  color: #999999;
  margin-top: 4px;
}

.item-actions {
  margin-left: 12px;
}

.action-btn {
  padding: 4px 12px;
  background: #FFF2F0;
  color: #FF4D4F;
  border-radius: 4px;
  font-size: 12px;
}

.condition-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.condition-item {
  border: 1px solid #F0F0F0;
  border-radius: 8px;
  overflow: hidden;
}

.condition-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #FAFAFA;
}

.condition-label {
  font-size: 13px;
  font-weight: 500;
  color: #101010;
}

.remove-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #999999;
  cursor: pointer;
}

.condition-body {
  padding: 12px;
}

.condition-row {
  display: flex;
  gap: 12px;
}

.condition-col {
  flex: 1;
}

.add-condition {
  margin-top: 16px;
  padding: 12px;
  border: 1px dashed #165DFF;
  border-radius: 4px;
  text-align: center;
  color: #165DFF;
  font-size: 14px;
  cursor: pointer;
}

.channel-options {
  display: flex;
  gap: 12px;
}

.channel-item {
  padding: 10px 20px;
  background: #F5F7FA;
  border-radius: 4px;
  font-size: 14px;
  color: #666666;
  cursor: pointer;
  
  &.active {
    background: #E6F4FF;
    color: #165DFF;
  }
}

.object-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.object-tag {
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
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  background: #FFFFFF;
  border-radius: 8px;
  margin-top: 20px;
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
  max-width: 600px;
  background: #FFFFFF;
  border-radius: 8px;
  overflow: hidden;
  
  &.large {
    max-width: 800px;
  }
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
  padding: 16px 20px;
  max-height: 500px;
  overflow-y: auto;
}

.modal-filter {
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  background: #F5F7FA;
  border-radius: 4px;
  font-size: 14px;
}

.indicator-options, .object-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.indicator-option, .object-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background: #FAFAFA;
  }
  
  &.selected {
    background: #E6F4FF;
  }
}

.option-checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid #D9D9D9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .indicator-option.selected &,
  .object-option.selected & {
    background: #165DFF;
    border-color: #165DFF;
  }
}

.check-icon {
  color: #FFFFFF;
  font-size: 14px;
}

.option-info {
  flex: 1;
}

.option-name {
  font-size: 14px;
  font-weight: 500;
  color: #101010;
}

.option-desc {
  font-size: 12px;
  color: #999999;
  margin-top: 4px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #F0F0F0;
}
</style>