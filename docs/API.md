# API 接口文档

## 接口规范

* 所有数据通过数据库获取

* 接口地址：<http://localhost:3000/api/v1>

* 请求格式：JSON

* 响应格式：JSON

***

## 接口列表

### 1. 配置管理接口

#### 1.1 获取配置列表

**接口地址：** `/api/v1/config`

**请求方式：** GET

**访问数据库表：**

* XAGA\_config（系统配置表）

***

#### 1.2 获取单个配置

**接口地址：** `/api/v1/config/:key`

**请求方式：** GET

**访问数据库表：**

* XAGA\_config（系统配置表）

***

#### 1.3 更新配置

**接口地址：** `/api/v1/config/:key`

**请求方式：** PUT

**访问数据库表：**

* XAGA\_config（系统配置表）

**请求参数：**

```json
{
  "CONFIG_VALUE": "string (配置值)",
  "CONFIG_DESC": "string (可选，配置描述)"
}
```

***

### 2. 人联研判检索接口

**接口地址：** `/api/v1/search/entity`

**请求方式：** POST

**访问数据库表：**

* FKD\_BJR（报警人信息表）

* JJD\_JJD（接警单表）

* JQ\_SMSJ\_ontology（警情涉及市民关系表）

* JQ\_MJFZ\_ontology（民警负责警情关系表）

* MJ\_XX\_ontology（民警信息表）

* criminal\_record\_db（前科记录数据库）

**请求参数：**

```json
{
  "idCard": "string (可选，身份证号)",
  "plateNumber": "string (可选，车牌号)",
  "caseNumber": "string (可选，警情编号)",
  "phoneNumber": "string (可选，手机号)"
}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "personInfo": {...},
    "riskScore": 92,
    "riskTags": ["高危人员", "重点人员"],
    "riskDetails": [...],
    "graphData": { "nodes": [...], "links": [...] }
  }
}
```

***

### 3. 知识图谱查询接口

**接口地址：** `/api/v1/graph/query`

**请求方式：** POST

**访问数据库表：**

* FKD\_BJR（报警人信息表）

* JJD\_JJD（接警单表）

* JQ\_SMSJ\_ontology（警情涉及市民关系表）

* JQ\_MJFZ\_ontology（民警负责警情关系表）

* MJ\_XX\_ontology（民警信息表）

**请求参数：**

```json
{
  "entityId": "string (实体唯一标识)",
  "entityType": "string (实体类型: citizen/case)",
  "maxDepth": "int (可选，默认3)",
  "maxNodes": "int (可选，默认50)",
  "cnFields": "boolean (可选，是否返回中文字段名)"
}
```

***

#### 3.1 图谱数据重新生成

**接口地址：** `/api/v1/graph/regenerate`

**请求方式：** POST

**访问数据库表：**

* FKD\_BJR（报警人信息表）

* 相关图谱数据表

**请求参数：**

```json
{
  "entityId": "string (实体唯一标识)",
  "entityType": "string (实体类型: citizen/case)"
}
```

***

### 4. 标签管理接口

#### 4.1 获取标签列表

**接口地址：** `/api/v1/tags`

**请求方式：** GET

**访问数据库表：**

* TAG\_CONFIG\_ontology（标签配置表）

**请求参数：**

* page: 页码（默认1）

* size: 每页数量（默认20）

* targetType: 适用对象类型（CITIZEN/CASE/VEHICLE/PHONE）

* status: 状态筛选（0-禁用，1-启用）

* keyword: 搜索关键词

***

#### 4.2 创建标签

**接口地址：** `/api/v1/tags`

**请求方式：** POST

**访问数据库表：**

* TAG\_CONFIG\_ontology（标签配置表）

**请求参数：**

```json
{
  "TAG_CODE": "string (标签编码)",
  "TAG_NAME": "string (标签名称)",
  "PRIORITY": "int (1-低, 2-中, 3-高优先级)",
  "TARGET_TYPE": "string (适用对象类型)",
  "CATEGORY": "string (分类: 人员标签/警情标签)",
  "STATUS": "int (0-禁用, 1-启用)",
  "DESCRIPTION": "string (标签描述)",
  "PROMPT_TEMPLATE": "string (提示词模板)"
}
```

***

#### 4.3 更新标签

**接口地址：** `/api/v1/tags/:tagCode`

**请求方式：** PUT

**访问数据库表：**

* TAG\_CONFIG\_ontology（标签配置表）

**请求参数：** 同创建标签（TAG\_CODE不可修改）

***

#### 4.4 删除标签

**接口地址：** `/api/v1/tags/:tagCode`

