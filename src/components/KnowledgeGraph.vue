<template>
  <view class="graph-container">
    <view class="graph-header">
      <text class="graph-title">西安警务本体关联知识可视化</text>
      <view class="graph-legend">
        <view class="legend-item" v-for="item in legendItems" :key="item.type">
          <view class="legend-dot" :style="{ background: item.color }"></view>
          <text class="legend-text">{{ item.label }}</text>
        </view>
      </view>
    </view>
    
    <view class="graph-filter">
      <view 
        class="filter-item" 
        :class="{ active: selectedRelations.has(relation) }"
        v-for="relation in availableRelations" 
        :key="relation"
        @click="toggleRelation(relation)"
      >
        {{ relation }}
        <text class="relation-count">{{ getRelationCount(relation) }}</text>
      </view>
    </view>
    
    <view class="graph-body">
      <view class="graph-canvas" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
        <view class="svg-container">
          <svg :width="svgWidth" :height="svgHeight" class="graph-svg">
            <defs>
              <marker
                v-for="relation in uniqueRelations"
                :key="relation"
                :id="'arrowhead-' + encodeURIComponent(relation)"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#999" />
              </marker>
            </defs>
            
            <g v-for="link in displayLinks" :key="link.source + '-' + link.target">
              <line
                :x1="getNodePosition(link.source).x"
                :y1="getNodePosition(link.source).y"
                :x2="getNodePosition(link.target).x"
                :y2="getNodePosition(link.target).y"
                stroke="#ddd"
                stroke-width="2"
                :marker-end="'url(#arrowhead-' + encodeURIComponent(link.relation) + ')'"
              />
            </g>
            
            <g 
              v-for="node in displayNodes" 
              :key="node.id" 
              class="graph-node"
              :class="{ 'center-node': isCenterNode(node.id), dragging: draggingNode === node.id }"
              @click="handleNodeClick(node)"
              @mousedown="startDrag(node.id, $event)"
            >
              <circle
                :cx="getNodePosition(node.id).x"
                :cy="getNodePosition(node.id).y"
                :r="getNodeRadius(node.type)"
                :fill="getNodeColor(node.type)"
                stroke="#fff"
                stroke-width="3"
              />
            </g>
          </svg>
        </view>
        
        <view class="node-labels">
          <view
            v-for="node in displayNodes"
            :key="'icon-' + node.id"
            class="node-icon"
            :style="{ left: getNodePosition(node.id).x - getNodeRadius(node.type) * 0.6 + 'px', top: getNodePosition(node.id).y - getNodeRadius(node.type) * 0.6 + 'px', width: getNodeRadius(node.type) * 1.2 + 'px', height: getNodeRadius(node.type) * 1.2 + 'px' }"
          >
            <image :src="getNodeIcon(node.type)" mode="aspectFill" class="icon-img" />
          </view>
          
          <view
            v-for="node in displayNodes"
            :key="'label-' + node.id"
            class="node-label"
            :style="{ left: getNodePosition(node.id).x + 'px', top: getNodePosition(node.id).y + getNodeRadius(node.type) + 12 + 'px' }"
          >
            {{ node.label }}
          </view>
          
          <view 
            v-for="link in displayLinks" 
            :key="'relation-' + link.source + '-' + link.target"
            class="relation-label"
            :style="{ 
              left: (getNodePosition(link.source).x + getNodePosition(link.target).x) / 2 + 'px', 
              top: (getNodePosition(link.source).y + getNodePosition(link.target).y) / 2 - 10 + 'px' 
            }"
          >
            {{ link.relation }}
          </view>
        </view>
      </view>
      
      <view v-if="selectedNode" class="node-detail-panel">
        <view class="panel-header">
          <view class="node-color" :style="{ backgroundColor: selectedNode.color }"></view>
          <text class="panel-title">{{ selectedNode.label }}</text>
          <view class="panel-close" @click="closePanel">✕</view>
        </view>
        <view class="panel-body">
          <view v-for="(prop, index) in selectedNodeProperties" :key="index" class="property-item">
            <text class="property-label">{{ prop.label }}：</text>
            <text class="property-value">{{ prop.value }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <view class="graph-tip">
      <text class="tip-icon">💡</text>
      <text class="tip-text">提示：点击节点可查看详情</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue'
import type { GraphNode, GraphLink } from '@/api/personAnalysis'

const props = defineProps<{
  nodes: GraphNode[]
  links: GraphLink[]
  centerNodeId?: string
}>()

const emit = defineEmits<{
  (e: 'nodeClick', node: GraphNode, properties: Array<{label: string; value: string}>): void
}>()

const selectedNode = ref<GraphNode | null>(null)
const selectedNodeProperties = ref<Array<{label: string; value: string}>>([])

function closePanel() {
  selectedNode.value = null
  selectedNodeProperties.value = []
}

const availableRelations = computed(() => {
  const relationSet = new Set<string>()
  props.links.forEach(link => {
    relationSet.add(link.relation)
  })
  return Array.from(relationSet)
})

const selectedRelations = ref<Set<string>>(new Set())

watch(availableRelations, (newRelations) => {
  newRelations.forEach(rel => {
    selectedRelations.value.add(rel)
  })
}, { immediate: true })

function toggleRelation(relation: string) {
  if (selectedRelations.value.has(relation)) {
    if (selectedRelations.value.size > 1) {
      selectedRelations.value.delete(relation)
    }
  } else {
    selectedRelations.value.add(relation)
  }
}

function getRelationCount(relation: string): number {
  return props.links.filter(link => link.relation === relation).length
}

const legendItems = [
  { type: 'citizen', label: '人', color: '#2196F3' },
  { type: 'case', label: '案件', color: '#F44336' },
  { type: 'police', label: '民警', color: '#4CAF50' },
  { type: 'household', label: '户籍', color: '#FF9800' },
  { type: 'criminal', label: '案底', color: '#9C27B0' }
]

const svgWidth = 650
const svgHeight = 400

const nodePositions = reactive<Record<string, { x: number; y: number }>>({})
const draggingNode = ref<string | null>(null)
const dragOffset = reactive({ x: 0, y: 0 })

const uniqueRelations = computed(() => {
  const relations = new Set<string>()
  props.links.forEach(link => relations.add(link.relation))
  return Array.from(relations)
})

const displayLinks = computed(() => {
  const allLinks = props.links.length > 0 ? props.links : defaultLinks
  return allLinks.filter(link => selectedRelations.value.has(link.relation))
})

const displayNodes = computed(() => {
  const allNodes = props.nodes.length > 0 ? props.nodes : defaultNodes
  const filteredLinks = displayLinks.value
  
  const nodeIds = new Set<string>()
  filteredLinks.forEach(link => {
    nodeIds.add(link.source)
    nodeIds.add(link.target)
  })
  
  return allNodes.filter(node => nodeIds.has(node.id))
})

const defaultNodes: GraphNode[] = [
  { id: 'center', type: 'citizen', label: '王利民', color: '#2196F3', properties: {} },
  { id: 'case1', type: 'case', label: '李盗窃案', color: '#F44336', properties: {} },
  { id: 'case2', type: 'case', label: '张XX伤害案', color: '#F44336', properties: {} },
  { id: 'police1', type: 'police', label: '孙某', color: '#4CAF50', properties: {} },
  { id: 'police2', type: 'police', label: '周某', color: '#4CAF50', properties: {} },
  { id: 'citizen1', type: 'citizen', label: '张某', color: '#2196F3', properties: {} },
  { id: 'citizen2', type: 'citizen', label: '李某', color: '#2196F3', properties: {} },
  { id: 'household1', type: 'household', label: '西安第一看守所', color: '#FF9800', properties: {} },
  { id: 'criminal1', type: 'criminal', label: '小寨东路', color: '#9C27B0', properties: {} }
]

const defaultLinks: GraphLink[] = [
  { source: 'center', target: 'case1', relation: '涉及' },
  { source: 'center', target: 'case2', relation: '涉及' },
  { source: 'police1', target: 'case1', relation: '负责' },
  { source: 'police2', target: 'case2', relation: '负责' },
  { source: 'center', target: 'citizen1', relation: '同伙' },
  { source: 'center', target: 'citizen2', relation: '同伙' },
  { source: 'center', target: 'household1', relation: '同监所' },
  { source: 'center', target: 'criminal1', relation: '户籍' },
  { source: 'citizen1', target: 'case1', relation: '同伙' },
  { source: 'citizen2', target: 'case2', relation: '同伙' }
]

function getCenterNodeId() {
  if (props.centerNodeId) return props.centerNodeId
  if (displayNodes.value.length > 0) {
    const centerCandidate = displayNodes.value.find(n => 
      n.id.startsWith('BJR') || n.type === 'citizen'
    )
    return centerCandidate?.id || displayNodes.value[0]?.id
  }
  return 'center'
}

function isCenterNode(nodeId: string) {
  return nodeId === getCenterNodeId()
}

function initNodePositions() {
  const centerX = svgWidth / 2
  const centerY = svgHeight / 2
  
  const centerNodeId = getCenterNodeId()
  nodePositions[centerNodeId] = { x: centerX, y: centerY }
  
  const nodeList = displayNodes.value.filter(n => n.id !== centerNodeId)
  
  const level1Radius = 100
  const level2Radius = 180
  const level3Radius = 260
  
  const level1Nodes: GraphNode[] = []
  const level2Nodes: GraphNode[] = []
  const level3Nodes: GraphNode[] = []
  
  const level1NodeIds = new Set<string>()
  displayLinks.value.forEach(link => {
    if (link.source === centerNodeId) {
      level1NodeIds.add(link.target)
    }
    if (link.target === centerNodeId) {
      level1NodeIds.add(link.source)
    }
  })
  
  const level2NodeIds = new Set<string>()
  displayLinks.value.forEach(link => {
    if (level1NodeIds.has(link.source)) {
      level2NodeIds.add(link.target)
    }
    if (level1NodeIds.has(link.target)) {
      level2NodeIds.add(link.source)
    }
  })
  level2NodeIds.delete(centerNodeId)
  
  nodeList.forEach(node => {
    if (level1NodeIds.has(node.id)) {
      level1Nodes.push(node)
    } else if (level2NodeIds.has(node.id)) {
      level2Nodes.push(node)
    } else {
      level3Nodes.push(node)
    }
  })
  
  const allNodes = [...level1Nodes, ...level2Nodes, ...level3Nodes]
  
  allNodes.forEach((node, index) => {
    let radius = level1Radius
    if (index >= level1Nodes.length) {
      radius = index >= level1Nodes.length + level2Nodes.length ? level3Radius : level2Radius
    }
    
    const angle = (index * 360 / Math.max(allNodes.length, 6)) * Math.PI / 180
    
    nodePositions[node.id] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    }
  })
}

