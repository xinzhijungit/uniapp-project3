# 数据研判 - 警情预警功能开发计划

## 一、需求分析总结

### 1.1 功能模块组成
| 模块 | 功能描述 |
|------|----------|
| **预警管理** | 预警信息的统一展示、多维筛选、详情查看与处置反馈 |
| **预警指标** | 定义预警的基础原子能力，作为预警规则的"原材料" |
| **预警规则** | 组合指标设定触发条件、通知对象及预警等级 |

### 1.2 已确认的业务规则
- 条件组无数量限制，仅支持基础比较符（>、<、=、>=、<=、BETWEEN）
- 通知模板支持变量：`{ruleName}`、`{alertLevel}`、`{triggerTime}`、`{regionName}`
- 预警规则支持实时触发和定时触发两种方式

---

## 二、技术方案

### 2.1 前端页面结构

```
src/pages/
├── warning/                    # 预警管理模块
│   ├── index.vue              # 预警管理列表页
│   ├── detail.vue             # 预警事件详情页
│   ├── indicator/             # 预警指标子模块
│   │   ├── index.vue          # 预警指标列表页
│   │   └── edit.vue           # 新建/编辑预警指标页
│   └── rule/                  # 预警规则子模块
│       ├── index.vue          # 预警规则列表页（卡片式）
│       └── edit.vue           # 新建/编辑预警规则页
```

### 2.2 API层设计

创建文件：`src/api/warning.ts`

#### 2.2.1 预警事件API
| 方法名 | 功能 | 接口地址 |
|--------|------|----------|
| `getWarningEvents` | 获取预警事件列表 | GET /api/v1/warning/events |
| `getWarningEventDetail` | 获取预警事件详情 | GET /api/v1/warning/events/:eventNo |
| `feedbackWarningEvent` | 反馈预警处置结果 | PUT /api/v1/warning/events/:eventNo/feedback |
| `getWarningStatistics` | 获取预警统计数据 | GET /api/v1/warning/events/statistics |

#### 2.2.2 预警指标API
| 方法名 | 功能 | 接口地址 |
|--------|------|----------|
| `getIndicatorList` | 获取预警指标列表 | GET /api/v1/warning/indicators |
| `getIndicatorDetail` | 获取预警指标详情 | GET /api/v1/warning/indicators/:id |
| `createIndicator` | 创建预警指标 | POST /api/v1/warning/indicators |
| `updateIndicator` | 更新预警指标 | PUT /api/v1/warning/indicators/:id |
| `deleteIndicator` | 删除预警指标 | DELETE /api/v1/warning/indicators/:id |
| `toggleIndicatorStatus` | 启用/停用预警指标 | PUT /api/v1/warning/indicators/:id/status |
| `getIndicatorSelect` | 获取可选指标列表 | GET /api/v1/warning/indicators/select |

#### 2.2.3 预警规则API
| 方法名 | 功能 | 接口地址 |
|--------|------|----------|
| `getRuleList` | 获取预警规则列表 | GET /api/v1/warning/rules |
| `getRuleDetail` | 获取预警规则详情 | GET /api/v1/warning/rules/:id |
| `createRule` | 创建预警规则 | POST /api/v1/warning/rules |
| `updateRule` | 更新预警规则 | PUT /api/v1/warning/rules/:id |
| `deleteRule` | 删除预警规则 | DELETE /api/v1/warning/rules/:id |
| `toggleRuleStatus` | 启用/停用预警规则 | PUT /api/v1/warning/rules/:id/status |
| `getRuleEvents` | 获取规则关联的预警事件 | GET /api/v1/warning/rules/:id/events |

### 2.3 路由配置

更新文件：`src/pages.json`

```json
{
  "pages": [
    // ... 现有页面
    {
      "path": "pages/warning/index",
      "style": { "navigationStyle": "custom", "navigationBarTitleText": "预警管理" }
    },
    {
      "path": "pages/warning/detail",
      "style": { "navigationStyle": "custom", "navigationBarTitleText": "预警详情" }
    },
    {
      "path": "pages/warning/indicator/index",
      "style": { "navigationStyle": "custom", "navigationBarTitleText": "预警指标" }
    },
    {
      "path": "pages/warning/indicator/edit",
      "style": { "navigationStyle": "custom", "navigationBarTitleText": "编辑指标" }
    },
    {
      "path": "pages/warning/rule/index",
      "style": { "navigationStyle": "custom", "navigationBarTitleText": "预警规则" }
    },
    {
      "path": "pages/warning/rule/edit",
      "style": { "navigationStyle": "custom", "navigationBarTitleText": "编辑规则" }
    }
  ]
}
```

### 2.4 菜单集成

更新文件：`src/components/SideMenu.vue`

```javascript
{
  id: 'data-analysis',
  name: '数据研判',
  icon: '📊',
  children: [
    { id: 'warning-management', name: '预警管理', badge: '' },
    { id: 'warning-indicator', name: '预警指标', badge: '' },
    { id: 'warning-rule', name: '预警规则', badge: '' }
  ]
}
```

---

## 三、开发任务清单