**请求方式：** DELETE

**访问数据库表：**

* TAG\_CONFIG\_ontology（标签配置表）

* TAG\_EXAMPLE\_ontology（标签示例表）

***

#### 4.5 标签统计

**接口地址：** `/api/v1/tags/statistics`

**请求方式：** GET

**访问数据库表：**

* TAG\_CONFIG\_ontology（标签配置表）

**响应示例：**

```json
{
  "code": 200,
  "data": {
    "total": 10,
    "enabled": 8,
    "disabled": 2,
    "rules": 5
  }
}
```

***

#### 4.6 获取标签详情

**接口地址：** `/api/v1/tags/:tagCode`

**请求方式：** GET

**访问数据库表：**

* TAG\_CONFIG\_ontology（标签配置表）

***

#### 4.7 获取标签示例列表

**接口地址：** `/api/v1/tags/:tagCode/examples`

**请求方式：** GET

**访问数据库表：**

* TAG\_EXAMPLE\_ontology（标签示例表）

**请求参数：**

* page: 页码（默认1）

* size: 每页数量（默认10）

***

#### 4.8 添加标签示例

**接口地址：** `/api/v1/tags/:tagCode/examples`

**请求方式：** POST

**访问数据库表：**

* TAG\_EXAMPLE\_ontology（标签示例表）

**请求参数：**

```json
{
  "ENTITY_KEY": "string (实体主键)",
  "ENTITY_TYPE": "string (实体类型)",
  "GRAPH_DATA": "json (图谱数据)",
  "AI_SUMMARY": "string (AI总结描述)",
  "TEST_RESULT": "string (测试结果: 是/否)"
}
```

***

#### 4.9 删除标签示例

**接口地址：** `/api/v1/tags/:tagCode/examples/:exampleId`

**请求方式：** DELETE

**访问数据库表：**

* TAG\_EXAMPLE\_ontology（标签示例表）

***

#### 4.10 测试标签

**接口地址：** `/api/v1/tags/:tagCode/test`

**请求方式：** POST

**访问数据库表：**

* TAG\_CONFIG\_ontology（标签配置表）

* TAG\_EXAMPLE\_ontology（标签示例表）

* FKD\_BJR / JJD\_JJD（实体表）

* criminal\_record\_db（前科记录）

**说明：** 从数据库随机获取一条未测试过的实体进行标签测试

**响应示例：**

```json
{
  "code": 200,
  "data": {
    "entityKey": "BJR20260500001",
    "aiSummary": "人员本体描述文本...",
    "testResult": "是",
    "promptUsed": "使用的提示词内容..."
  }
}
```

***

#### 4.11 批量测试标签

**接口地址：** `/api/v1/tags/:tagCode/batch-test`

**请求方式：** POST

**访问数据库表：**

* TAG\_CONFIG\_ontology（标签配置表）

* TAG\_EXAMPLE\_ontology（标签示例表）

* FKD\_BJR / JJD\_JJD（实体表）

* FKD\_BJR.AI\_TAG\_ontology（人员智能标签字段）

* JJD\_JJD.AI\_TAG\_ontology（警情智能标签字段）

**请求参数：**

```json
{
  "mode": "string (可选，examples/full，默认examples)",
  "count": "int (可选，测试条数，默认5)"
}
```

**说明：** 批量测试标签并将结果插入示例表，测试结果为"是"的实体将标签编码写入AI\_TAG\_ontology字段

***

#### 4.12 自动标签接口

**接口地址：** `/api/v1/tags/auto-label`

**请求方式：** POST

**访问数据库表：**

* TAG\_CONFIG\_ontology（标签配置表）

* TAG\_EXAMPLE\_ontology（标签示例表）

* FKD\_BJR（报警人表）

* JJD\_JJD（接警单表）

**请求参数：**

```json
{
  "entityType": "string (citizen/case)",
  "entityId": "string (可选，指定实体ID，不指定则处理全部)"
}
```

***

#### 4.13 按实体类型自动标签

**接口地址：** `/api/v1/tags/auto-label/:entityType`

**请求方式：** POST

**访问数据库表：**

* TAG\_CONFIG\_ontology（标签配置表）

* FKD\_BJR / JJD\_JJD（实体表）

***

### 5. 预警事件管理接口

#### 5.1 获取预警事件列表

**接口地址：** `/api/v1/warning/events`

**请求方式：** GET

**访问数据库表：**

* warning\_event（预警事件表）

**请求参数（Query）：**