function getNodePosition(nodeId: string) {
  return nodePositions[nodeId] || { x: svgWidth / 2, y: svgHeight / 2 }
}

function getNodeRadius(type: string) {
  const radii: Record<string, number> = {
    citizen: 32,
    case: 26,
    police: 26,
    household: 24,
    criminal: 24
  }
  return radii[type] || 26
}

function getNodeColor(type: string) {
  const colors: Record<string, string> = {
    citizen: '#2196F3',
    case: '#F44336',
    police: '#4CAF50',
    household: '#FF9800',
    criminal: '#9C27B0'
  }
  return colors[type] || '#9E9E9E'
}

function getNodeIcon(type: string) {
  const icons: Record<string, string> = {
    citizen: '/static/images/graph/人.png',
    case: '/static/images/graph/案件.png',
    police: '/static/images/graph/民警.png',
    household: '/static/images/graph/户籍.png',
    criminal: '/static/images/graph/案底.png'
  }
  return icons[type] || '/static/images/graph/人.png'
}

function handleNodeClick(node: GraphNode) {
  console.log('handleNodeClick called with node:', node)
  
  const propertyLabels: Record<string, Record<string, string>> = {
    citizen: {
      id: '节点ID',
      name: '姓名',
      id_card: '身份证号',
      phone: '联系电话',
      domicile: '户籍地',
      address: '现住址',
      is_key_person: '是否重点人员',
      plate_number: '车牌号',
      data_source: '数据来源',
      BH: '编号',
      XM: '姓名',
      ZJHM: '身份证号',
      LXDH: '联系电话',
      HJXZ: '户籍地',
      XZXZ: '现住址',
      SFZDRY: '是否重点人员',
      CPH_ontology: '车牌号'
    },
    case: {
      case_number: '警情编号',
      content: '报警内容',
      time: '报警时间',
      JJDBH: '警情编号',
      BJNR: '报警内容',
      BJSJ: '报警时间'
    },
    police: {
      police_id: '民警工号',
      name: '姓名',
      role: '职能',
      status: '状态',
      department: '所属单位',
      phone: '联系电话',
      MJGH: '民警工号',
      XM: '姓名',
      ZN_ontology: '职能',
      ZT_ontology: '状态',
      SJDWMC: '所属单位',
      LXDH: '联系电话'
    },
    household: {
      household_id: '户籍编号',
      household_number: '户号',
      address: '户籍地址',
      household_type: '户别'
    },
    criminal: {
      record_id: '记录编号',
      name: '姓名',
      crime_type: '罪名',
      crime_detail: '犯罪事实',
      prison_status: '服刑状态',
      sentence_date: '判决日期',
      sentence_months: '刑期（月）'
    }
  }
  
  const allProperties = node.properties || {}
  
  const properties = Object.entries(allProperties).map(([key, value]) => ({
    label: propertyLabels[node.type]?.[key] || key,
    value: String(value || '-')
  }))
  
  selectedNode.value = node
  selectedNodeProperties.value = properties
  
  emit('nodeClick', node, properties)
  
  uni.showToast({
    title: `点击了: ${node.label}`,
    icon: 'none'
  })
}