### 3.1 任务分解

| 序号 | 任务名称 | 描述 | 依赖 | 预估工时 |
|------|----------|------|------|----------|
| 1 | 创建API层 | 创建warning.ts，实现所有预警相关API调用 | 无 | 2小时 |
| 2 | 配置路由 | 更新pages.json添加新页面路由 | 无 | 0.5小时 |
| 3 | 更新侧边栏菜单 | 更新SideMenu.vue添加数据研判子菜单 | 路由配置 | 0.5小时 |
| 4 | 预警管理列表页 | 实现统计看板、筛选区、数据列表 | API层 | 4小时 |
| 5 | 预警事件详情页 | 实现详情展示和处置反馈功能 | API层 | 4小时 |
| 6 | 预警指标列表页 | 实现指标列表、启用/停用、编辑/删除 | API层 | 3小时 |
| 7 | 预警指标编辑页 | 实现指标创建和编辑表单 | 指标列表页 | 3小时 |
| 8 | 预警规则列表页 | 实现卡片式规则列表展示 | API层 | 3小时 |
| 9 | 预警规则编辑页 | 实现规则配置表单（条件组、通知配置） | 规则列表页 | 5小时 |
| 10 | 测试与联调 | 整体功能测试和接口联调 | 所有页面 | 4小时 |

### 3.2 任务流程图

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: 基础准备                                          │
├─────────────────────────────────────────────────────────────┤
│  [1] 创建API层 ──► [2] 配置路由 ──► [3] 更新侧边栏菜单       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: 预警管理模块开发                                   │
├─────────────────────────────────────────────────────────────┤
│  [4] 预警管理列表页 ──► [5] 预警事件详情页                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 3: 预警指标模块开发                                   │
├─────────────────────────────────────────────────────────────┤
│  [6] 预警指标列表页 ──► [7] 预警指标编辑页                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 4: 预警规则模块开发                                   │
├─────────────────────────────────────────────────────────────┤
│  [8] 预警规则列表页 ──► [9] 预警规则编辑页                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 5: 测试与联调                                        │
├─────────────────────────────────────────────────────────────┤
│  [10] 整体功能测试和接口联调                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 四、数据库表依赖

| 表名 | 用途 | 对应模块 |
|------|------|----------|
| `warning_event` | 预警事件记录 | 预警管理 |
| `warning_event_related_incident` | 预警事件关联接警单 | 预警管理 |
| `warning_indicator` | 预警指标配置 | 预警指标 |
| `warning_tag` | 标签字典 | 预警指标 |
| `warning_indicator_tag_rel` | 指标标签关联 | 预警指标 |
| `warning_rule` | 预警规则配置 | 预警规则 |
| `warning_rule_condition` | 规则条件配置 | 预警规则 |
| `warning_rule_notification_object` | 通知对象配置 | 预警规则 |
| `jjd_jjd` | 接警单数据 | 预警详情 |

---

## 五、风险与注意事项

### 5.1 技术风险
| 风险 | 描述 | 应对措施 |
|------|------|----------|
| SQL注入 | SQL类型指标可能存在注入风险 | 后端严格校验，前端禁用危险字符输入 |
| 性能问题 | 大量预警事件查询可能较慢 | 后端添加索引，前端分页优化 |
| 权限控制 | 用户只能查看权限范围内数据 | 后端按部门/辖区进行数据过滤 |

### 5.2 业务约束
- 预警指标停用前需校验是否被规则引用
- 预警规则删除前需确认无关联预警事件
- 已触发的规则关键字段不可修改

---

## 六、交付物清单

| 交付物 | 状态 | 说明 |
|--------|------|------|
| API接口文档 | ✅ 已完成 | docs/API.md 已更新 |
| API层代码 | 待开发 | src/api/warning.ts |
| 路由配置 | 待开发 | src/pages.json |
| 菜单配置 | 待开发 | src/components/SideMenu.vue |
| 预警管理列表页 | 待开发 | src/pages/warning/index.vue |
| 预警事件详情页 | 待开发 | src/pages/warning/detail.vue |
| 预警指标列表页 | 待开发 | src/pages/warning/indicator/index.vue |
| 预警指标编辑页 | 待开发 | src/pages/warning/indicator/edit.vue |
| 预警规则列表页 | 待开发 | src/pages/warning/rule/index.vue |
| 预警规则编辑页 | 待开发 | src/pages/warning/rule/edit.vue |

---

## 七、参考文档

1. 产品需求文档：`数据研判 - 警情预警功能产品需求文档.md`
2. API接口文档：`docs/API.md`
3. 原型图：
   - 预警管理列表：`原型图：1预警管理列表.png`
   - 预警详情：`原型图：1预警管理-查看预警详情1.png`、`原型图：1预警管理-查看预警详情2.png`
   - 预警指标列表：`原型图：2预警指标列表.png`
   - 预警指标配置：`原型图：2预警指标配置.png`
   - 预警规则列表：`原型图：3预警规则列表.png`
   - 预警规则配置：`原型图：3预警规则配置页面1.png`、`原型图：3预警规则配置页面2.png`