| 参数名        | 类型     | 必填 | 说明                                       |
| ---------- | ------ | -- | ---------------------------------------- |
| page       | int    | 否  | 页码，默认1                                   |
| size       | int    | 否  | 每页数量，默认20                                |
| timeRange  | string | 否  | 时间范围：近7天/近30天/自定义                        |
| startTime  | string | 否  | 开始时间（ISO格式）                              |
| endTime    | string | 否  | 结束时间（ISO格式）                              |
| alertLevel | string | 否  | 预警等级：RED/ORANGE/YELLOW                   |
| status     | string | 否  | 处理状态：PENDING/PROCESSING/ADOPTED/REJECTED |
| keyword    | string | 否  | 案件名称/编号模糊搜索                              |

**响应示例：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "eventNo": "YJ-2026-0421-0001",
        "ruleId": 1,
        "ruleName": "疑似电信网络诈骗高风险预警",
        "alertLevel": "RED",
        "alertLevelName": "红色特急",
        "triggerTime": "2026-04-21 09:15:00",
        "regionName": "西安市雁塔区电子城街道XX小区",
        "status": "PENDING",
        "statusName": "待处置",
        "disposalDeptName": "雁塔分局",
        "isAdopted": null
      }
    ],
    "total": 892,
    "page": 1,
    "size": 20
  }
}
```

***

#### 5.2 获取预警事件详情

**接口地址：** `/api/v1/warning/events/:eventNo`

**请求方式：** GET

**访问数据库表：**

* warning\_event（预警事件表）

* warning\_event\_related\_incident（预警事件关联接警单表）

* jjd\_jjd（接警单表）

**响应示例：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "eventNo": "YJ-2026-0421-0001",
    "ruleId": 1,
    "ruleName": "疑似电信网络诈骗高风险预警",
    "alertLevel": "RED",
    "alertLevelName": "红色特急",
    "triggerTime": "2026-04-21 09:15:00",
    "notifyTime": "2026-04-21 09:15:00",
    "notifyObject": "雁塔分局",
    "notifyChannel": "STATION_LETTER",
    "regionName": "西安市雁塔区电子城街道XX小区",
    "aiAnalysisSuggestion": "建议指挥中心通报五类诈骗手法...",
    "triggerBasis": "自2026年4月21日9时15分触发预警前3天以内...",
    "status": "PENDING",
    "statusName": "待处置",
    "disposalDeptName": "雁塔分局",
    "isAdopted": null,
    "adoptTime": null,
    "disposalContent": null,
    "relatedIncidents": [
      {
        "jjdbh": "GX20260512001",
        "bjnr": "电子城街道XX小区居民李某某接到自称...",
        "bjlxdm": "违规诈骗",
        "involvedAmount": "2.8万元",
        "disposalStatus": "已派发",
        "urgencyLevel": "非常紧急"
      }
    ]
  }
}
```

***

#### 5.3 反馈预警处置结果

**接口地址：** `/api/v1/warning/events/:eventNo/feedback`

**请求方式：** PUT

**访问数据库表：**

* warning\_event（预警事件表）

**请求参数：**

```json
{
  "isAdopted": 1,
  "adoptTime": "2026-04-21 10:30:00",
  "disposalContent": "已安排民警上门走访，加强反诈宣传..."
}
```

| 字段名             | 类型     | 必填 | 说明              |
| --------------- | ------ | -- | --------------- |
| isAdopted       | int    | 是  | 是否采纳：1-采纳，0-不采纳 |
| adoptTime       | string | 否  | 采纳时间，默认当前时间     |
| disposalContent | string | 是  | 处置结果说明          |

***

#### 5.4 获取预警统计数据

**接口地址：** `/api/v1/warning/events/statistics`

**请求方式：** GET

**访问数据库表：**

* warning\_event（预警事件表）

**响应示例：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalCount": 892,
    "pendingCount": 10,
    "adoptedCount": 856,
    "rejectedCount": 36,
    "trendData": [
      { "date": "04-15", "count": 45 },
      { "date": "04-16", "count": 52 },
      { "date": "04-17", "count": 38 }
    ]
  }
}
```

***

### 6. 预警指标管理接口

#### 6.1 获取预警指标列表

**接口地址：** `/api/v1/warning/indicators`

**请求方式：** GET

**访问数据库表：**

* warning\_indicator（预警指标表）

* warning\_indicator\_tag\_rel（预警指标标签关联表）

* warning\_tag（预警标签字典表）

**请求参数（Query）：**

| 参数名     | 类型     | 必填 | 说明             |
| ------- | ------ | -- | -------------- |
| page    | int    | 否  | 页码，默认1         |
| size    | int    | 否  | 每页数量，默认20      |
| keyword | string | 否  | 指标名称/说明模糊搜索    |
| tag     | string | 否  | 标签筛选           |
| enabled | int    | 否  | 状态筛选：1-启用，0-停用 |

**响应示例：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "indicatorName": "同一地址不同描述归一化匹配异常",
        "indicatorDesc": "同地异名警情汇聚，防漏防重。",
        "configType": "SQL",
        "configTypeName": "SQL",
        "indicatorTags": ["标签分类"],
        "enabled": 1,
        "createBy": "张果果",
        "createTime": "2026-04-01 10:00:00",
        "updateTime": "2026-04-01 10:00:00"
      }
    ],
    "total": 789,
    "page": 1,
    "size": 20
  }
}
```