function startDrag(nodeId: string, event: MouseEvent) {
  draggingNode.value = nodeId
  const pos = getNodePosition(nodeId)
  dragOffset.x = event.clientX - pos.x
  dragOffset.y = event.clientY - pos.y
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(event: MouseEvent) {
  if (!draggingNode.value) return
  
  const newX = Math.max(30, Math.min(svgWidth - 30, event.clientX - dragOffset.x))
  const newY = Math.max(30, Math.min(svgHeight - 30, event.clientY - dragOffset.y))
  
  nodePositions[draggingNode.value] = { x: newX, y: newY }
}

function stopDrag() {
  draggingNode.value = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

let touchStartPos = { x: 0, y: 0 }

function handleTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  touchStartPos = { x: touch.clientX, y: touch.clientY }
}

function handleTouchMove(e: TouchEvent) {
  if (!draggingNode.value) return
  const touch = e.touches[0]
  
  const newX = Math.max(30, Math.min(svgWidth - 30, touch.clientX - dragOffset.x))
  const newY = Math.max(30, Math.min(svgHeight - 30, touch.clientY - dragOffset.y))
  
  if (draggingNode.value) {
    nodePositions[draggingNode.value] = { x: newX, y: newY }
  }
}

function handleTouchEnd() {
  draggingNode.value = null
}

watch(() => [props.nodes, props.links], () => {
  initNodePositions()
}, { deep: true })

onMounted(() => {
  initNodePositions()
})
</script>

<style lang="scss" scoped>
.graph-container {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.graph-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.graph-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.graph-legend {
  display: flex;
  gap: 20rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}

.legend-text {
  font-size: 22rpx;
  color: #666;
}

.graph-filter {
  display: flex;
  gap: 12rpx;
  margin-bottom: 24rpx;
  overflow-x: auto;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 20rpx;
  background: #F5F5F5;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #666;
  white-space: nowrap;
  cursor: pointer;
  
  &.active {
    background: #1E88E5;
    color: #fff;
    
    .relation-count {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
    }
  }
}

.relation-count {
  min-width: 32rpx;
  height: 32rpx;
  line-height: 32rpx;
  text-align: center;
  background: #E0E0E0;
  border-radius: 16rpx;
  font-size: 20rpx;
  color: #666;
}

.graph-body {
  display: flex;
  gap: 20rpx;
  margin-bottom: 16rpx;
}

.graph-canvas {
  flex: 1;
  position: relative;
  background: #FAFBFC;
  border-radius: 12rpx;
  padding: 20rpx;
  touch-action: none;
}

.svg-container {
  overflow: hidden;
}

.graph-svg {
  display: block;
}

.graph-node {
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover circle {
    filter: drop-shadow(0 0 8rpx rgba(30, 136, 229, 0.5));
  }
  
  &.center-node circle {
    filter: drop-shadow(0 0 12rpx rgba(30, 136, 229, 0.6));
  }
  
  &.dragging circle {
    filter: drop-shadow(0 0 16rpx rgba(30, 136, 229, 0.8));
  }
}

.node-labels {
  position: absolute;
  top: 20rpx;
  left: 20rpx;
  right: 20rpx;
  bottom: 20rpx;
  pointer-events: none;
}

.node-icon {
  position: absolute;
  border-radius: 50%;
  overflow: hidden;
  border: 4rpx solid #fff;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.icon-img {
  width: 100%;
  height: 100%;
}

.node-label {
  position: absolute;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  white-space: nowrap;
}

.relation-label {
  position: absolute;
  transform: translateX(-50%);
  color: #333;
  font-size: 28rpx;
  font-weight: 600;
  white-space: nowrap;
  text-shadow: 0 0 4rpx rgba(255, 255, 255, 0.8);
}

.graph-tip {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.tip-icon {
  font-size: 28rpx;
}

.tip-text {
  font-size: 24rpx;
  color: #999;
}

.node-detail-panel {
  width: 640rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  overflow: hidden;
  flex-shrink: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx;
  background: #F8FAFC;
  border-bottom: 1rpx solid #E8ECF0;
}

.node-color {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
}

.panel-title {
  flex: 1;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.panel-close {
  font-size: 28rpx;
  color: #999;
  cursor: pointer;
  padding: 4rpx;
  
  &:hover {
    color: #666;
  }
}

.panel-body {
  padding: 16rpx 20rpx;
  max-height: 500rpx;
  overflow-y: auto;
}

.property-item {
  display: flex;
  padding: 10rpx 0;
  border-bottom: 1rpx solid #F0F2F5;
  
  &:last-child {
    border-bottom: none;
  }
}

.property-label {
  font-size: 24rpx;
  color: #666;
  flex-shrink: 0;
  min-width: 120rpx;
}

.property-value {
  font-size: 24rpx;
  color: #333;
  flex: 1;
  word-break: break-all;
}
</style>