***

#### 6.2 获取预警指标详情

**接口地址：** `/api/v1/warning/indicators/:id`

**请求方式：** GET

**访问数据库表：**

* warning\_indicator（预警指标表）

**响应示例：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "indicatorName": "同一地址不同描述归一化匹配异常",
    "indicatorDesc": "同地异名警情汇聚，防漏防重。",
    "configType": "SQL",
    "sqlContent": "SELECT NORM_ADDR AS 归一化地址...",
    "indicatorTags": ["标签分类"],
    "enabled": 1,
    "createBy": "张果果",
    "createTime": "2026-04-01 10:00:00"
  }
}
```

***

#### 6.3 创建预警指标

**接口地址：** `/api/v1/warning/indicators`

**请求方式：** POST

**访问数据库表：**

* warning\_indicator（预警指标表）

* warning\_tag（预警标签字典表）

* warning\_indicator\_tag\_rel（预警指标标签关联表）

**请求参数：**

```json
{
  "indicatorName": "string (指标名称，100字符以内)",
  "indicatorDesc": "string (指标说明，500字符以内)",
  "configType": "string (SQL/CUSTOM_CALC/AGENT)",
  "sqlContent": "string (SQL类型时必填，SQL查询语句)",
  "indicatorTags": ["string (标签列表)"]
}
```

***

#### 6.4 更新预警指标

**接口地址：** `/api/v1/warning/indicators/:id`

**请求方式：** PUT

**访问数据库表：**

* warning\_indicator（预警指标表）

* warning\_tag（预警标签字典表）

* warning\_indicator\_tag\_rel（预警指标标签关联表）

**请求参数：** 同创建（id不可修改）

***

#### 6.5 删除预警指标

**接口地址：** `/api/v1/warning/indicators/:id`

**请求方式：** DELETE

**访问数据库表：**

* warning\_indicator（预警指标表）

**注意：** 删除前需校验是否被预警规则引用，若被引用则返回错误。

***

#### 6.6 启用/停用预警指标

**接口地址：** `/api/v1/warning/indicators/:id/status`

**请求方式：** PUT

**访问数据库表：**

* warning\_indicator（预警指标表）

**请求参数：**

```json
{
  "enabled": 1
}
```

***

### 7. 预警规则管理接口

#### 7.1 获取预警规则列表

**接口地址：** `/api/v1/warning/rules`

**请求方式：** GET

**访问数据库表：**

* warning\_rule（预警规则表）

* warning\_rule\_notification\_object（预警规则通知对象表）

**请求参数（Query）：**

| 参数名        | 类型     | 必填 | 说明        |
| ---------- | ------ | -- | --------- |
| page       | int    | 否  | 页码，默认1    |
| size       | int    | 否  | 每页数量，默认20 |
| ruleName   | string | 否  | 规则名称模糊搜索  |
| enabled    | int    | 否  | 状态筛选      |
| category   | string | 否  | 规则分类      |
| alertLevel | string | 否  | 预警等级      |

**响应示例：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "ruleName": "同一警情类型激增预警",
        "ruleDesc": "同一警情类型（如违规诈骗）在短时间内激增",
        "category": "异常聚集",
        "alertLevel": "RED",
        "alertLevelName": "红色特急",
        "startTime": "2026-04-01 00:00:00",
        "endTime": null,
        "notificationChannels": ["STATION_LETTER"],
        "notifyFrequencyType": "REALTIME",
        "enabled": 1,
        "triggerCount": 156,
        "createBy": "刘尚",
        "createTime": "2026-04-01 10:00:00",
        "notificationObjects": [
          { "objectType": "DEPT", "objectName": "雁塔分局" }
        ]
      }
    ],
    "total": 50,
    "page": 1,
    "size": 20
  }
}
```

***

#### 7.2 获取预警规则详情

**接口地址：** `/api/v1/warning/rules/:id`

**请求方式：** GET

**访问数据库表：**

* warning\_rule（预警规则表）

* warning\_rule\_condition（预警规则条件表）

* warning\_rule\_notification\_object（预警规则通知对象表）

* warning\_indicator（预警指标表）

**响应示例：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "ruleName": "同一警情类型激增预警",
    "ruleDesc": "同一警情类型在短时间内激增",
    "category": "异常聚集",
    "alertLevel": "RED",
    "startTime": "2026-04-01 00:00:00",
    "endTime": null,
    "notificationChannels": ["STATION_LETTER", "SMS"],
    "associatedPlatform": "110报警服务台",
    "notifyFrequencyType": "REALTIME",
    "notifyCronExpr": null,
    "notifyTemplate": "【{ruleName}】触发{alertLevel}预警，请及时处置。",
    "enabled": 1,
    "createBy": "刘尚",
    "createTime": "2026-04-01 10:00:00",
    "conditions": [
      {
        "id": 1,
        "groupIndex": 1,
        "indicatorId": 1,
        "indicatorName": "短时警情激增指数",
        "operator": ">",
        "thresholdSingle": "5"
      }
    ],
    "notificationObjects": [
      { "objectType": "DEPT", "objectCode": "DEPT001", "objectName": "雁塔分局" }
    ]
  }
}
```

***

#### 7.3 创建预警规则

**接口地址：** `/api/v1/warning/rules`

**请求方式：** POST

**访问数据库表：**

* warning\_rule（预警规则表）

* warning\_rule\_condition（预警规则条件表）

* warning\_rule\_notification\_object（预警规则通知对象表）

**请求参数：**

```json
{
  "ruleName": "string (规则名称)",
  "ruleDesc": "string (规则描述，1000字符以内)",
  "category": "string (规则分类)",
  "alertLevel": "string (RED/ORANGE/YELLOW)",
  "startTime": "string (生效开始时间，ISO格式)",
  "endTime": "string (生效结束时间，可选)",
  "notificationChannels": ["string (通知渠道: STATION_LETTER/SMS)"],
  "associatedPlatform": "string (关联平台，默认110报警服务台)",
  "notifyFrequencyType": "string (REALTIME/TIMED)",
  "notifyCronExpr": "string (定时触发时的cron表达式)",
  "notifyTemplate": "string (通知模板)",
  "conditions": [
    {
      "groupIndex": 1,
      "indicatorId": 1,
      "operator": ">",
      "thresholdSingle": "5"
    }
  ],
  "notificationObjects": [
    {
      "objectType": "DEPT",
      "objectCode": "DEPT001",
      "objectName": "雁塔分局"
    }
  ]
}
```

***

#### 7.4 更新预警规则

**接口地址：** `/api/v1/warning/rules/:id`

**请求方式：** PUT

**访问数据库表：**

* warning\_rule（预警规则表）

* warning\_rule\_condition（预警规则条件表）

* warning\_rule\_notification\_object（预警规则通知对象表）

**请求参数：** 同创建（id不可修改，已触发的规则关键字段不可修改）

***

#### 7.5 删除预警规则

**接口地址：** `/api/v1/warning/rules/:id`

**请求方式：** DELETE

**访问数据库表：**

* warning\_rule（预警规则表）

***

#### 7.6 启用/停用预警规则

**接口地址：** `/api/v1/warning/rules/:id/status`

**请求方式：** PUT

**访问数据库表：**

* warning\_rule（预警规则表）

**请求参数：**

```json
{
  "enabled": 1
}
```

***

#### 7.7 获取规则关联的预警事件

**接口地址：** `/api/v1/warning/rules/:id/events`

**请求方式：** GET

**访问数据库表：**

* warning\_event（预警事件表）

**请求参数（Query）：**

| 参数名  | 类型  | 必填 | 说明        |
| ---- | --- | -- | --------- |
| page | int | 否  | 页码，默认1    |
| size | int | 否  | 每页数量，默认20 |

***

#### 7.8 获取可选指标列表（用于条件配置）

**接口地址：** `/api/v1/warning/indicators/select`

**请求方式：** GET

**访问数据库表：**

* warning\_indicator（预警指标表）

**响应示例：**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    { "id": 1, "indicatorName": "短时警情激增指数" },
    { "id": 2, "indicatorName": "高危警情高发区域聚类" }
  ]
}
```

***

## 数据库连接信息

* 主机：mysql.sqlpub.com

* 端口：3306

* 数据库：dify\_test\_peter

* 用户：peter\_xin

***

## 响应格式说明

### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 失败响应

```json
{
  "code": 500,
  "message": "错误描述",
  "detail": "详细错误信息"
}
```

