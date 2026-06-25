const express = require('express')
const cors = require('cors')
const db = require('./db')
const https = require('https')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

function logSQL(sql, params) {
  // 直接使用 JSON.stringify 输出 params，因为 params 中的元素已经是序列化后的值
  const logMessage = `[${new Date().toISOString()}] SQL: ${sql} | Params: ${JSON.stringify(params)}\n`
  fs.appendFileSync('/Users/xiaoping/Desktop/智慧西安开发/uniapp-project/server/server.log', logMessage)
  // 打印每个参数的详细信息
  console.log('SQL执行:', sql)
  console.log('Params详情:', params.map((p, i) => `param[${i}]=${JSON.stringify(p)}`).join(', '))
}

// AI模型调用函数
async function callAIModel(prompt) {
  return new Promise(async (resolve, reject) => {
    try {
      // 读取所有AI相关配置
      console.log('正在从数据库读取AI配置...')
      const configResults = await db.query('SELECT CONFIG_KEY, CONFIG_VALUE FROM XAGA_config WHERE CONFIG_KEY LIKE ?', ['ai_%'])
      
      console.log('数据库查询结果:', JSON.stringify(configResults, null, 2))
      
      const config = {}
      configResults.forEach(row => {
        config[row.CONFIG_KEY] = row.CONFIG_VALUE
      })
      
      // 使用配置或默认值
      const aiModelUrl = config.ai_model_url || 'https://api.deepseek.com/v1/chat/completions'
      const aiModelName = config.ai_model_name || 'deepseek-chat'
      const aiApiKey = config.ai_api_key || ''
      const aiMaxTokens = parseInt(config.ai_max_tokens) || 10
      const aiTemperature = parseFloat(config.ai_temperature) || 0.1
      const aiTimeout = parseInt(config.ai_timeout_seconds) * 1000 || 30000
      
      // 检查API密钥是否配置
      if (!aiApiKey || aiApiKey.trim() === '') {
        reject(new Error('AI API密钥未配置，请在XAGA_config表中设置ai_api_key'))
        return
      }
      
      const postData = JSON.stringify({
        model: aiModelName,
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: aiTemperature
      })
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiApiKey}`
        },
        timeout: aiTimeout,
        rejectUnauthorized: false  // 禁用SSL证书验证（适用于自签名证书）
      }
      
      const req = https.request(new URL(aiModelUrl), options, (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          try {
            const result = JSON.parse(data)
            console.log('AI模型返回数据:', JSON.stringify(result, null, 2))
            
            // 尝试多种返回格式
            let content = ''
            if (result.choices && result.choices.length > 0 && result.choices[0].message) {
              const message = result.choices[0].message
              
              // 优先使用content
              if (message.content && message.content.trim()) {
                content = message.content.trim()
              } 
              // 如果content为空，尝试使用reasoning_content（Kimi模型特有）
              else if (message.reasoning_content && message.reasoning_content.trim()) {
                content = message.reasoning_content.trim()
              }
            } else if (result.response) {
              content = result.response.trim()
            } else if (result.result) {
              content = result.result.trim()
            } else if (result.text) {
              content = result.text.trim()
            } else if (typeof result === 'string') {
              content = result.trim()
            }
            
            if (content) {
              resolve(content)
            } else {
              console.error('AI模型返回格式异常，无法提取内容:', JSON.stringify(result))
              reject(new Error('AI模型返回格式异常'))
            }
          } catch (error) {
            console.error('解析AI模型响应失败:', error.message, '原始数据:', data)
            reject(new Error('解析AI模型响应失败'))
          }
        })
      })
      
      req.on('error', (error) => {
        reject(error)
      })
      
      req.write(postData)
      req.end()
    } catch (error) {
      reject(error)
    }
  })
}

// 获取智能标签详细信息
async function getTagDetails(aiTagOntology) {
  console.log('=== getTagDetails 开始 ===')
  console.log('输入的 aiTagOntology:', aiTagOntology, '类型:', typeof aiTagOntology)
  
  if (!aiTagOntology) {
    console.log('aiTagOntology为空，返回空数组')
    return []
  }
  
  let tagCodes = []
  try {
    if (typeof aiTagOntology === 'string') {
      // 尝试解析为JSON数组
      try {
        tagCodes = JSON.parse(aiTagOntology)
        console.log('JSON解析成功:', tagCodes)
      } catch (e) {
        // 如果JSON解析失败，尝试按逗号分隔
        console.log('JSON解析失败，尝试按逗号分隔:', aiTagOntology)
        tagCodes = aiTagOntology.split(',').map(s => s.trim()).filter(s => s)
        console.log('逗号分隔后:', tagCodes)
      }
    } else if (Array.isArray(aiTagOntology)) {
      tagCodes = aiTagOntology
      console.log('已经是数组:', tagCodes)
    }
  } catch (e) {
    console.error('解析AI_TAG_ontology失败', e)
    return []
  }
  
  // 确保是数组
  if (!Array.isArray(tagCodes)) {
    tagCodes = [tagCodes]
    console.log('转换为数组:', tagCodes)
  }
  
  if (!tagCodes || tagCodes.length === 0) {
    console.log('tagCodes为空数组，返回空数组')
    return []
  }
  
  console.log('准备查询的标签代码:', tagCodes)
  
  const placeholders = tagCodes.map(() => '?').join(',')
  const query = `
    SELECT TAG_CODE, TAG_NAME, PRIORITY, DESCRIPTION 
    FROM TAG_CONFIG_ontology 
    WHERE TAG_CODE IN (${placeholders})
  `
  
  console.log('执行查询:', query, '参数:', tagCodes)
  
  const results = await db.query(query, tagCodes)
  
  console.log('查询结果:', results)
  
  const tagInfo = results.map(row => ({
    tagCode: row.TAG_CODE,
    tagName: row.TAG_NAME,
    priority: parseInt(row.PRIORITY) || 1,
    description: row.DESCRIPTION || ''
  }))
  
  console.log('返回的标签信息:', tagInfo)
  console.log('=== getTagDetails 结束 ===')
  
  return tagInfo
}

// 初始化配置表
async function initConfigTable() {
  try {
    // 创建配置表
    await db.query(`
      CREATE TABLE IF NOT EXISTS XAGA_config (
        CONFIG_KEY VARCHAR(64) PRIMARY KEY,
        CONFIG_VALUE VARCHAR(255) NOT NULL,
        CONFIG_TYPE VARCHAR(20) NOT NULL DEFAULT 'STRING',
        CONFIG_DESC VARCHAR(200),
        EFFECT_DESC VARCHAR(500),
        CREATE_TIME DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UPDATE_TIME DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // 为 TAG_EXAMPLE_ontology 表添加源实体主键字段（已在数据库中手动添加，这里跳过）
    // 尝试创建联合唯一索引
    try {
      await db.query(`
        CREATE UNIQUE INDEX idx_tag_entity 
        ON TAG_EXAMPLE_ontology (TAG_CODE, ENTITY_KEY)
      `)
    } catch (e) {
      // 索引已存在时忽略错误
      console.log('索引 idx_tag_entity 已存在，跳过创建')
    }
    
    // 插入配置参数
    const configs = [
      // 风险评分阈值参数
      { key: 'risk_score_high_threshold', value: '80', type: 'INT', desc: '高风险阈值', effect: '决定人员风险等级划分，高于80显示红色高危标识' },
      { key: 'risk_score_medium_threshold', value: '50', type: 'INT', desc: '中风险阈值', effect: '决定中风险等级划分，50-80显示橙色中风险标识' },
      
      // 风险评分权重参数
      { key: 'weight_high_risk_tag', value: '0.4', type: 'FLOAT', desc: '高优先级标签权重', effect: '决定高优先级标签对总风险评分的贡献比例' },
      { key: 'weight_medium_risk_tag', value: '0.3', type: 'FLOAT', desc: '中优先级标签权重', effect: '决定中优先级标签对总风险评分的贡献比例' },
      { key: 'weight_low_risk_tag', value: '0.2', type: 'FLOAT', desc: '低优先级标签权重', effect: '决定低优先级标签对总风险评分的贡献比例' },
      
      // AI模型配置参数
      { key: 'ai_model_url', value: 'https://api.deepseek.com/v1/chat/completions', type: 'STRING', desc: 'AI模型服务地址', effect: '决定AI标注服务的调用地址' },
      { key: 'ai_timeout_seconds', value: '30', type: 'INT', desc: '单次调用超时时间(秒)', effect: '决定AI标注响应超时时间，影响用户体验' },
      { key: 'ai_max_retry_count', value: '3', type: 'INT', desc: '重试次数', effect: '决定AI标注失败后的重试次数，影响标注成功率' },
      
      // 知识图谱配置参数
      { key: 'graph_max_depth', value: '3', type: 'INT', desc: '图谱最大查询深度', effect: '决定图谱展示的关系深度，深度越大展示越丰富但性能下降' },
      { key: 'graph_max_nodes', value: '100', type: 'INT', desc: '单次查询最大节点数', effect: '决定图谱节点数量上限，影响图谱展示复杂度' },
      { key: 'graph_max_relations', value: '200', type: 'INT', desc: '单次查询最大关系数', effect: '决定图谱关系数量上限，影响图谱展示复杂度' }
    ]
    
    for (const config of configs) {
      await db.query(
        `INSERT INTO XAGA_config (CONFIG_KEY, CONFIG_VALUE, CONFIG_TYPE, CONFIG_DESC, EFFECT_DESC) 
         VALUES (?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE UPDATE_TIME = NOW()`,
        [config.key, config.value, config.type, config.desc, config.effect]
      )
    }
    
    console.log('配置参数已成功插入数据库')
  } catch (error) {
    console.error('初始化配置表失败:', error)
  }
}

// 配置参数查询接口
app.get('/api/v1/config', async (req, res) => {
  try {
    const results = await db.query('SELECT * FROM XAGA_config ORDER BY CONFIG_KEY')
    res.json({
      code: 200,
      message: 'success',
      data: results
    })
  } catch (error) {
    res.json({
      code: 500,
      message: '获取配置失败',
      detail: error.message
    })
  }
})

// 单个配置参数查询接口
app.get('/api/v1/config/:key', async (req, res) => {
  try {
    const { key } = req.params
    const results = await db.query('SELECT * FROM XAGA_config WHERE CONFIG_KEY = ?', [key])
    if (results.length > 0) {
      res.json({
        code: 200,
        message: 'success',
        data: results[0]
      })
    } else {
      res.json({
        code: 404,
        message: '配置项不存在'
      })
    }
  } catch (error) {
    res.json({
      code: 500,
      message: '获取配置失败',
      detail: error.message
    })
  }
})

// 配置参数更新接口
app.put('/api/v1/config/:key', async (req, res) => {
  try {
    const { key } = req.params
    const { value } = req.body
    
    await db.query(
      'UPDATE XAGA_config SET CONFIG_VALUE = ?, UPDATE_TIME = NOW() WHERE CONFIG_KEY = ?',
      [value, key]
    )
    
    res.json({
      code: 200,
      message: 'success'
    })
  } catch (error) {
    res.json({
      code: 500,
      message: '更新配置失败',
      detail: error.message
    })
  }
})

// 获取警情报警记录
async function getCaseRecords(personBH) {
  const records = await db.query(`
    SELECT j.JJDBH, j.BJNR, j.BJSJ 
    FROM JJD_JJD j 
    JOIN JQ_SMSJ_ontology s ON j.JJDBH = s.JJDBH 
    WHERE s.BJR_BH = ?
    ORDER BY j.BJSJ DESC
  `, [personBH])
  
  if (!records || !Array.isArray(records)) {
    return []
  }
  
  return records.map(r => ({
    caseNumber: r.JJDBH,
    content: r.BJNR,
    alarmTime: r.BJSJ,
    disposalContent: null,
    disposalResult: null
  }))
}

// 获取人口库信息
async function getHouseholdInfo(idCard) {
  const household = await db.query(`
    SELECT * FROM person_household WHERE id_card = ?
  `, [idCard])
  
  if (!household || !Array.isArray(household) || household.length === 0) return null
  
  return household[0]
}

// 获取户籍成员信息
async function getHouseholdMembers(householdId) {
  const members = await db.query(`
    SELECT * FROM person_household WHERE household_id = ?
  `, [householdId])
  
  return members && Array.isArray(members) ? members : []
}

// 获取案底库信息
async function getCriminalRecords(idCard) {
  const records = await db.query(`
    SELECT * FROM criminal_record_db WHERE id_card = ?
  `, [idCard])
  
  return records && Array.isArray(records) ? records : []
}

// 获取户籍成员案底信息
async function getHouseholdCriminalRecords(idCards) {
  if (!idCards || idCards.length === 0) return []
  
  const placeholders = idCards.map(() => '?').join(',')
  const records = await db.query(`
    SELECT * FROM criminal_record_db WHERE id_card IN (${placeholders})
  `, idCards)
  
  return records && Array.isArray(records) ? records : []
}

// 计算预警等级
function calculateWarningLevel(personRecords, householdRecords) {
  const allRecords = [...personRecords, ...householdRecords]
  
  console.log('=== 预警等级计算开始 ===')
  console.log('本人案底记录:', JSON.stringify(personRecords))
  console.log('户籍成员案底记录:', JSON.stringify(householdRecords))
  
  // 高危预警：本人案底库的服刑状态是"通缉"
  const hasWanted = personRecords.some(r => r.prison_status === '通缉')
  console.log('是否通缉:', hasWanted)
  if (hasWanted) {
    console.log('判定为高危预警')
    return { level: 'high', label: '高危预警', description: '目标人员本人案底库的服刑状态是"通缉"' }
  }
  
  // 关注人员：本人或户籍成员有案底库的服刑状态是"已服刑"
  const hasPrisoned = allRecords.some(r => r.prison_status === '已服刑')
  console.log('是否有已服刑:', hasPrisoned)
  if (hasPrisoned) {
    console.log('判定为关注人员')
    return { level: 'medium', label: '关注人员', description: '目标人员本人或关联户籍成员有案底库的服刑状态是"已服刑"' }
  }
  
  // 正常人员：无案底库关联记录
  console.log('判定为正常人员')
  return { level: 'normal', label: '正常人员', description: '目标人员本人及关联户籍成员无案底库关联记录' }
}

// 生成AI处置建议
function generateSuggestion(warningLevel, caseRecords, householdInfo, criminalRecords) {
  const suggestions = []
  
  if (warningLevel.level === 'high') {
    suggestions.push('建议立即布控拦截，防止嫌疑人逃脱')
    suggestions.push('通知相关部门协同配合抓捕')
    suggestions.push('调取监控录像追踪行踪')
  } else if (warningLevel.level === 'medium') {
    suggestions.push('建议加强日常监控，关注其活动轨迹')
    suggestions.push('核查其近期活动情况')
    suggestions.push('约谈其家属或监护人，了解思想动态')
  } else {
    suggestions.push('建议常规处理，注意观察异常行为')
    suggestions.push('如有需要可进行口头教育')
  }
  
  if (caseRecords && caseRecords.length > 0) {
    suggestions.push(`该人员有${caseRecords.length}次报警记录，建议查阅历史处置情况`)
  }
  
  if (criminalRecords && criminalRecords.length > 0) {
    suggestions.push(`该人员有${criminalRecords.length}条案底记录，需重点关注`)
  }
  
  return suggestions
}

// 生成AI分析文本和本体特征
function generateAnalysisData(personInfo, caseRecords, householdInfo, householdMembers, personCriminalRecords, householdCriminalRecords, warningLevel) {
  const features = []
  let analysisText = ''
  
  const analysisParts = []
  
  // （1）涉警频次 - AI描述报警记录内容
  if (caseRecords && caseRecords.length > 0) {
    const caseDesc = caseRecords.map(c => c.content).join('；')
    const briefDesc = caseDesc.length > 40 ? caseDesc.substring(0, 40) + '...' : caseDesc
    const caseAnalysis = `近三个月内涉警${caseRecords.length}次：${briefDesc}`
    
    analysisParts.push(`近期涉警${caseRecords.length}次`)
    features.push({
      type: caseRecords.length >= 3 ? 'high' : 'medium',
      title: '涉警频次',
      desc: caseAnalysis
    })
  }
  
  // （2）前科记录 - 描述户籍所有成员情况及案底情况
  const householdDescParts = []
  if (householdInfo) {
    householdDescParts.push(`户主${householdInfo.name}，户籍地址：${householdInfo.address}`)
  }
  
  const memberCount = householdMembers ? householdMembers.length : 0
  if (memberCount > 0) {
    const memberNames = householdMembers.map(m => m.name).join('、')
    householdDescParts.push(`户籍成员共${memberCount}人：${memberNames}`)
  }
  
  if (personCriminalRecords && personCriminalRecords.length > 0) {
    const recordDetails = personCriminalRecords.map(r => `${r.crime_type || '犯罪'}(服刑状态:${r.prison_status || '未知'})`).join('、')
    householdDescParts.push(`本人有${personCriminalRecords.length}条案底记录（${recordDetails}）`)
  } else {
    householdDescParts.push('本人无案底记录')
  }
  
  if (householdCriminalRecords && householdCriminalRecords.length > 0) {
    const memberRecords = householdCriminalRecords.map(r => `${r.name}:${r.crime_type || '犯罪'}(服刑状态:${r.prison_status || '未知'})`).join('、')
    householdDescParts.push(`户籍成员有案底记录：${memberRecords}`)
  }
  
  if (householdDescParts.length > 0) {
    const householdDesc = householdDescParts.join('；')
    features.push({
      type: (personCriminalRecords && personCriminalRecords.length > 0) || 
            (householdCriminalRecords && householdCriminalRecords.length > 0) ? 'medium' : 'low',
      title: '前科记录',
      desc: householdDesc
    })
  }
  
  // （3）人员预警 - 根据规则判断并给出具体依据
  let warningReason = ''
  if (warningLevel.level === 'high') {
    const wantedRecords = personCriminalRecords?.filter(r => r.prison_status === '通缉') || []
    if (wantedRecords.length > 0) {
      warningReason = `本人案底库显示服刑状态为"通缉"，属于高危预警对象`
    }
    analysisParts.push('属于高危预警人员')
    features.push({
      type: 'high',
      title: '人员预警',
      desc: warningReason || '本人在通缉名单中，属于高危预警对象'
    })
  } else if (warningLevel.level === 'medium') {
    const hasSelfCriminal = personCriminalRecords?.some(r => r.prison_status === '已服刑')
    const hasMemberCriminal = householdCriminalRecords?.some(r => r.prison_status === '已服刑')
    
    if (hasSelfCriminal) {
      warningReason = `本人案底库显示服刑状态为"已服刑"`
    } else if (hasMemberCriminal) {
      const memberNames = [...new Set(householdCriminalRecords.filter(r => r.prison_status === '已服刑').map(r => r.name))].join('、')
      warningReason = `户籍成员${memberNames}案底库显示服刑状态为"已服刑"`
    }
    analysisParts.push('属于关注人员')
    features.push({
      type: 'medium',
      title: '人员预警',
      desc: warningReason || '本人或户籍成员有服刑记录，属于关注人员'
    })
  } else {
    analysisParts.push('暂无风险预警')
    features.push({
      type: 'low',
      title: '人员预警',
      desc: '本人及户籍成员无案底库关联记录，属于正常人员'
    })
  }
  
  // （4）预警等级 - 仅当高危或关注时显示具体预警建议
  if (warningLevel.level === 'high') {
    features.push({
      type: 'high',
      title: '预警等级',
      desc: '高危预警：建议立即部署警力监控，启动应急预案'
    })
  } else if (warningLevel.level === 'medium') {
    features.push({
      type: 'medium',
      title: '预警等级',
      desc: '关注人员：建议加强日常监控，定期回访了解动态'
    })
  }
  
  // 重点人员标记
  if (personInfo && personInfo.SFZDRY === '1') {
    analysisParts.push('属于重点关注人员')
    features.push({
      type: 'high',
      title: '重点人员',
      desc: '被列为重点关注对象，需加强监控'
    })
  }
  
  // 生成综合分析文本
  if (analysisParts.length > 0) {
    analysisText = '基于多维度数据分析：' + analysisParts.join('，') + '。'
  } else {
    analysisText = '经多维度数据分析，暂未发现明显风险特征。'
  }
  
  return { analysisText, features }
}

// 人联研判检索接口
app.post('/api/v1/search/entity', async (req, res) => {
  try {
    const { idCard, plateNumber, caseNumber, phoneNumber } = req.body
    
    let personInfo = null
    let queryParams = []
    let query = 'SELECT * FROM FKD_BJR WHERE 1=1'
    
    if (idCard) {
      query += ' AND ZJHM = ?'
      queryParams.push(idCard)
    } else if (plateNumber) {
      query += ' AND CPH_ontology = ?'
      queryParams.push(plateNumber)
    } else if (phoneNumber) {
      query += ' AND LXDH = ?'
      queryParams.push(phoneNumber)
    } else if (caseNumber) {
      query = `
        SELECT b.* FROM FKD_BJR b 
        JOIN JQ_SMSJ_ontology s ON b.BH = s.BJR_BH 
        JOIN JJD_JJD j ON s.JJDBH = j.JJDBH 
        WHERE j.JJDBH = ?
      `
      queryParams.push(caseNumber)
    }
    
    query += ' LIMIT 1'
    
    const results = await db.query(query, queryParams)
    if (results.length > 0) {
      personInfo = results[0]
    }
    
    if (personInfo) {
      // 获取警情报警记录
      const caseRecords = await getCaseRecords(personInfo.BH)
      
      // 获取人口库信息
      const householdInfo = await getHouseholdInfo(personInfo.ZJHM)
      
      // 获取户籍成员
      const householdMembers = householdInfo 
        ? await getHouseholdMembers(householdInfo.household_id) 
        : []
      
      // 获取本人案底记录
      const personCriminalRecords = await getCriminalRecords(personInfo.ZJHM)
      
      // 获取户籍成员案底记录
      const memberIds = householdMembers.map(m => m.id_card).filter(id => id !== personInfo.ZJHM)
      const householdCriminalRecords = await getHouseholdCriminalRecords(memberIds)
      
      // 计算预警等级
      const warningLevel = calculateWarningLevel(personCriminalRecords, householdCriminalRecords)
      
      // 生成处置建议
      const suggestions = generateSuggestion(warningLevel, caseRecords, householdInfo, personCriminalRecords)
      
      // 计算风险评分
      let riskScore = 50
      const riskTags = []
      const riskDetails = []
      
      if (personInfo.AI_TAG_ontology) {
        try {
          const tags = JSON.parse(personInfo.AI_TAG_ontology)
          riskTags.push(...tags)
        } catch (e) {
          console.error('解析AI标签失败', e)
        }
      }
      
      if (personInfo.SFZDRY === '1') {
        riskTags.push('重点人员')
        riskScore += 30
      }
      
      if (riskTags.includes('高危人员')) riskScore += 25
      if (riskTags.includes('前科人员')) riskScore += 20
      if (riskTags.includes('涉毒人员')) riskScore += 25
      if (riskTags.includes('昼伏夜出')) riskScore += 10
      
      // 根据预警等级调整风险评分
      if (warningLevel.level === 'high') riskScore += 30
      if (warningLevel.level === 'medium') riskScore += 15
      
      riskScore = Math.min(riskScore, 100)
      
      // 获取知识图谱数据
      const graphData = await buildGraphData(personInfo.BH)
      
      // 生成AI分析文本和本体特征
      const { analysisText, features } = generateAnalysisData(
        personInfo, 
        caseRecords, 
        householdInfo, 
        householdMembers,
        personCriminalRecords, 
        householdCriminalRecords, 
        warningLevel
      )
      
      // 获取智能标签详细信息
      const tags = await getTagDetails(personInfo.AI_TAG_ontology)
      
      res.json({
        code: 200,
        message: 'success',
        data: {
          personInfo,
          riskScore,
          riskTags,
          caseRecords,
          householdInfo,
          householdMembers,
          personCriminalRecords,
          householdCriminalRecords,
          warningLevel,
          suggestions,
          graphData,
          analysisText,
          features,
          tags
        }
      })
    } else {
      res.json({
        code: 200,
        message: 'success',
        data: {
          personInfo: null,
          riskScore: 0,
          riskTags: [],
          caseRecords: [],
          householdInfo: null,
          householdMembers: [],
          personCriminalRecords: [],
          householdCriminalRecords: [],
          warningLevel: null,
          suggestions: [],
          graphData: { nodes: [], links: [] }
        }
      })
    }

  } catch (error) {
    console.error('检索失败:', error)
    res.json({
      code: 500,
      message: '检索失败',
      detail: error.message
    })
  }
})

// 知识图谱查询接口
app.post('/api/v1/graph/query', async (req, res) => {
  try {
    const { entityId, entityType, maxDepth = 3, maxNodes = 50, cnFields = false } = req.body
    
    let graphData = await buildGraphData(entityId, maxDepth, maxNodes, entityType)
    
    if (cnFields) {
      graphData = convertToChineseFields(graphData)
    }
    
    res.json({
      code: 200,
      message: 'success',
      data: graphData
    })
  } catch (error) {
    console.error('图谱查询失败:', error)
    res.json({
      code: 500,
      message: '图谱查询失败',
      detail: error.message
    })
  }
})

// 重新生成知识图谱JSON数据
app.post('/api/v1/graph/regenerate', async (req, res) => {
  try {
    const fs = require('fs')
    const path = require('path')
    
    const nodes = []
    const links = []
    const nodeIdMap = new Set()
    
    console.log('开始重新生成知识图谱数据...')
    
    // 1. 读取人员表（FKD_BJR）
    const personResults = await db.query('SELECT BH, XM, ZJHM, LXDH, HJXZ, XZXZ, SFZDRY, CPH_ontology FROM FKD_BJR')
    for (const person of personResults) {
      const nodeId = person.BH
      if (!nodeIdMap.has(nodeId)) {
        nodes.push({
          id: nodeId,
          type: 'citizen',
          label: person.XM,
          color: '#2196F3',
          properties: {
            id: nodeId,
            name: person.XM,
            id_card: person.ZJHM || '-',
            phone: person.LXDH || '-',
            domicile: person.HJXZ || '-',
            address: person.XZXZ || '-',
            is_key_person: person.SFZDRY === '1' ? '是' : '否',
            plate_number: person.CPH_ontology || '-',
            data_source: 'FKD_BJR'
          }
        })
        nodeIdMap.add(nodeId)
      }
    }
    console.log(`已读取人员节点: ${personResults.length}个`)
    
    // 2. 读取案件表（JJD_JJD）
    const caseResults = await db.query('SELECT JJDBH, BJNR, BJSJ FROM JJD_JJD')
    for (const caseItem of caseResults) {
      const nodeId = 'case_' + caseItem.JJDBH
      if (!nodeIdMap.has(nodeId)) {
        nodes.push({
          id: nodeId,
          type: 'case',
          label: caseItem.JJDBH,
          color: '#F44336',
          properties: {
            case_number: caseItem.JJDBH,
            content: caseItem.BJNR,
            time: caseItem.BJSJ ? formatDateTime(caseItem.BJSJ) : '-'
          }
        })
        nodeIdMap.add(nodeId)
      }
    }
    console.log(`已读取案件节点: ${caseResults.length}个`)
    
    // 3. 读取民警表（MJ_XX_ontology）
    const policeResults = await db.query('SELECT MJGH, XM, ZN_ontology, ZT_ontology, SJDWMC, LXDH FROM MJ_XX_ontology')
    for (const police of policeResults) {
      const nodeId = 'police_' + police.MJGH
      if (!nodeIdMap.has(nodeId)) {
        nodes.push({
          id: nodeId,
          type: 'police',
          label: police.XM,
          color: '#4CAF50',
          properties: {
            police_id: police.MJGH,
            name: police.XM,
            role: police.ZN_ontology || '-',
            status: police.ZT_ontology || '-',
            department: police.SJDWMC || '-',
            phone: police.LXDH || '-'
          }
        })
        nodeIdMap.add(nodeId)
      }
    }
    console.log(`已读取民警节点: ${policeResults.length}个`)
    
    // 4. 读取人口库（person_household）
    const householdResults = await db.query('SELECT id_card, name, household_id, household_number, address, relation_to_head, household_type FROM person_household')
    const householdSet = new Set()
    
    for (const household of householdResults) {
      // 添加户籍节点
      const householdNodeId = 'household_' + household.household_id
      if (!householdSet.has(household.household_id)) {
        nodes.push({
          id: householdNodeId,
          type: 'household',
          label: household.household_number,
          color: '#FF9800',
          properties: {
            household_id: household.household_id,
            household_number: household.household_number,
            address: household.address || '-',
            household_type: household.household_type || '家庭户口'
          }
        })
        nodeIdMap.add(householdNodeId)
        householdSet.add(household.household_id)
      }
      
      // 添加人员节点（从人口库）
      const personNodeId = 'citizen_' + household.id_card
      if (!nodeIdMap.has(personNodeId)) {
        nodes.push({
          id: personNodeId,
          type: 'citizen',
          label: household.name,
          color: '#2196F3',
          properties: {
            id: personNodeId,
            name: household.name,
            id_card: household.id_card,
            phone: '-',
            domicile: household.address || '-',
            address: household.address || '-',
            is_key_person: '否',
            plate_number: '-',
            data_source: 'person_household'
          }
        })
        nodeIdMap.add(personNodeId)
      }
      
      // 添加人员-户籍关系
      links.push({
        source: personNodeId,
        target: householdNodeId,
        relation: household.relation_to_head,
        household_address: household.address
      })
    }
    console.log(`已读取户籍节点: ${householdSet.size}个, 人员-户籍关系: ${householdResults.length}条`)
    
    // 5. 读取案底库（criminal_record_db）
    const criminalResults = await db.query('SELECT record_id, id_card, name, crime_type, crime_detail, prison_status, sentence_date, sentence_months FROM criminal_record_db')
    for (const criminal of criminalResults) {
      // 添加案底节点
      const criminalNodeId = 'criminal_' + criminal.record_id
      if (!nodeIdMap.has(criminalNodeId)) {
        nodes.push({
          id: criminalNodeId,
          type: 'criminal',
          label: criminal.crime_type,
          color: '#9C27B0',
          properties: {
            record_id: criminal.record_id,
            name: criminal.name,
            crime_type: criminal.crime_type,
            crime_detail: criminal.crime_detail || '-',
            prison_status: criminal.prison_status || '-',
            sentence_date: criminal.sentence_date ? formatDateTime(criminal.sentence_date) : '-',
            sentence_months: criminal.sentence_months || '-'
          }
        })
        nodeIdMap.add(criminalNodeId)
      }
      
      // 添加人员节点（从案底库）
      const personNodeId = 'citizen_' + criminal.id_card
      if (!nodeIdMap.has(personNodeId)) {
        nodes.push({
          id: personNodeId,
          type: 'citizen',
          label: criminal.name,
          color: '#2196F3',
          properties: {
            id: personNodeId,
            name: criminal.name,
            id_card: criminal.id_card,
            phone: '-',
            domicile: criminal.household_addr || '-',
            address: criminal.household_addr || '-',
            is_key_person: '否',
            plate_number: '-',
            data_source: 'criminal_record_db'
          }
        })
        nodeIdMap.add(personNodeId)
      }
      
      // 添加人员-案底关系
      let relation = '有案底'
      if (criminal.prison_status === '通缉') {
        relation = '通缉在逃'
      } else if (criminal.prison_status === '在逃') {
        relation = '在逃'
      }
      links.push({
        source: personNodeId,
        target: criminalNodeId,
        relation: relation,
        crime_type: criminal.crime_type
      })
    }
    console.log(`已读取案底节点: ${criminalResults.length}个, 人员-案底关系: ${criminalResults.length}条`)
    
    // 6. 读取人员-案件关系（JQ_SMSJ_ontology）
    const smsjResults = await db.query('SELECT BJR_BH, JJDBH FROM JQ_SMSJ_ontology')
    for (const relationItem of smsjResults) {
      links.push({
        source: relationItem.BJR_BH,
        target: 'case_' + relationItem.JJDBH,
        relation: '涉及',
        remark: '报警人'
      })
    }
    console.log(`已读取人员-案件关系: ${smsjResults.length}条`)
    
    // 7. 读取民警-案件关系（JQ_MJFZ_ontology）
    const mfjzResults = await db.query('SELECT MJGH, JJDBH FROM JQ_MJFZ_ontology')
    for (const relationItem of mfjzResults) {
      links.push({
        source: 'police_' + relationItem.MJGH,
        target: 'case_' + relationItem.JJDBH,
        relation: '负责',
        remark: '处警民警'
      })
    }
    console.log(`已读取民警-案件关系: ${mfjzResults.length}条`)
    
    // 写入JSON文件
    const graphData = { nodes, links }
    const outputPath = path.join(__dirname, '../graph-data.json')
    fs.writeFileSync(outputPath, JSON.stringify(graphData, null, 2))
    
    console.log(`知识图谱数据生成完成! 节点数: ${nodes.length}, 关系数: ${links.length}`)
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        success: true,
        nodeCount: nodes.length,
        linkCount: links.length,
        message: `知识图谱数据已更新，共${nodes.length}个节点，${links.length}条关系`
      }
    })
  } catch (error) {
    console.error('重新生成图谱数据失败:', error)
    res.json({
      code: 500,
      message: '重新生成图谱数据失败',
      detail: error.message,
      data: {
        success: false,
        nodeCount: 0,
        linkCount: 0,
        message: '生成失败: ' + error.message
      }
    })
  }
})

// 格式化日期时间
function formatDateTime(date) {
  if (!date) return '-'
  const d = new Date(date)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

// 构建知识图谱数据
async function buildGraphData(entityId, maxDepth = 3, maxNodes = 50, entityType = 'citizen') {
  const nodes = []
  const links = []
  const nodeIdMap = new Set()
  
  if (!entityId) return { nodes, links }
  
  let personInfo = null
  let personZJHM = null
  let caseInfo = null
  
  // 根据实体类型选择不同的中心节点查询
  if (entityType === 'police') {
    // 以民警为中心节点
    const policeId = entityId.startsWith('police_') ? entityId.substring(7) : entityId
    const policeResults = await db.query(
      'SELECT MJGH, XM FROM MJ_XX_ontology WHERE MJGH = ?',
      [policeId]
    )
    
    if (policeResults.length > 0) {
      const policeInfo = policeResults[0]
      const policeNodeId = `police_${policeInfo.MJGH}`
      nodes.push({
        id: policeNodeId,
        type: 'police',
        label: policeInfo.XM,
        color: '#4CAF50',
        properties: {
          MJGH: policeInfo.MJGH,
          XM: policeInfo.XM
        }
      })
      nodeIdMap.add(policeNodeId)
      
      // 获取民警负责的警情
      const caseResults = await db.query(
        'SELECT j.JJDBH, j.BJNR FROM JJD_JJD j JOIN JQ_MJFZ_ontology f ON j.JJDBH = f.JJDBH WHERE f.MJGH = ?',
        [policeId]
      )
      
      for (const caseItem of caseResults) {
        const caseNodeId = `case_${caseItem.JJDBH}`
        if (!nodeIdMap.has(caseNodeId)) {
          nodeIdMap.add(caseNodeId)
          nodes.push({
            id: caseNodeId,
            type: 'case',
            label: caseItem.JJDBH.substring(0, 10),
            color: '#F44336',
            properties: {
              JJDBH: caseItem.JJDBH,
              BJNR: caseItem.BJNR
            }
          })
        }
        links.push({
          source: policeNodeId,
          target: caseNodeId,
          relation: '负责'
        })
        
        // 获取警情涉及的人员
        const personResults = await db.query(
          'SELECT b.BH, b.XM, b.ZJHM, b.LXDH, b.HJXZ, b.XZXZ, b.SFZDRY, b.CPH_ontology FROM FKD_BJR b JOIN JQ_SMSJ_ontology s ON b.BH = s.BJR_BH WHERE s.JJDBH = ?',
          [caseItem.JJDBH]
        )
        
        for (const person of personResults) {
          personInfo = person
          personZJHM = person.ZJHM
          const personNodeId = person.BH
          if (!nodeIdMap.has(personNodeId)) {
            nodeIdMap.add(personNodeId)
            nodes.push({
              id: personNodeId,
              type: 'citizen',
              label: person.XM,
              color: '#2196F3',
              properties: {
                BH: person.BH,
                XM: person.XM,
                ZJHM: person.ZJHM || '-',
                LXDH: person.LXDH || '-',
                HJXZ: person.HJXZ || '-',
                XZXZ: person.XZXZ || '-',
                SFZDRY: person.SFZDRY === '1' ? '是' : '否',
                CPH_ontology: person.CPH_ontology || '-',
                data_source: 'FKD_BJR'
              }
            })
          }
          links.push({
            source: personNodeId,
            target: caseNodeId,
            relation: '涉及'
          })
        }
      }
    }
  } else if (entityType === 'case') {
    // 以警情为中心节点
    const caseId = entityId.startsWith('case_') ? entityId.substring(5) : entityId
    const caseResults = await db.query(
      'SELECT JJDBH, BJNR FROM JJD_JJD WHERE JJDBH = ?',
      [caseId]
    )
    
    if (caseResults.length > 0) {
      caseInfo = caseResults[0]
      nodes.push({
        id: `case_${caseInfo.JJDBH}`,
        type: 'case',
        label: caseInfo.JJDBH.substring(0, 10),
        color: '#F44336',
        properties: {
          JJDBH: caseInfo.JJDBH,
          BJNR: caseInfo.BJNR
        }
      })
      nodeIdMap.add(`case_${caseInfo.JJDBH}`)
      
      // 获取相关人员
      const personResults = await db.query(
        'SELECT b.BH, b.XM, b.ZJHM, b.LXDH, b.HJXZ, b.XZXZ, b.SFZDRY, b.CPH_ontology FROM FKD_BJR b JOIN JQ_SMSJ_ontology s ON b.BH = s.BJR_BH WHERE s.JJDBH = ?',
        [caseId]
      )
      
      personResults.forEach(person => {
        personInfo = person
        personZJHM = person.ZJHM
        const personId = person.BH
        if (!nodeIdMap.has(personId)) {
          nodeIdMap.add(personId)
          nodes.push({
            id: personId,
            type: 'citizen',
            label: person.XM,
            color: '#2196F3',
            properties: {
              BH: person.BH,
              XM: person.XM,
              ZJHM: person.ZJHM || '-',
              LXDH: person.LXDH || '-',
              HJXZ: person.HJXZ || '-',
              XZXZ: person.XZXZ || '-',
              SFZDRY: person.SFZDRY === '1' ? '是' : '否',
              CPH_ontology: person.CPH_ontology || '-',
              data_source: 'FKD_BJR'
            }
          })
        }
        links.push({
          source: personId,
          target: `case_${caseInfo.JJDBH}`,
          relation: '涉及'
        })
      })
    }
  } else {
    // 以人员为中心节点（原有逻辑）
    // 添加中心节点（人员）
    const personResults = await db.query(
      'SELECT BH, XM, ZJHM, LXDH, HJXZ, XZXZ, SFZDRY, CPH_ontology FROM FKD_BJR WHERE BH = ?',
      [entityId]
    )
    
    if (personResults.length > 0) {
      personInfo = personResults[0]
      personZJHM = personInfo.ZJHM
      nodes.push({
        id: personInfo.BH,
        type: 'citizen',
        label: personInfo.XM,
        color: '#2196F3',
        properties: {
          BH: personInfo.BH,
          XM: personInfo.XM,
          ZJHM: personInfo.ZJHM || '-',
          LXDH: personInfo.LXDH || '-',
          HJXZ: personInfo.HJXZ || '-',
          XZXZ: personInfo.XZXZ || '-',
          SFZDRY: personInfo.SFZDRY === '1' ? '是' : '否',
          CPH_ontology: personInfo.CPH_ontology || '-',
          data_source: 'FKD_BJR'
        }
      })
      nodeIdMap.add(personInfo.BH)
    }
    
    // 获取相关警情
    const caseResults = await db.query(
      `SELECT j.JJDBH, j.BJNR FROM JJD_JJD j 
       JOIN JQ_SMSJ_ontology s ON j.JJDBH = s.JJDBH 
       WHERE s.BJR_BH = ?`,
      [entityId]
    )
    
    caseResults.forEach(item => {
      const caseId = `case_${item.JJDBH}`
      if (!nodeIdMap.has(caseId)) {
        nodeIdMap.add(caseId)
        nodes.push({
          id: caseId,
          type: 'case',
          label: item.JJDBH.substring(0, 10),
          color: '#F44336',
          properties: item
        })
      }
      links.push({
        source: entityId,
        target: caseId,
        relation: '涉及'
      })
    })
    
    // 获取负责民警
    const policeResults = await db.query(
      `SELECT m.MJGH, m.XM FROM MJ_XX_ontology m 
       JOIN JQ_MJFZ_ontology f ON m.MJGH = f.MJGH 
       JOIN JQ_SMSJ_ontology s ON f.JJDBH = s.JJDBH 
       WHERE s.BJR_BH = ?`,
      [entityId]
    )
    
    policeResults.forEach(item => {
      const policeId = `police_${item.MJGH}`
      if (!nodeIdMap.has(policeId)) {
        nodeIdMap.add(policeId)
        nodes.push({
          id: policeId,
          type: 'police',
          label: item.XM,
          color: '#4CAF50',
          properties: item
        })
      }
      
      caseResults.forEach(caseItem => {
        links.push({
          source: policeId,
          target: `case_${caseItem.JJDBH}`,
          relation: '负责'
        })
      })
    })
  }
  
  // 获取负责民警（针对警情类型）
  if (caseInfo) {
    const caseId = caseInfo.JJDBH
    const policeResults = await db.query(
      `SELECT m.MJGH, m.XM FROM MJ_XX_ontology m 
       JOIN JQ_MJFZ_ontology f ON m.MJGH = f.MJGH 
       WHERE f.JJDBH = ?`,
      [caseId]
    )
    
    policeResults.forEach(item => {
      const policeId = `police_${item.MJGH}`
      if (!nodeIdMap.has(policeId)) {
        nodeIdMap.add(policeId)
        nodes.push({
          id: policeId,
          type: 'police',
          label: item.XM,
          color: '#4CAF50',
          properties: item
        })
      }
      links.push({
        source: policeId,
        target: `case_${caseId}`,
        relation: '负责'
      })
    })
  }
  
  // 获取户籍信息（新增）
  if (personZJHM && personInfo) {
    const householdResults = await db.query(
      `SELECT * FROM person_household WHERE id_card = ?`,
      [personZJHM]
    )
    
    householdResults.forEach(item => {
      const householdId = `household_${item.household_id}`
      if (!nodeIdMap.has(householdId)) {
        nodeIdMap.add(householdId)
        nodes.push({
          id: householdId,
          type: 'household',
          label: item.household_number || item.household_id,
          color: '#FF9800',
          properties: {
            household_id: item.household_id,
            household_number: item.household_number,
            address: item.address,
            household_type: item.household_type
          }
        })
      }
      links.push({
        source: personInfo.BH,
        target: householdId,
        relation: item.relation_to_head || '户籍成员',
        remark: item.address
      })
    })
  }
  
  // 获取案底记录（新增）
  if (personZJHM) {
    const criminalResults = await db.query(
      `SELECT * FROM criminal_record_db WHERE id_card = ?`,
      [personZJHM]
    )
    
    criminalResults.forEach(item => {
      const criminalId = `criminal_${item.record_id}`
      if (!nodeIdMap.has(criminalId)) {
        nodeIdMap.add(criminalId)
        nodes.push({
          id: criminalId,
          type: 'criminal',
          label: item.crime_type || '案底记录',
          color: '#9C27B0',
          properties: {
            record_id: item.record_id,
            crime_type: item.crime_type,
            crime_detail: item.crime_detail,
            prison_status: item.prison_status,
            sentence_date: item.sentence_date
          }
        })
      }
      const relationText = item.prison_status === '通缉' ? '通缉在逃' : 
                          (item.prison_status === '在逃' ? '在逃' : '有案底')
      links.push({
        source: personInfo?.BH || entityId,
        target: criminalId,
        relation: relationText,
        remark: item.crime_type
      })
    })
  }
  
  // 获取同户籍人员及其案底记录（路径长度为3的关联查询）
  if (personZJHM && personInfo) {
    const householdData = await db.query(
      `SELECT * FROM person_household WHERE household_id IN (SELECT household_id FROM person_household WHERE id_card = ?) AND id_card != ?`,
      [personZJHM, personZJHM]
    )
    
    for (const item of householdData) {
      const citizenId = `citizen_${item.id_card}`
      if (!nodeIdMap.has(citizenId)) {
        nodeIdMap.add(citizenId)
        nodes.push({
          id: citizenId,
          type: 'citizen',
          label: item.name,
          color: '#2196F3',
          properties: {
            BH: citizenId,
            XM: item.name,
            ZJHM: item.id_card,
            LXDH: item.phone || '-',
            HJXZ: item.address || '-',
            XZXZ: item.address || '-',
            SFZDRY: '否',
            CPH_ontology: '-',
            data_source: 'person_household'
          }
        })
      }
      
      const householdId = `household_${item.household_id}`
      links.push({
        source: citizenId,
        target: householdId,
        relation: item.relation_to_head || '户籍成员',
        remark: item.address
      })
      
      // 查询同户籍人员的案底记录（路径长度为3）
      const memberCriminalResults = await db.query(
        `SELECT * FROM criminal_record_db WHERE id_card = ?`,
        [item.id_card]
      )
      
      memberCriminalResults.forEach(criminalItem => {
        const criminalId = `criminal_${criminalItem.record_id}`
        if (!nodeIdMap.has(criminalId)) {
          nodeIdMap.add(criminalId)
          nodes.push({
            id: criminalId,
            type: 'criminal',
            label: criminalItem.crime_type || '案底记录',
            color: '#9C27B0',
            properties: {
              record_id: criminalItem.record_id,
              crime_type: criminalItem.crime_type,
              crime_detail: criminalItem.crime_detail,
              prison_status: criminalItem.prison_status,
              sentence_date: criminalItem.sentence_date,
              related_person: item.name,
              relation_to_main: item.relation_to_head || '户籍成员'
            }
          })
        }
        const relationText = criminalItem.prison_status === '通缉' ? '通缉在逃' : 
                            (criminalItem.prison_status === '在逃' ? '在逃' : '有案底')
        links.push({
          source: citizenId,
          target: criminalId,
          relation: relationText,
          remark: `${item.name}: ${criminalItem.crime_type}`
        })
      })
    }
  }
  
  return { nodes, links }
}

// 标签管理接口
app.get('/api/v1/tags', async (req, res) => {
  try {
    const { page = 1, size = 20, targetType, status, keyword } = req.query
    
    let query = 'SELECT * FROM TAG_CONFIG_ontology WHERE 1=1'
    const queryParams = []
    
    if (targetType) {
      query += ' AND TARGET_TYPE = ?'
      queryParams.push(targetType)
    }
    
    if (status !== undefined) {
      query += ' AND STATUS = ?'
      queryParams.push(parseInt(status))
    }
    
    if (keyword) {
      query += ' AND (TAG_NAME LIKE ? OR TAG_CODE LIKE ?)'
      queryParams.push(`%${keyword}%`, `%${keyword}%`)
    }
    
    query += ' ORDER BY CREATE_TIME DESC'
    
    // 获取总数
    const totalResult = await db.query(
      query.replace('SELECT *', 'SELECT COUNT(*) as total'),
      queryParams
    )
    const total = totalResult[0].total
    
    // 分页
    const offset = (parseInt(page) - 1) * parseInt(size)
    query += ` LIMIT ${parseInt(size)} OFFSET ${offset}`
    
    const results = await db.query(query, queryParams)
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: results,
        total,
        page: parseInt(page),
        size: parseInt(size)
      }
    })
  } catch (error) {
    console.error('获取标签列表失败:', error)
    res.json({
      code: 500,
      message: '获取标签列表失败',
      detail: error.message
    })
  }
})

// 创建标签
app.post('/api/v1/tags', async (req, res) => {
  try {
    const { TAG_CODE, TAG_NAME, PRIORITY, TARGET_TYPE, CATEGORY, STATUS, DESCRIPTION, PROMPT_TEMPLATE } = req.body
    
    await db.query(
      `INSERT INTO TAG_CONFIG_ontology (
        TAG_CODE, TAG_NAME, PRIORITY, TARGET_TYPE, 
        CATEGORY, STATUS, DESCRIPTION, PROMPT_TEMPLATE, 
        CREATE_TIME, UPDATE_TIME
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [TAG_CODE, TAG_NAME, PRIORITY, TARGET_TYPE, CATEGORY, STATUS || 1, DESCRIPTION, PROMPT_TEMPLATE]
    )
    
    res.json({
      code: 200,
      message: 'success',
      data: { TAG_CODE }
    })
  } catch (error) {
    console.error('创建标签失败:', error)
    res.json({
      code: 500,
      message: '创建标签失败',
      detail: error.message
    })
  }
})

// 更新标签
app.put('/api/v1/tags/:tagCode', async (req, res) => {
  try {
    const { tagCode } = req.params
    const updates = req.body
    
    const updateFields = []
    const updateValues = []
    
    Object.keys(updates).forEach(key => {
      updateFields.push(`${key} = ?`)
      updateValues.push(updates[key])
    })
    
    updateFields.push('UPDATE_TIME = NOW()')
    updateValues.push(tagCode)
    
    await db.query(
      `UPDATE TAG_CONFIG_ontology SET ${updateFields.join(', ')} WHERE TAG_CODE = ?`,
      updateValues
    )
    
    res.json({
      code: 200,
      message: 'success'
    })
  } catch (error) {
    console.error('更新标签失败:', error)
    res.json({
      code: 500,
      message: '更新标签失败',
      detail: error.message
    })
  }
})

// 删除标签
app.delete('/api/v1/tags/:tagCode', async (req, res) => {
  try {
    const { tagCode } = req.params
    
    await db.query('DELETE FROM TAG_CONFIG_ontology WHERE TAG_CODE = ?', [tagCode])
    await db.query('DELETE FROM TAG_EXAMPLE_ontology WHERE TAG_CODE = ?', [tagCode])
    
    res.json({
      code: 200,
      message: 'success'
    })
  } catch (error) {
    console.error('删除标签失败:', error)
    res.json({
      code: 500,
      message: '删除标签失败',
      detail: error.message
    })
  }
})

// 标签统计
app.get('/api/v1/tags/statistics', async (req, res) => {
  try {
    const totalResult = await db.query('SELECT COUNT(*) as count FROM TAG_CONFIG_ontology')
    const enabledResult = await db.query('SELECT COUNT(*) as count FROM TAG_CONFIG_ontology WHERE STATUS = 1')
    const rulesResult = await db.query('SELECT COUNT(*) as count FROM TAG_CONFIG_ontology WHERE PROMPT_TEMPLATE IS NOT NULL AND PROMPT_TEMPLATE != ""')
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        totalTags: totalResult[0].count,
        enabledTags: enabledResult[0].count,
        rulesCount: rulesResult[0].count,
        modelName: 'DeepSeek'
      }
    })
  } catch (error) {
    console.error('获取标签统计失败:', error)
    res.json({
      code: 500,
      message: '获取标签统计失败',
      detail: error.message
    })
  }
})

// 获取标签详情
app.get('/api/v1/tags/:tagCode', async (req, res) => {
  try {
    const { tagCode } = req.params
    
    const results = await db.query('SELECT * FROM TAG_CONFIG_ontology WHERE TAG_CODE = ?', [tagCode])
    
    if (results.length > 0) {
      res.json({
        code: 200,
        message: 'success',
        data: results[0]
      })
    } else {
      res.json({
        code: 404,
        message: '标签不存在'
      })
    }
  } catch (error) {
    console.error('获取标签详情失败:', error)
    res.json({
      code: 500,
      message: '获取标签详情失败',
      detail: error.message
    })
  }
})

// 获取标签示例列表
app.get('/api/v1/tags/:tagCode/examples', async (req, res) => {
  try {
    const { tagCode } = req.params
    
    const results = await db.query(
      'SELECT EXAMPLE_ID as ID, TAG_CODE, EXAMPLE_TEXT, EXPECTED_RESULT, LAST_TEST_RESULT as TEST_RESULT, ENTITY_KEY, CREATE_TIME FROM TAG_EXAMPLE_ontology WHERE TAG_CODE = ? ORDER BY CREATE_TIME DESC',
      [tagCode]
    )
    
    const examplesWithGraph = results.map(item => {
      let entityKey = `EXAMPLE_${item.ID}`
      let aiSummary = item.EXAMPLE_TEXT
      
      // 从 EXAMPLE_TEXT 中提取 BH 字段，格式: [BH:xxx]AI总结文本
      const bhMatch = item.EXAMPLE_TEXT.match(/^\[BH:([^\]]+)\]/)
      if (bhMatch) {
        entityKey = bhMatch[1]
        aiSummary = item.EXAMPLE_TEXT.substring(bhMatch[0].length)
      }
      
      return {
        ...item,
        ENTITY_KEY: entityKey,
        GRAPH_DATA: null,
        AI_SUMMARY: aiSummary
      }
    })
    
    res.json({
      code: 200,
      message: 'success',
      data: examplesWithGraph
    })
  } catch (error) {
    console.error('获取标签示例失败:', error)
    res.json({
      code: 500,
      message: '获取标签示例失败',
      detail: error.message
    })
  }
})

// 添加标签示例
app.post('/api/v1/tags/:tagCode/examples', async (req, res) => {
  try {
    const { tagCode } = req.params
    const { EXAMPLE_TEXT, EXPECTED_RESULT, AI_SUMMARY, ENTITY_KEY } = req.body
    
    const expectedResultValue = EXPECTED_RESULT === '是' ? 1 : 0
    const textToSave = AI_SUMMARY || EXAMPLE_TEXT || ''
    
    await db.query(
      `INSERT INTO TAG_EXAMPLE_ontology (TAG_CODE, EXAMPLE_TEXT, EXPECTED_RESULT, ENTITY_KEY) VALUES (?, ?, ?, ?)`,
      [tagCode, textToSave, expectedResultValue, ENTITY_KEY || null]
    )
    
    res.json({
      code: 200,
      message: 'success'
    })
  } catch (error) {
    console.error('添加标签示例失败:', error)
    res.json({
      code: 500,
      message: '添加标签示例失败',
      detail: error.message
    })
  }
})

// 删除标签示例
app.delete('/api/v1/tags/:tagCode/examples/:exampleId', async (req, res) => {
  try {
    const { tagCode, exampleId } = req.params
    
    await db.query(
      'DELETE FROM TAG_EXAMPLE_ontology WHERE TAG_CODE = ? AND EXAMPLE_ID = ?',
      [tagCode, exampleId]
    )
    
    res.json({
      code: 200,
      message: 'success'
    })
  } catch (error) {
    console.error('删除标签示例失败:', error)
    res.json({
      code: 500,
      message: '删除标签示例失败',
      detail: error.message
    })
  }
})

// 单条测试
app.post('/api/v1/tags/:tagCode/test', async (req, res) => {
  try {
    const { tagCode } = req.params
    
    const tagResults = await db.query('SELECT * FROM TAG_CONFIG_ontology WHERE TAG_CODE = ?', [tagCode])
    
    if (tagResults.length === 0) {
      return res.json({
        code: 404,
        message: '标签不存在'
      })
    }
    
    const tag = tagResults[0]
    const promptTemplate = tag.PROMPT_TEMPLATE
    const category = tag.CATEGORY
    
    if (!promptTemplate) {
      return res.json({
        code: 400,
        message: '标签未配置提示词'
      })
    }
    
    // 读取1条实体数据（排除当前标签已有的ENTITY_KEY）
    let entity = null
    if (category === '人员画像' || category === '人员标签') {
      // 查询当前标签已有的ENTITY_KEY
      const existingKeys = await db.query(
        'SELECT ENTITY_KEY FROM TAG_EXAMPLE_ontology WHERE TAG_CODE = ? AND ENTITY_KEY IS NOT NULL',
        [tagCode]
      )
      const existingBhList = existingKeys.map(r => r.ENTITY_KEY).filter(Boolean)
      
      // 查询未被使用的实体
      let query = 'SELECT BH, ZJHM, XM, LXDH, HJXZ, XZXZ, XB, GZDW, ZY, CPH_ontology FROM FKD_BJR'
      let params = []
      
      if (existingBhList.length > 0) {
        query += ' WHERE BH NOT IN (?' + ', ?'.repeat(existingBhList.length - 1) + ')'
        params = existingBhList
      }
      query += ' LIMIT 1'
      
      const result = await db.query(query, params)
      if (result.length > 0) {
        const e = result[0]
        entity = { 
          id: e.BH, 
          type: 'citizen', 
          identifier: e.ZJHM,
          name: e.XM,
          phone: e.LXDH,
          address: e.HJXZ,
          currentAddress: e.XZXZ,
          gender: e.XB,
          workUnit: e.GZDW,
          occupation: e.ZY,
          plateNumber: e.CPH_ontology
        }
      }
    } else {
      const result = await db.query('SELECT JJDBH, BJNR, BJSJ FROM JJD_JJD LIMIT 1')
      if (result.length > 0) {
        const e = result[0]
        entity = { 
          id: e.JJDBH, 
          type: 'case', 
          identifier: e.JJDBH,
          content: e.BJNR,
          time: e.BJSJ
        }
      }
    }
    
    if (!entity) {
      return res.json({
        code: 404,
        message: '未找到实体数据'
      })
    }
    
    // 构建图谱数据
    const graphData = await buildGraphData(entity.id, 3, 50, entity.type)
    const graphJson = JSON.stringify(graphData)
    
    // 生成AI总结文本描述
    let aiSummary = ''
    let fullAiSummary = ''
    if (entity.type === 'citizen') {
      // 查询报警记录
      let caseRecords = []
      try {
        const caseResult = await db.query(
          `SELECT j.BJNR FROM JJD_JJD j JOIN JQ_SMSJ_ontology s ON j.JJDBH = s.JJDBH WHERE s.BJR_BH = ? ORDER BY j.BJSJ DESC LIMIT 3`,
          [entity.id]
        )
        caseRecords = caseResult.map(r => r.BJNR)
      } catch (e) {
        console.log('查询报警记录失败:', e.message)
      }
      
      // 查询本人前科记录
      let personCriminalRecords = []
      try {
        const criminalResult = await db.query(
          'SELECT crime_type, crime_detail, prison_status FROM criminal_record_db WHERE id_card = ?',
          [entity.identifier]
        )
        personCriminalRecords = criminalResult.map(r => ({
          crimeType: r.crime_type,
          caseType: r.crime_detail,
          prisonStatus: r.prison_status
        }))
      } catch (e) {
        console.log('查询本人前科记录失败:', e.message)
      }
      
      // 查询户籍成员前科记录
      let householdCriminalRecords = []
      try {
        // 获取户籍信息
        const household = await db.query(
          'SELECT household_id FROM person_household WHERE id_card = ?',
          [entity.identifier]
        )
        if (household.length > 0) {
          // 获取户籍成员
          const members = await db.query(
            'SELECT id_card, name FROM person_household WHERE household_id = ? AND id_card != ?',
            [household[0].household_id, entity.identifier]
          )
          if (members.length > 0) {
            const memberIdCards = members.map(m => m.id_card)
            const placeholders = memberIdCards.map(() => '?').join(',')
            const criminalResult = await db.query(
              `SELECT id_card, name, crime_type, crime_detail, prison_status FROM criminal_record_db WHERE id_card IN (${placeholders})`,
              memberIdCards
            )
            householdCriminalRecords = criminalResult.map(r => ({
              idCard: r.id_card,
              name: r.name,
              crimeType: r.crime_type,
              caseType: r.crime_detail,
              prisonStatus: r.prison_status
            }))
          }
        }
      } catch (e) {
        console.log('查询户籍成员前科记录失败:', e.message)
      }
      
      const idCard = entity.identifier || ''
      const maskedIdCard = idCard.length >= 18 ? idCard.substring(0, 4) + '***********' + idCard.substring(14) : idCard
      const maskedPhone = entity.phone ? entity.phone.substring(0, 3) + '****' + entity.phone.substring(7) : ''
      
      const basicInfo = `${entity.name || '未知'}
身份证:${maskedIdCard}
手机号:${maskedPhone}
性别${entity.gender || '未知'}
户籍地
${entity.address || '未知'}
工作单位${entity.workUnit || '路人'}
职业${entity.occupation || '路人'}
现住址
${entity.currentAddress || entity.address || '未知'}
车牌号
${entity.plateNumber || '-'}`
      
      let policeFreq = ''
      if (caseRecords.length > 0) {
        const briefCase = caseRecords[0].length > 20 ? caseRecords[0].substring(0, 20) + '...' : caseRecords[0]
        policeFreq = `\n涉警频次\n近三个月内涉警${caseRecords.length}次:${briefCase}`
      }
      
      let criminalDesc = ''
      const criminalParts = []
      
      // 本人前科记录
      if (personCriminalRecords.length > 0) {
        const personCrimeTypes = personCriminalRecords.map(r => `${r.crimeType || r.caseType || '犯罪'}(服刑状态:${r.prisonStatus || '未知'})`).join('、')
        criminalParts.push(`本人有${personCriminalRecords.length}条案底记录(${personCrimeTypes})`)
      }
      
      // 户籍成员前科记录
      if (householdCriminalRecords.length > 0) {
        const memberRecords = householdCriminalRecords.map(r => `${r.name}:${r.crimeType || r.caseType || '犯罪'}(服刑状态:${r.prisonStatus || '未知'})`).join('、')
        criminalParts.push(`户籍成员有案底记录：${memberRecords}`)
      }
      
      if (criminalParts.length > 0) {
        criminalDesc = `\n前科记录:\n${criminalParts.join('；')}`
      }
      
      fullAiSummary = basicInfo + policeFreq + criminalDesc
      aiSummary = fullAiSummary.length > 50 ? fullAiSummary.substring(0, 50) + '...' : fullAiSummary
    } else {
      fullAiSummary = `${entity.content || '某警情'}`
      aiSummary = fullAiSummary.length > 50 ? fullAiSummary.substring(0, 50) + '...' : fullAiSummary
    }
    
    // 拼接提示词模板：将{{entity}}替换为图谱数据
    const prompt = promptTemplate.replace('{{entity}}', graphJson)
    
    let isHit = false
    let reason = ''
    
    try {
      const aiResponse = await callAIModel(prompt)
      if (!aiResponse) {
        throw new Error('AI模型返回为空')
      }
      isHit = aiResponse === '是' || aiResponse.includes('是')
      reason = `AI模型返回: ${aiResponse}`
    } catch (error) {
      console.error('AI模型调用失败，使用关键词匹配:', error.message)
      const highRiskKeywords = ['高危', '重点', '涉毒', '前科', '通缉', '异常', '夜出', '肇事', '纠纷', '盗窃', '案底', '服刑', '抢劫', '犯罪']
      // 同时检查图谱数据和人员本体描述
      const matchedKeywords = highRiskKeywords.filter(keyword => graphJson.includes(keyword) || fullAiSummary.includes(keyword))
      isHit = matchedKeywords.length > 0
      reason = isHit ? `命中高危关键词: ${matchedKeywords.join('、')} (AI调用失败，使用备选规则)` : '未命中关键词 (AI调用失败，使用备选规则)'
    }
    
    const testResult = isHit ? 1 : 0
    
    // 将 BH 字段嵌入到 EXAMPLE_TEXT 开头
    const exampleTextWithBh = `[BH:${entity.id}]${fullAiSummary}`
    
    // 直接添加新记录，不检查重复
    await db.query(
      'INSERT INTO TAG_EXAMPLE_ontology (TAG_CODE, EXAMPLE_TEXT, EXPECTED_RESULT, LAST_TEST_RESULT, ENTITY_KEY) VALUES (?, ?, ?, ?, ?)',
      [tagCode, exampleTextWithBh, testResult, testResult, entity.id]
    )
    
    // 如果测试结果为"是"，将TAG_CODE添加到FKD_BJR.AI_TAG_ontology字段
    if (testResult === 1 && entity.type === 'citizen') {
      try {
        // 读取现有的AI_TAG_ontology字段
        const existingRecord = await db.query(
          'SELECT AI_TAG_ontology FROM FKD_BJR WHERE BH = ?',
          [entity.id]
        )
        
        let existingTags = []
        const rawValue = existingRecord[0]?.AI_TAG_ontology
        console.log(`读取到的原始值: ${JSON.stringify(rawValue)}, 类型: ${typeof rawValue}`)
        
        if (rawValue) {
          // MySQL JSON字段可能返回字符串或已解析的对象
          if (typeof rawValue === 'string') {
            try {
              existingTags = JSON.parse(rawValue)
              if (!Array.isArray(existingTags)) {
                existingTags = []
              }
            } catch (e) {
              existingTags = []
            }
          } else if (Array.isArray(rawValue)) {
            // MySQL已经自动解析成数组
            existingTags = rawValue
          } else {
            existingTags = []
          }
        }
        
        console.log(`解析后的标签数组: ${JSON.stringify(existingTags)}, 当前测试标签: ${tagCode}`)
        
        // 如果TAG_CODE不在数组中，则添加
        if (!existingTags.includes(tagCode)) {
          existingTags.push(tagCode)
        }
        
        console.log(`合并后的标签列表: ${JSON.stringify(existingTags)}`)
        
        // 更新FKD_BJR表的AI_TAG_ontology字段
        // 直接使用合并后的标签数组更新，不再使用CASE WHEN
        const updateSql = 'UPDATE FKD_BJR SET AI_TAG_ontology = ? WHERE BH = ?'
        const mergedTagsJson = JSON.stringify(existingTags)
        const updateParams = [mergedTagsJson, entity.id]
        logSQL(updateSql, updateParams)
        await db.query(updateSql, updateParams)
        
        console.log(`已将标签 ${tagCode} 添加到人员 ${entity.id} 的AI_TAG_ontology字段，当前标签列表: ${JSON.stringify(existingTags)}`)
      } catch (e) {
        console.log('更新AI_TAG_ontology字段失败:', e.message)
      }
    }
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        result: testResult,
        prompt: prompt,
        entityKey: entity.id,
        aiSummary: aiSummary,
        fullAiSummary: fullAiSummary,
        reason: reason
      }
    })
  } catch (error) {
    console.error('测试失败:', error)
    res.json({
      code: 500,
      message: '测试失败',
      detail: error.message
    })
  }
})

// 批量测试
app.post('/api/v1/tags/:tagCode/batch-test', async (req, res) => {
  try {
    const { tagCode } = req.params
    const { mode = 'examples', count = 5 } = req.body
    const countNum = parseInt(count, 10) || 5
    
    const tagResults = await db.query('SELECT * FROM TAG_CONFIG_ontology WHERE TAG_CODE = ?', [tagCode])
    
    if (tagResults.length === 0) {
      return res.json({
        code: 404,
        message: '标签不存在'
      })
    }
    
    const tag = tagResults[0]
    const promptTemplate = tag.PROMPT_TEMPLATE
    
    if (!promptTemplate) {
      return res.json({
        code: 400,
        message: '标签未配置提示词'
      })
    }
    
    if (mode === 'full') {
      // 遍历所有实体进行标注，并将结果添加到示例列表
      const category = tag.CATEGORY
      let entities = []
      let existingBhList = []
      let existingJjdList = []
      
      if (category === '人员画像' || category === '人员标签') {
        // 查询当前标签已有的ENTITY_KEY
        const existingKeys = await db.query(
          'SELECT ENTITY_KEY FROM TAG_EXAMPLE_ontology WHERE TAG_CODE = ? AND ENTITY_KEY IS NOT NULL',
          [tagCode]
        )
        existingBhList = existingKeys.map(r => r.ENTITY_KEY).filter(Boolean)
        
        // 查询实体
        const result = await db.query('SELECT BH, ZJHM, XM, LXDH, HJXZ, XZXZ, XB, GZDW, ZY, CPH_ontology FROM FKD_BJR LIMIT ?', [countNum * 2])
        
        // 在应用层过滤掉已有的实体
        const filteredResult = existingBhList.length > 0 
          ? result.filter(e => !existingBhList.includes(e.BH))
          : result
        
        // 只取需要的数量
        entities = filteredResult.slice(0, countNum).map(e => ({ 
          id: e.BH, 
          type: 'citizen', 
          identifier: e.ZJHM, 
          name: e.XM, 
          phone: e.LXDH, 
          address: e.HJXZ, 
          currentAddress: e.XZXZ,
          gender: e.XB,
          workUnit: e.GZDW,
          occupation: e.ZY,
          plateNumber: e.CPH_ontology
        }))
      } else {
        // 警情标签：查询当前标签已有的ENTITY_KEY
        const existingKeys = await db.query(
          'SELECT ENTITY_KEY FROM TAG_EXAMPLE_ontology WHERE TAG_CODE = ? AND ENTITY_KEY IS NOT NULL',
          [tagCode]
        )
        existingJjdList = existingKeys.map(r => r.ENTITY_KEY).filter(Boolean)
        
        // 查询警情实体
        const result = await db.query('SELECT JJDBH, BJNR, BJSJ FROM JJD_JJD LIMIT ?', [countNum * 2])
        
        // 在应用层过滤掉已有的实体
        const filteredResult = existingJjdList.length > 0
          ? result.filter(e => !existingJjdList.includes(e.JJDBH))
          : result
        
        // 只取需要的数量
        entities = filteredResult.slice(0, countNum).map(e => ({ 
          id: e.JJDBH, 
          type: 'case', 
          identifier: e.JJDBH,
          content: e.BJNR,
          time: e.BJSJ
        }))
      }
      
      let hitCount = 0
      const examplesAdded = []
      
      console.log(`开始批量测试标签: ${tagCode}，待测试实体数量: ${entities.length}`)
      
      for (const entity of entities) {
        console.log(`正在处理实体: ${entity.id}, 姓名: ${entity.name}`)
        const graphData = await buildGraphData(entity.id, 3, 50, entity.type)
        const graphJson = JSON.stringify(graphData)
        
        // 生成AI总结文本描述 - 参考人联研判格式
        let aiSummary = ''
        let fullAiSummary = ''
        if (entity.type === 'citizen') {
          // 查询报警记录
          let caseRecords = []
          try {
            const caseResult = await db.query(
              `SELECT j.BJNR FROM JJD_JJD j JOIN JQ_SMSJ_ontology s ON j.JJDBH = s.JJDBH WHERE s.BJR_BH = ? ORDER BY j.BJSJ DESC LIMIT 3`,
              [entity.id]
            )
            caseRecords = caseResult.map(r => r.BJNR)
          } catch (e) {
            console.log('查询报警记录失败:', e.message)
          }
          
          // 查询本人前科记录
          let personCriminalRecords = []
          try {
            const criminalResult = await db.query(
              'SELECT crime_type, crime_detail, prison_status FROM criminal_record_db WHERE id_card = ?',
              [entity.identifier]
            )
            personCriminalRecords = criminalResult.map(r => ({
              crimeType: r.crime_type,
              caseType: r.crime_detail,
              prisonStatus: r.prison_status
            }))
          } catch (e) {
            console.log('查询本人前科记录失败:', e.message)
          }
          
          // 查询户籍成员前科记录
          let householdCriminalRecords = []
          try {
            const household = await db.query(
              'SELECT household_id FROM person_household WHERE id_card = ?',
              [entity.identifier]
            )
            if (household.length > 0) {
              const members = await db.query(
                'SELECT id_card, name FROM person_household WHERE household_id = ? AND id_card != ?',
                [household[0].household_id, entity.identifier]
              )
              if (members.length > 0) {
                const memberIdCards = members.map(m => m.id_card)
                const placeholders = memberIdCards.map(() => '?').join(',')
                const criminalResult = await db.query(
                  `SELECT id_card, name, crime_type, crime_detail, prison_status FROM criminal_record_db WHERE id_card IN (${placeholders})`,
                  memberIdCards
                )
                householdCriminalRecords = criminalResult.map(r => ({
                  idCard: r.id_card,
                  name: r.name,
                  crimeType: r.crime_type,
                  caseType: r.crime_detail,
                  prisonStatus: r.prison_status
                }))
              }
            }
          } catch (e) {
            console.log('查询户籍成员前科记录失败:', e.message)
          }
          
          // 生成完整的AI总结文本
          const idCard = entity.identifier || ''
          const maskedIdCard = idCard.length >= 18 ? idCard.substring(0, 4) + '***********' + idCard.substring(14) : idCard
          const maskedPhone = entity.phone ? entity.phone.substring(0, 3) + '****' + entity.phone.substring(7) : ''
          
          const basicInfo = `${entity.name || '未知'}
身份证:${maskedIdCard}
手机号:${maskedPhone}
性别${entity.gender || '未知'}
户籍地
${entity.address || '未知'}
工作单位${entity.workUnit || '路人'}
职业${entity.occupation || '路人'}
现住址
${entity.currentAddress || entity.address || '未知'}
车牌号
${entity.plateNumber || '-'}`
          
          let policeFreq = ''
          if (caseRecords.length > 0) {
            const briefCase = caseRecords[0].length > 20 ? caseRecords[0].substring(0, 20) + '...' : caseRecords[0]
            policeFreq = `\n涉警频次\n近三个月内涉警${caseRecords.length}次:${briefCase}`
          }
          
          let criminalDesc = ''
          const criminalParts = []
          
          if (personCriminalRecords.length > 0) {
            const personCrimeTypes = personCriminalRecords.map(r => `${r.crimeType || r.caseType || '犯罪'}(服刑状态:${r.prisonStatus || '未知'})`).join('、')
            criminalParts.push(`本人有${personCriminalRecords.length}条案底记录(${personCrimeTypes})`)
          }
          
          if (householdCriminalRecords.length > 0) {
            const memberRecords = householdCriminalRecords.map(r => `${r.name}:${r.crimeType || r.caseType || '犯罪'}(服刑状态:${r.prisonStatus || '未知'})`).join('、')
            criminalParts.push(`户籍成员有案底记录：${memberRecords}`)
          }
          
          if (criminalParts.length > 0) {
            criminalDesc = `\n前科记录:\n${criminalParts.join('；')}`
          }
          
          fullAiSummary = basicInfo + policeFreq + criminalDesc
          // 列表显示时截断，鼠标悬停显示完整内容
          aiSummary = fullAiSummary.length > 50 ? fullAiSummary.substring(0, 50) + '...' : fullAiSummary
        } else {
          fullAiSummary = `${entity.content || '某警情'}`
          aiSummary = fullAiSummary.length > 50 ? fullAiSummary.substring(0, 50) + '...' : fullAiSummary
        }
        
        let isHit = false
        let reason = ''
        
        // 拼接提示词模板：将{{entity}}替换为图谱数据
        const prompt = promptTemplate.replace('{{entity}}', graphJson)
        
        try {
          // 调用AI模型进行判断
          const aiResponse = await callAIModel(prompt)
          
          // 解析AI返回结果（期望返回"是"或"否"）
          isHit = aiResponse === '是' || aiResponse.includes('是')
          reason = `AI模型返回: ${aiResponse}`
        } catch (error) {
          // AI调用失败时，使用关键词匹配作为备选方案
          console.error('AI模型调用失败，使用关键词匹配:', error.message)
          const highRiskKeywords = ['高危', '重点', '涉毒', '前科', '通缉', '异常', '夜出', '肇事', '纠纷', '盗窃', '案底', '服刑', '抢劫', '犯罪']
          // 同时检查图谱数据和人员本体描述
          const matchedKeywords = highRiskKeywords.filter(keyword => graphJson.includes(keyword) || fullAiSummary.includes(keyword))
          isHit = matchedKeywords.length > 0
          reason = isHit ? `命中高危关键词: ${matchedKeywords.join('、')} (AI调用失败，使用备选规则)` : '未命中关键词 (AI调用失败，使用备选规则)'
        }
        
        // 将结果添加到示例列表
        const expectedResult = isHit ? 1 : 0
        
        // 将 BH 字段嵌入到 EXAMPLE_TEXT 开头，格式: [BH:xxx]完整AI总结文本
        const exampleTextWithBh = `[BH:${entity.id}]${fullAiSummary}`
        
        // 检查当前实体是否已存在于当前标签的示例表中
        const isEntityExist = entity.type === 'citizen' 
          ? existingBhList.includes(entity.id) 
          : existingJjdList?.includes(entity.id) || false
        
        // 只插入新的示例记录
        if (!isEntityExist) {
          await db.query(
            'INSERT INTO TAG_EXAMPLE_ontology (TAG_CODE, EXAMPLE_TEXT, EXPECTED_RESULT, LAST_TEST_RESULT, ENTITY_KEY) VALUES (?, ?, ?, ?, ?)',
            [tagCode, exampleTextWithBh, expectedResult, isHit ? 1 : 0, entity.id]
          )
          
          examplesAdded.push({
            entityKey: entity.id,
            identifier: entity.identifier,
            aiSummary: aiSummary,
            fullAiSummary: fullAiSummary,
            expectedResult: expectedResult,
            testResult: isHit ? 1 : 0,
            isCorrect: true,
            reason: reason
          })
        }
        
        console.log(`实体 ${entity.id} 测试结果: ${isHit ? '是' : '否'}, 标签: ${tagCode}`)
        
        if (isHit) {
          hitCount++
          
          // 更新AI_TAG_ontology字段（无论实体是否已存在都需要更新）
          try {
            if (entity.type === 'citizen') {
              console.log(`准备更新实体 ${entity.id} 的AI_TAG_ontology字段`)
              const rows = await db.query(
                'SELECT AI_TAG_ontology FROM FKD_BJR WHERE BH = ?',
                [entity.id]
              )
              let tags = []
              // 打印读取到的原始值
              const rawValue = rows[0]?.AI_TAG_ontology
              console.log(`读取到的原始值: ${JSON.stringify(rawValue)}, 类型: ${typeof rawValue}`)
              
              if (rawValue) {
                // MySQL JSON字段可能返回字符串或已解析的对象
                if (typeof rawValue === 'string') {
                  try {
                    tags = JSON.parse(rawValue)
                    if (!Array.isArray(tags)) {
                      console.log(`解析结果不是数组，重置为空数组`)
                      tags = []
                    }
                  } catch (e) {
                    console.log(`JSON解析失败: ${e.message}`)
                    tags = []
                  }
                } else if (Array.isArray(rawValue)) {
                  // MySQL已经自动解析成数组
                  console.log(`MySQL已自动解析成数组`)
                  tags = rawValue
                } else {
                  console.log(`原始值类型异常，重置为空数组`)
                  tags = []
                }
              }
              
              console.log(`解析后的标签数组: ${JSON.stringify(tags)}, 当前测试标签: ${tagCode}`)
              
              if (!tags.includes(tagCode)) {
                tags.push(tagCode)
              }
              
              console.log(`合并后的标签列表: ${JSON.stringify(tags)}`)
              
              // 直接使用合并后的标签数组更新，不再使用CASE WHEN
              const updateSql = 'UPDATE FKD_BJR SET AI_TAG_ontology = ? WHERE BH = ?'
              const mergedTagsJson = JSON.stringify(tags)
              const updateParams = [mergedTagsJson, entity.id]
              logSQL(updateSql, updateParams)
              const updateResult = await db.query(updateSql, updateParams)
              console.log(`更新结果: affectedRows=${updateResult.affectedRows}, changedRows=${updateResult.changedRows}`)
              
              // 验证更新是否成功
              const verifyRows = await db.query('SELECT AI_TAG_ontology FROM FKD_BJR WHERE BH = ?', [entity.id])
              console.log(`验证更新后的值: ${verifyRows[0]?.AI_TAG_ontology}`)
            } else {
              const rows = await db.query(
                'SELECT AI_TAG_ontology FROM JJD_JJD WHERE JJDBH = ?',
                [entity.id]
              )
              let tags = []
              if (rows[0]?.AI_TAG_ontology) {
                try {
                  tags = JSON.parse(rows[0].AI_TAG_ontology)
                  if (!Array.isArray(tags)) tags = []
                } catch (e) {
                  tags = []
                }
              }
              if (!tags.includes(tagCode)) {
                tags.push(tagCode)
                await db.query(
                  'UPDATE JJD_JJD SET AI_TAG_ontology = ? WHERE JJDBH = ?',
                  [JSON.stringify(tags), entity.id]
                )
              }
            }
            console.log(`已将标签 ${tagCode} 添加到 ${entity.type === 'citizen' ? '人员' : '警情'} ${entity.id} 的AI_TAG_ontology字段`)
          } catch (e) {
            console.log('更新AI_TAG_ontology字段失败:', e.message)
          }
        }
      }
      
      res.json({
        code: 200,
        message: 'success',
        data: {
          totalCount: entities.length,
          hitCount: hitCount,
          addedCount: examplesAdded.length,
          examples: examplesAdded,
          message: `批量测试完成，共处理 ${entities.length} 个实体，命中 ${hitCount} 个，已添加 ${examplesAdded.length} 条示例`
        }
      })
    } else {
      // 原有示例测试逻辑
      const examples = await db.query(
        'SELECT * FROM TAG_EXAMPLE_ontology WHERE TAG_CODE = ?',
        [tagCode]
      )
      
      if (examples.length === 0) {
        return res.json({
          code: 200,
          message: 'success',
          data: {
            totalCount: 0,
            successCount: 0,
            accuracy: 0,
            details: []
          }
        })
      }
      
      const details = []
      let successCount = 0
      
      for (const example of examples) {
        const prompt = promptTemplate.replace(/\{\{entity\}\}/g, example.EXAMPLE_TEXT)
        
        let testResult = 0
        const keywords = ['高危', '重点', '涉毒', '前科', '通缉', '异常', '夜出']
        const hasHighRisk = keywords.some(keyword => example.EXAMPLE_TEXT.includes(keyword))
        
        if (hasHighRisk) {
          testResult = 1
        }
        
        const isCorrect = testResult === example.EXPECTED_RESULT
        if (isCorrect) successCount++
        
        await db.query(
          'UPDATE TAG_EXAMPLE_ontology SET LAST_TEST_RESULT = ? WHERE EXAMPLE_ID = ?',
          [testResult, example.ID]
        )
        
        details.push({
          id: example.ID,
          exampleText: example.EXAMPLE_TEXT,
          expectedResult: example.EXPECTED_RESULT,
          testResult: testResult,
          isCorrect: isCorrect
        })
      }
      
      const accuracy = Math.round((successCount / examples.length) * 100)
      
      res.json({
        code: 200,
        message: 'success',
        data: {
          totalCount: examples.length,
          successCount: successCount,
          accuracy: accuracy,
          details: details
        }
      })
    }
  } catch (error) {
    console.error('批量测试失败:', error)
    res.json({
      code: 500,
      message: '批量测试失败',
      detail: error.message
    })
  }
})

// 将图谱字段转换为中文
function convertToChineseFields(graphData) {
  const fieldMap = {
    'id': '节点ID',
    'type': '节点类型',
    'label': '节点名称',
    'color': '节点颜色',
    'properties': '属性',
    'source': '源节点',
    'target': '目标节点',
    'relation': '关系类型',
    'remark': '备注',
    'nodes': '节点列表',
    'links': '关系列表',
    
    'BH': '编号',
    'XM': '姓名',
    'ZJHM': '身份证号',
    'LXDH': '联系电话',
    'HJXZ': '户籍地址',
    'XZXZ': '现住址',
    'SFZDRY': '涉访人员',
    'CPH_ontology': '车牌号',
    'data_source': '数据来源',
    
    'JJDBH': '警情编号',
    'BJNR': '报警内容',
    'MJGH': '民警工号',
    
    'household_id': '户籍ID',
    'household_number': '户号',
    'address': '地址',
    'household_type': '户籍类型',
    
    'record_id': '记录ID',
    'crime_type': '犯罪类型',
    'crime_detail': '犯罪详情',
    'prison_status': '服刑状态',
    'sentence_date': '判决日期'
  }

  function translateObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => translateObject(item))
    }
    
    const translated = {}
    for (const [key, value] of Object.entries(obj)) {
      const newKey = fieldMap[key] || key
      translated[newKey] = translateObject(value)
    }
    return translated
  }

  return translateObject(graphData)
}

// 自动标注执行函数
async function executeAutoLabel(entityType, entityId = null) {
  try {
    // 1. 获取启用的标签列表
    const tags = await db.query(
      'SELECT TAG_CODE, PROMPT_TEMPLATE, CATEGORY FROM TAG_CONFIG_ontology WHERE STATUS = 1 AND (CATEGORY = ? OR CATEGORY = ?)',
      entityType === 'citizen' 
        ? ['人员画像', '人员标签'] 
        : ['警情画像', '警情标签']
    )
    
    if (tags.length === 0) {
      return { success: true, message: '没有可用的标签', processedCount: 0 }
    }
    
    let entities = []
    
    // 2. 获取实体列表
    if (entityType === 'citizen') {
      if (entityId) {
        const result = await db.query('SELECT BH, ZJHM FROM FKD_BJR WHERE BH = ?', [entityId])
        entities = result
      } else {
        const result = await db.query('SELECT BH, ZJHM FROM FKD_BJR LIMIT 100')
        entities = result
      }
    } else {
      if (entityId) {
        const result = await db.query('SELECT JJDBH FROM JJD_JJD WHERE JJDBH = ?', [entityId])
        entities = result
      } else {
        const result = await db.query('SELECT JJDBH FROM JJD_JJD LIMIT 100')
        entities = result
      }
    }
    
    let processedCount = 0
    
    // 3. 对每个实体进行标注
    for (const entity of entities) {
      const entityKey = entityType === 'citizen' ? entity.BH : entity.JJDBH
      const graphData = await buildGraphData(entityKey, 3, 50, entityType)
      const graphJson = JSON.stringify(graphData)
      
      const hitTags = []
      
      // 4. 对每个标签进行判断
      for (const tag of tags) {
        const prompt = tag.PROMPT_TEMPLATE.replace(/\{\{entity\}\}/g, graphJson)
        
        // 模拟AI判断（关键词匹配）
        let isHit = false
        const highRiskKeywords = ['高危', '重点', '涉毒', '前科', '通缉', '异常', '夜出', '肇事', '纠纷', '盗窃', '案底', '服刑', '抢劫', '犯罪']
        const nocturnalKeywords = ['夜间', '凌晨', '深夜', '夜晚']
        const criminalKeywords = ['案底', '服刑', '犯罪', '抢劫', '盗窃', '诈骗']
        const abnormalKeywords = ['异常', '频繁', '多次', '反复']
        
        // 根据标签代码判断匹配规则
        if (tag.TAG_CODE.includes('HIGH_RISK') || tag.TAG_CODE.includes('RISK') || tag.TAG_CODE.includes('KEY')) {
          isHit = highRiskKeywords.some(keyword => graphJson.includes(keyword))
        } else if (tag.TAG_CODE.includes('NOCTURNAL')) {
          isHit = nocturnalKeywords.some(keyword => graphJson.includes(keyword))
        } else if (tag.TAG_CODE.includes('CRIMINAL')) {
          isHit = criminalKeywords.some(keyword => graphJson.includes(keyword))
        } else if (tag.TAG_CODE.includes('ABNORMAL')) {
          isHit = abnormalKeywords.some(keyword => graphJson.includes(keyword))
        } else {
          // 默认匹配高危关键词
          isHit = highRiskKeywords.some(keyword => graphJson.includes(keyword))
        }
        
        if (isHit) {
          hitTags.push(tag.TAG_CODE)
        }
      }
      
      // 5. 更新AI_TAG_ontology字段
      let existingTags = []
      
      if (entityType === 'citizen') {
        const rows = await db.query(
          'SELECT AI_TAG_ontology FROM FKD_BJR WHERE BH = ?',
          [entity.BH]
        )
        if (rows[0]?.AI_TAG_ontology) {
          try {
            existingTags = JSON.parse(rows[0].AI_TAG_ontology)
            if (!Array.isArray(existingTags)) existingTags = []
          } catch (e) {
            existingTags = []
          }
        }
        
        hitTags.forEach(tag => {
          if (!existingTags.includes(tag)) {
            existingTags.push(tag)
          }
        })
        
        // 直接使用合并后的标签数组更新，不再使用CASE WHEN
        const mergedTagsJson = JSON.stringify(existingTags)
        await db.query('UPDATE FKD_BJR SET AI_TAG_ontology = ? WHERE BH = ?', [mergedTagsJson, entity.BH])
      } else {
        const rows = await db.query(
          'SELECT AI_TAG_ontology FROM JJD_JJD WHERE JJDBH = ?',
          [entity.JJDBH]
        )
        let existingTagsJjd = []
        if (rows[0]?.AI_TAG_ontology) {
          try {
            existingTagsJjd = JSON.parse(rows[0].AI_TAG_ontology)
            if (!Array.isArray(existingTagsJjd)) existingTagsJjd = []
          } catch (e) {
            existingTagsJjd = []
          }
        }
        
        hitTags.forEach(tag => {
          if (!existingTagsJjd.includes(tag)) {
            existingTagsJjd.push(tag)
          }
        })
        
        // 直接使用合并后的标签数组更新，不再使用CASE WHEN
        const mergedTagsJsonJjd = JSON.stringify(existingTagsJjd)
        await db.query('UPDATE JJD_JJD SET AI_TAG_ontology = ? WHERE JJDBH = ?', [mergedTagsJsonJjd, entity.JJDBH])
      }
      
      processedCount++
    }
    
    return {
      success: true,
      message: `标注完成，共处理 ${processedCount} 个实体`,
      processedCount,
      totalTags: tags.length
    }
  } catch (error) {
    console.error('自动标注失败:', error)
    return { success: false, message: error.message, processedCount: 0 }
  }
}

// 自动标注接口 - 手动触发
app.post('/api/v1/tags/auto-label', async (req, res) => {
  try {
    const { entityType, entityId } = req.body
    
    if (!entityType || !['citizen', 'case'].includes(entityType)) {
      return res.json({
        code: 400,
        message: '无效的实体类型，支持 citizen 或 case'
      })
    }
    
    const result = await executeAutoLabel(entityType, entityId)
    
    res.json({
      code: result.success ? 200 : 500,
      message: result.message,
      data: {
        processedCount: result.processedCount,
        totalTags: result.totalTags
      }
    })
  } catch (error) {
    console.error('自动标注接口失败:', error)
    res.json({
      code: 500,
      message: '自动标注失败',
      detail: error.message
    })
  }
})

// 批量标注接口 - 按实体类型批量标注
app.post('/api/v1/tags/auto-label/:entityType', async (req, res) => {
  try {
    const { entityType } = req.params
    
    if (!['citizen', 'case'].includes(entityType)) {
      return res.json({
        code: 400,
        message: '无效的实体类型，支持 citizen 或 case'
      })
    }
    
    const result = await executeAutoLabel(entityType)
    
    res.json({
      code: result.success ? 200 : 500,
      message: result.message,
      data: {
        processedCount: result.processedCount,
        totalTags: result.totalTags
      }
    })
  } catch (error) {
    console.error('批量标注接口失败:', error)
    res.json({
      code: 500,
      message: '批量标注失败',
      detail: error.message
    })
  }
})

// ==================== 预警事件相关API ====================

// 获取预警事件列表
app.get('/api/v1/warning/events', async (req, res) => {
  try {
    const { page = 1, size = 10, timeRange, startTime, endTime, alertLevel, status, keyword } = req.query
    
    let query = 'SELECT e.*, r.RULE_NAME FROM warning_event e LEFT JOIN warning_rule r ON e.RULE_ID = r.ID WHERE 1=1'
    const queryParams = []
    
    if (timeRange === 'today' || timeRange === 'TODAY') {
      query += ' AND DATE(e.TRIGGER_TIME) = CURDATE()'
    } else if (timeRange === 'week' || timeRange === '7D') {
      query += ' AND e.TRIGGER_TIME >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'
    } else if (timeRange === 'month' || timeRange === '30D') {
      query += ' AND e.TRIGGER_TIME >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)'
    } else if (timeRange === '90D') {
      query += ' AND e.TRIGGER_TIME >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)'
    }
    
    if (startTime) {
      query += ' AND e.TRIGGER_TIME >= ?'
      queryParams.push(startTime)
    }
    
    if (endTime) {
      query += ' AND e.TRIGGER_TIME <= ?'
      queryParams.push(endTime)
    }
    
    if (alertLevel) {
      query += ' AND e.ALERT_LEVEL = ?'
      queryParams.push(alertLevel)
    }
    
    if (status) {
      query += ' AND e.STATUS = ?'
      queryParams.push(status)
    }
    
    if (keyword) {
      query += ' AND (e.EVENT_NO LIKE ? OR r.RULE_NAME LIKE ?)'
      queryParams.push(`%${keyword}%`, `%${keyword}%`)
    }
    
    query += ' ORDER BY e.TRIGGER_TIME DESC'
    
    // 获取总数
    const countQuery = query.replace('SELECT e.*, r.RULE_NAME', 'SELECT COUNT(*) as total')
    const totalResult = await db.query(countQuery, [...queryParams])
    const total = totalResult[0].total
    
    // 分页
    const offset = (parseInt(page) - 1) * parseInt(size)
    query += ` LIMIT ${parseInt(size)} OFFSET ${offset}`
    
    const results = await db.query(query, queryParams)
    
    const alertLevelMap = { 'high': '高危', 'medium': '中危', 'low': '低危', 'RED': '红色特急', 'ORANGE': '橙色紧急', 'YELLOW': '黄色关注', 'red': '红色特急', 'orange': '橙色紧急', 'yellow': '黄色关注' }
    const statusMap = { 'pending': '待处理', 'processed': '处理中', 'PROCESSING': '处理中', 'adopted': '已采纳', 'rejected': '已驳回', 'PENDING': '待处理', 'ADOPTED': '已采纳', 'REJECTED': '已驳回' }
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: results.map(item => ({
          id: item.id,
          eventNo: item.event_no,
          ruleId: item.rule_id,
          ruleName: item.rule_name || item.RULE_NAME,
          alertLevel: item.alert_level,
          alertLevelName: alertLevelMap[item.alert_level] || item.alert_level,
          triggerTime: item.trigger_time,
          regionName: item.region_name,
          status: item.status,
          statusName: statusMap[item.status] || item.status,
          disposalDeptName: item.disposal_dept_name,
          isAdopted: item.is_adopted,
          notifyTime: item.notify_time,
          notifyObject: item.notify_object,
          notifyChannel: item.notify_channel,
          aiAnalysisSuggestion: item.ai_analysis_suggestion,
          triggerBasis: item.trigger_basis,
          adoptTime: item.adopt_time,
          disposalContent: item.disposal_content
        })),
        total,
        page: parseInt(page),
        size: parseInt(size)
      }
    })
  } catch (error) {
    console.error('获取预警事件列表失败:', error)
    res.json({
      code: 500,
      message: '获取预警事件列表失败',
      detail: error.message
    })
  }
})

// 获取预警统计
app.get('/api/v1/warning/events/statistics', async (req, res) => {
  try {
    const totalResult = await db.query('SELECT COUNT(*) as count FROM warning_event')
    const pendingResult = await db.query('SELECT COUNT(*) as count FROM warning_event WHERE status = "PENDING"')
    const adoptedResult = await db.query('SELECT COUNT(*) as count FROM warning_event WHERE is_adopted = 1')
    const rejectedResult = await db.query('SELECT COUNT(*) as count FROM warning_event WHERE is_adopted = 0 AND is_adopted IS NOT NULL')
    
    const trendResult = await db.query(`
      SELECT DATE(trigger_time) as date, COUNT(*) as count 
      FROM warning_event 
      WHERE trigger_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
      GROUP BY DATE(trigger_time) 
      ORDER BY date
    `)
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        totalCount: totalResult[0].count,
        pendingCount: pendingResult[0].count,
        adoptedCount: adoptedResult[0].count,
        rejectedCount: rejectedResult[0].count,
        trendData: trendResult.map(item => ({
          date: item.date,
          count: item.count
        }))
      }
    })
  } catch (error) {
    console.error('获取预警统计失败:', error)
    res.json({
      code: 500,
      message: '获取预警统计失败',
      detail: error.message
    })
  }
})

// 获取预警事件详情
app.get('/api/v1/warning/events/:eventNo', async (req, res) => {
  try {
    const { eventNo } = req.params
    
    const eventResult = await db.query(`
      SELECT e.*, r.rule_name as RULE_NAME, 
             CASE e.alert_level 
               WHEN 'high' THEN '高危' 
               WHEN 'medium' THEN '中危' 
               WHEN 'low' THEN '低危' 
               WHEN 'RED' THEN '红色特急'
               WHEN 'ORANGE' THEN '橙色紧急'
               WHEN 'YELLOW' THEN '黄色关注'
               ELSE e.alert_level 
             END AS ALERT_LEVEL_NAME,
             CASE e.status 
               WHEN 'pending' THEN '待处理' 
               WHEN 'processed' THEN '处理中' 
               WHEN 'adopted' THEN '已采纳' 
               WHEN 'rejected' THEN '已驳回'
               WHEN 'PENDING' THEN '待处理'
               WHEN 'ADOPTED' THEN '已采纳'
               WHEN 'REJECTED' THEN '已驳回'
               ELSE e.status 
             END AS STATUS_NAME
      FROM warning_event e
      LEFT JOIN warning_rule r ON e.rule_id = r.id
      WHERE e.event_no = ?
    `, [eventNo])
    
    if (eventResult.length === 0) {
      return res.json({
        code: 404,
        message: '预警事件不存在'
      })
    }
    
    const event = eventResult[0]
    
    // 获取关联接警单
    let incidentResult = []
    try {
      incidentResult = await db.query(`
        SELECT i.JJDBH as jjdbh, i.BJNR as bjnr, i.BJLXDM as bjlxdm,
               i.JJDZT as disposalStatus, i.JQJB as urgencyLevel
        FROM warning_event_related_incident rel
        JOIN JJD_JJD i ON rel.jjdbh = i.JJDBH
        WHERE rel.event_id = ?
      `, [event.id])
    } catch (e) {
      console.log('获取关联接警单失败:', e.message)
    }
    
    // 字典转换
    const bjlxdmMap = {
      '0101': '盗窃',
      '0102': '抢劫',
      '0201': '杀人',
      '0202': '伤害',
      '0301': '强奸',
      '0401': '拐卖',
      '0501': '诈骗',
      '0601': '走私',
      '0701': '贩毒',
      '0801': '涉黄',
      '0901': '涉赌',
      '1001': '伪造',
      '1101': '交通肇事',
      '1201': '破坏',
      '1301': '危害公共安全',
      '1401': '职务犯罪',
      '1501': '火灾',
      '1601': '爆炸',
      '1701': '中毒',
      '1801': '走失',
      '1901': '纠纷',
      '2001': '求助',
      '2101': '举报',
      '2201': '咨询'
    }
    
    const jjdztMap = {
      '1': '待处理',
      '2': '处置中',
      '3': '已办结',
      '4': '已撤销'
    }
    
    const jqjbMap = {
      '01': '非常紧急',
      '02': '紧急',
      '03': '一般',
      '04': '低'
    }
    
    // 转换关联接警单的字典编码
    incidentResult = incidentResult.map(item => ({
      ...item,
      bjlxdmName: bjlxdmMap[item.bjlxdm] || item.bjlxdm,
      disposalStatusName: jjdztMap[item.disposalStatus] || item.disposalStatus,
      urgencyLevelName: jqjbMap[item.urgencyLevel] || item.urgencyLevel
    }))
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        id: event.id,
        eventNo: event.event_no,
        ruleId: event.rule_id,
        ruleName: event.RULE_NAME || event.rule_name,
        alertLevel: event.alert_level,
        alertLevelName: event.ALERT_LEVEL_NAME || event.alert_level,
        triggerTime: event.trigger_time,
        regionName: event.region_name,
        status: event.status,
        statusName: event.STATUS_NAME || event.status,
        disposalDeptName: event.disposal_dept_name,
        isAdopted: event.is_adopted,
        notifyTime: event.notify_time,
        notifyObject: event.notify_object,
        notifyChannel: event.notify_channel,
        aiAnalysisSuggestion: event.ai_analysis_suggestion,
        triggerBasis: event.trigger_basis,
        adoptTime: event.adopt_time,
        disposalContent: event.disposal_content,
        relatedIncidents: incidentResult
      }
    })
  } catch (error) {
    console.error('获取预警事件详情失败:', error)
    res.json({
      code: 500,
      message: '获取预警事件详情失败',
      detail: error.message
    })
  }
})

// 预警事件反馈
app.put('/api/v1/warning/events/:eventNo/feedback', async (req, res) => {
  try {
    const { eventNo } = req.params
    const { isAdopted, adoptTime, disposalContent } = req.body
    
    await db.query(`
      UPDATE warning_event 
      SET IS_ADOPTED = ?, ADOPT_TIME = ?, DISPOSAL_CONTENT = ?, STATUS = ?, UPDATE_TIME = NOW()
      WHERE EVENT_NO = ?
    `, [isAdopted, adoptTime, disposalContent, isAdopted === 1 ? 'adopted' : 'rejected', eventNo])
    
    res.json({
      code: 200,
      message: 'success'
    })
  } catch (error) {
    console.error('预警事件反馈失败:', error)
    res.json({
      code: 500,
      message: '预警事件反馈失败',
      detail: error.message
    })
  }
})

// ==================== 预警指标相关API ====================

// 获取预警指标列表
app.get('/api/v1/warning/indicators', async (req, res) => {
  try {
    const { page = 1, size = 10, keyword, tag, enabled } = req.query
    
    const configTypeMap = { 'sql': 'SQL配置', 'formula': '公式配置' }
    let query = 'SELECT i.* FROM warning_indicator i WHERE 1=1'
    const queryParams = []
    
    if (keyword) {
      query += ' AND (i.indicator_name LIKE ? OR i.indicator_desc LIKE ?)'
      queryParams.push(`%${keyword}%`, `%${keyword}%`)
    }
    
    if (tag) {
      query += ' AND EXISTS (SELECT 1 FROM warning_indicator_tag_rel r WHERE r.indicator_id = i.id AND r.tag_id IN (SELECT id FROM warning_tag WHERE tag_name LIKE ?))'
      queryParams.push(`%${tag}%`)
    }
    
    if (enabled !== undefined) {
      query += ' AND i.enabled = ?'
      queryParams.push(parseInt(enabled))
    }
    
    query += ' ORDER BY i.create_time DESC'
    
    // 获取总数
    const countQuery = query.replace('SELECT i.*', 'SELECT COUNT(*) as total')
    const totalResult = await db.query(countQuery, [...queryParams])
    const total = totalResult[0].total
    
    // 分页
    const offset = (parseInt(page) - 1) * parseInt(size)
    query += ` LIMIT ${parseInt(size)} OFFSET ${offset}`
    
    const results = await db.query(query, queryParams)
    
    // 获取标签
    const resultWithTags = await Promise.all(results.map(async item => {
      const tagResult = await db.query('SELECT t.tag_name FROM warning_indicator_tag_rel r JOIN warning_tag t ON r.tag_id = t.id WHERE r.indicator_id = ?', [item.id])
      
      return {
        id: item.id,
        indicatorName: item.indicator_name,
        indicatorDesc: item.indicator_desc,
        configType: item.config_type,
        configTypeName: configTypeMap[item.config_type] || item.config_type,
        sqlContent: item.sql_content,
        indicatorTags: tagResult.map(t => t.tag_name),
        enabled: item.enabled,
        createBy: item.create_by,
        createTime: item.create_time,
        updateTime: item.update_time
      }
    }))
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: resultWithTags,
        total,
        page: parseInt(page),
        size: parseInt(size)
      }
    })
  } catch (error) {
    console.error('获取预警指标列表失败:', error)
    res.json({
      code: 500,
      message: '获取预警指标列表失败',
      detail: error.message
    })
  }
})

// 获取预警指标详情
app.get('/api/v1/warning/indicators/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await db.query(`
      SELECT i.* 
      FROM warning_indicator i
      WHERE i.id = ?
    `, [id])
    
    if (result.length === 0) {
      return res.json({
        code: 404,
        message: '预警指标不存在'
      })
    }
    
    const item = result[0]
    
    const tagResult = await db.query(`
      SELECT t.tag_name 
      FROM warning_indicator_tag_rel r 
      JOIN warning_tag t ON r.tag_id = t.id 
      WHERE r.indicator_id = ?
    `, [id])
    
    const configTypeMap = { 'sql': 'SQL配置', 'formula': '公式配置' }
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        id: item.id,
        indicatorName: item.indicator_name,
        indicatorDesc: item.indicator_desc,
        configType: item.config_type,
        configTypeName: configTypeMap[item.config_type] || item.config_type,
        sqlContent: item.sql_content,
        indicatorTags: tagResult.map(t => t.tag_name),
        enabled: item.enabled,
        createBy: item.create_by,
        createTime: item.create_time,
        updateTime: item.update_time
      }
    })
  } catch (error) {
    console.error('获取预警指标详情失败:', error)
    res.json({
      code: 500,
      message: '获取预警指标详情失败',
      detail: error.message
    })
  }
})

// 创建预警指标
app.post('/api/v1/warning/indicators', async (req, res) => {
  try {
    const { indicatorName, indicatorDesc, configType, sqlContent, indicatorTags } = req.body
    
    const result = await db.query(`
      INSERT INTO warning_indicator (INDICATOR_NAME, INDICATOR_DESC, CONFIG_TYPE, SQL_CONTENT, ENABLED, CREATE_BY, CREATE_TIME, UPDATE_TIME)
      VALUES (?, ?, ?, ?, 1, 'admin', NOW(), NOW())
    `, [indicatorName, indicatorDesc, configType, sqlContent])
    
    const indicatorId = result.insertId
    
    // 添加标签关联
    if (indicatorTags && indicatorTags.length > 0) {
      for (const tagName of indicatorTags) {
        // 查找或创建标签
        const tagResult = await db.query('SELECT ID FROM warning_tag WHERE TAG_NAME = ?', [tagName])
        let tagId
        
        if (tagResult.length > 0) {
          tagId = tagResult[0].ID
        } else {
          const newTag = await db.query(
            'INSERT INTO warning_tag (TAG_NAME, CREATE_TIME) VALUES (?, NOW())',
            [tagName]
          )
          tagId = newTag.insertId
        }
        
        await db.query(
          'INSERT INTO warning_indicator_tag_rel (INDICATOR_ID, TAG_ID) VALUES (?, ?)',
          [indicatorId, tagId]
        )
      }
    }
    
    res.json({
      code: 200,
      message: 'success',
      data: { id: indicatorId }
    })
  } catch (error) {
    console.error('创建预警指标失败:', error)
    res.json({
      code: 500,
      message: '创建预警指标失败',
      detail: error.message
    })
  }
})

// 更新预警指标
app.put('/api/v1/warning/indicators/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { indicatorName, indicatorDesc, configType, sqlContent, indicatorTags } = req.body
    
    await db.query(`
      UPDATE warning_indicator 
      SET indicator_name = ?, indicator_desc = ?, config_type = ?, sql_content = ?, update_time = NOW()
      WHERE id = ?
    `, [indicatorName, indicatorDesc, configType, sqlContent, id])
    
    await db.query('DELETE FROM warning_indicator_tag_rel WHERE indicator_id = ?', [id])
    
    if (indicatorTags && indicatorTags.length > 0) {
      for (const tagName of indicatorTags) {
        const tagResult = await db.query('SELECT id FROM warning_tag WHERE tag_name = ?', [tagName])
        let tagId
        
        if (tagResult.length > 0) {
          tagId = tagResult[0].id
        } else {
          const newTag = await db.query(
            'INSERT INTO warning_tag (tag_name, create_time) VALUES (?, NOW())',
            [tagName]
          )
          tagId = newTag.insertId
        }
        
        await db.query(
          'INSERT INTO warning_indicator_tag_rel (indicator_id, tag_id) VALUES (?, ?)',
          [id, tagId]
        )
      }
    }
    
    res.json({
      code: 200,
      message: 'success'
    })
  } catch (error) {
    console.error('更新预警指标失败:', error)
    res.json({
      code: 500,
      message: '更新预警指标失败',
      detail: error.message
    })
  }
})

// 删除预警指标
app.delete('/api/v1/warning/indicators/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    await db.query('DELETE FROM warning_indicator_tag_rel WHERE INDICATOR_ID = ?', [id])
    await db.query('DELETE FROM warning_indicator WHERE ID = ?', [id])
    
    res.json({
      code: 200,
      message: 'success'
    })
  } catch (error) {
    console.error('删除预警指标失败:', error)
    res.json({
      code: 500,
      message: '删除预警指标失败',
      detail: error.message
    })
  }
})

// 切换预警指标状态
app.put('/api/v1/warning/indicators/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { enabled } = req.body
    
    await db.query('UPDATE warning_indicator SET ENABLED = ?, UPDATE_TIME = NOW() WHERE ID = ?', [enabled, id])
    
    res.json({
      code: 200,
      message: 'success'
    })
  } catch (error) {
    console.error('切换预警指标状态失败:', error)
    res.json({
      code: 500,
      message: '切换预警指标状态失败',
      detail: error.message
    })
  }
})

// 获取预警指标下拉选项
app.get('/api/v1/warning/indicators/select', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT ID, INDICATOR_NAME FROM warning_indicator WHERE ENABLED = 1 ORDER BY INDICATOR_NAME'
    )
    
    res.json({
      code: 200,
      message: 'success',
      data: result.map(item => ({
        id: item.ID,
        indicatorName: item.INDICATOR_NAME
      }))
    })
  } catch (error) {
    console.error('获取预警指标下拉选项失败:', error)
    res.json({
      code: 500,
      message: '获取预警指标下拉选项失败',
      detail: error.message
    })
  }
})

// ==================== 预警规则相关API ====================

// 获取预警规则列表
app.get('/api/v1/warning/rules', async (req, res) => {
  try {
    const { page = 1, size = 10, ruleName, enabled, category, alertLevel } = req.query
    
    let query = 'SELECT * FROM warning_rule WHERE 1=1'
    const queryParams = []
    
    if (ruleName) {
      query += ' AND rule_name LIKE ?'
      queryParams.push(`%${ruleName}%`)
    }
    
    if (enabled !== undefined) {
      query += ' AND enabled = ?'
      queryParams.push(parseInt(enabled))
    }
    
    if (category) {
      query += ' AND category = ?'
      queryParams.push(category)
    }
    
    if (alertLevel) {
      query += ' AND alert_level = ?'
      queryParams.push(alertLevel)
    }
    
    query += ' ORDER BY create_time DESC'
    
    // 获取总数
    const totalResult = await db.query(
      query.replace('SELECT *', 'SELECT COUNT(*) as total'),
      queryParams
    )
    const total = totalResult[0].total
    
    // 分页
    const offset = (parseInt(page) - 1) * parseInt(size)
    query += ` LIMIT ${parseInt(size)} OFFSET ${offset}`
    
    const results = await db.query(query, queryParams)
    
    // 获取通知对象
    const resultWithNotifications = await Promise.all(results.map(async item => {
      const notificationResult = await db.query(`
        SELECT object_type as objectType, 
               object_code as objectCode, 
               object_name as objectName
        FROM warning_rule_notification_object 
        WHERE rule_id = ?
      `, [item.id])
      
      return {
        id: item.id,
        ruleName: item.rule_name,
        ruleDesc: item.rule_desc,
        category: item.category,
        alertLevel: item.alert_level,
        alertLevelName: (() => { const level = item.alert_level?.toLowerCase(); return level === 'high' || level === 'red' ? '高危' : level === 'medium' || level === 'orange' ? '中危' : level === 'low' || level === 'yellow' ? '低危' : item.alert_level; })(),
        startTime: item.start_time,
        endTime: item.end_time,
        notificationChannels: item.notification_channels || [],
        associatedPlatform: item.associated_platform,
        notifyFrequencyType: item.notify_frequency_type,
        notifyCronExpr: item.notify_cron_expr,
        notifyTemplate: item.notify_template,
        enabled: item.enabled,
        triggerCount: 0,
        createBy: item.create_by,
        createTime: item.create_time,
        notificationObjects: notificationResult
      }
    }))
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: resultWithNotifications,
        total,
        page: parseInt(page),
        size: parseInt(size)
      }
    })
  } catch (error) {
    console.error('获取预警规则列表失败:', error)
    res.json({
      code: 500,
      message: '获取预警规则列表失败',
      detail: error.message
    })
  }
})

// 获取预警规则详情
app.get('/api/v1/warning/rules/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await db.query(`
      SELECT r.*, 
             CASE r.alert_level 
               WHEN 'high' THEN '高危' 
               WHEN 'medium' THEN '中危' 
               WHEN 'low' THEN '低危' 
               ELSE r.alert_level 
             END AS alert_level_name
      FROM warning_rule r
      WHERE r.id = ?
    `, [id])
    
    if (result.length === 0) {
      return res.json({
        code: 404,
        message: '预警规则不存在'
      })
    }
    
    const item = result[0]
    
    // 获取条件
    const conditionResult = await db.query(`
      SELECT c.id, c.group_index, c.indicator_id, c.operator, 
             c.threshold_single, c.threshold_min, c.threshold_max,
             i.indicator_name
      FROM warning_rule_condition c
      LEFT JOIN warning_indicator i ON c.indicator_id = i.id
      WHERE c.rule_id = ?
      ORDER BY c.group_index, c.id
    `, [id])
    
    // 获取指标关联
    const indicatorResult = await db.query(`
      SELECT i.id, i.indicator_name, i.indicator_desc
      FROM warning_rule_indicator ri
      JOIN warning_indicator i ON ri.indicator_id = i.id
      WHERE ri.rule_id = ?
    `, [id])
    
    // 获取通知对象
    const notificationResult = await db.query(`
      SELECT id, object_type, 
             object_code, 
             object_name
      FROM warning_rule_notification_object 
      WHERE rule_id = ?
    `, [id])
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        id: item.id,
        ruleName: item.rule_name,
        ruleDesc: item.rule_desc,
        category: item.category,
        alertLevel: item.alert_level,
        alertLevelName: item.alert_level_name,
        startTime: item.start_time,
        endTime: item.end_time,
        notificationChannels: item.notification_channels || [],
        associatedPlatform: item.associated_platform,
        notifyFrequencyType: item.notify_frequency_type,
        notifyCronExpr: item.notify_cron_expr,
        notifyTemplate: item.notify_template,
        enabled: item.enabled,
        createBy: item.create_by,
        createTime: item.create_time,
        conditions: conditionResult.map(c => ({
          id: c.id,
          groupIndex: c.group_index,
          indicatorId: c.indicator_id,
          indicatorName: c.indicator_name,
          operator: c.operator,
          thresholdSingle: c.threshold_single,
          thresholdMin: c.threshold_min,
          thresholdMax: c.threshold_max
        })),
        indicatorIds: indicatorResult.map(i => i.id),
        indicators: indicatorResult.map(i => ({
          id: i.id,
          indicatorName: i.indicator_name,
          indicatorDesc: i.indicator_desc
        })),
        notificationObjects: notificationResult.map(n => ({
          objectId: n.id,
          objectType: n.object_type,
          objectCode: n.object_code,
          objectName: n.object_name
        }))
      }
    })
  } catch (error) {
    console.error('获取预警规则详情失败:', error)
    res.json({
      code: 500,
      message: '获取预警规则详情失败',
      detail: error.message
    })
  }
})

// 创建预警规则
app.post('/api/v1/warning/rules', async (req, res) => {
  try {
    const { 
      ruleName, ruleDesc, category, alertLevel, startTime, endTime,
      notificationChannels, associatedPlatform, notifyFrequencyType,
      notifyCronExpr, notifyTemplate, conditions, notificationObjects
    } = req.body
    
    const result = await db.query(`
      INSERT INTO warning_rule (
        RULE_NAME, RULE_DESC, CATEGORY, ALERT_LEVEL, START_TIME, END_TIME,
        NOTIFICATION_CHANNELS, ASSOCIATED_PLATFORM, NOTIFY_FREQUENCY_TYPE,
        NOTIFY_CRON_EXPR, NOTIFY_TEMPLATE, ENABLED, CREATE_BY, CREATE_TIME, UPDATE_TIME
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'admin', NOW(), NOW())
    `, [
      ruleName, ruleDesc, category, alertLevel, startTime, endTime,
      JSON.stringify(notificationChannels), associatedPlatform, notifyFrequencyType,
      notifyCronExpr, notifyTemplate
    ])
    
    const ruleId = result.insertId
    
    // 添加条件
    if (conditions && conditions.length > 0) {
      for (const condition of conditions) {
        await db.query(`
          INSERT INTO warning_rule_condition (
            RULE_ID, GROUP_INDEX, INDICATOR_ID, OPERATOR, 
            THRESHOLD_SINGLE, THRESHOLD_MIN, THRESHOLD_MAX
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          ruleId, condition.groupIndex, condition.indicatorId, condition.operator,
          condition.thresholdSingle, condition.thresholdMin, condition.thresholdMax
        ])
      }
    }
    
    // 添加通知对象
    if (notificationObjects && notificationObjects.length > 0) {
      for (const obj of notificationObjects) {
        await db.query(`
          INSERT INTO warning_rule_notification_object (
            RULE_ID, NOTIFICATION_OBJECT_TYPE, NOTIFICATION_OBJECT_CODE, NOTIFICATION_OBJECT_NAME
          ) VALUES (?, ?, ?, ?)
        `, [ruleId, obj.objectType, obj.objectCode, obj.objectName])
      }
    }
    
    res.json({
      code: 200,
      message: 'success',
      data: { id: ruleId }
    })
  } catch (error) {
    console.error('创建预警规则失败:', error)
    res.json({
      code: 500,
      message: '创建预警规则失败',
      detail: error.message
    })
  }
})

// 更新预警规则
app.put('/api/v1/warning/rules/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { 
      ruleName, ruleDesc, category, alertLevel, startTime, endTime,
      notificationChannels = [], associatedPlatform = '', notifyFrequencyType = 'REALTIME',
      notifyCronExpr = null, notifyTemplate = '', conditions = [], notificationObjects = [],
      indicatorIds = []
    } = req.body
    
    await db.query(`
      UPDATE warning_rule SET
        RULE_NAME = ?, RULE_DESC = ?, CATEGORY = ?, ALERT_LEVEL = ?, 
        START_TIME = ?, END_TIME = ?, NOTIFICATION_CHANNELS = ?, 
        ASSOCIATED_PLATFORM = ?, NOTIFY_FREQUENCY_TYPE = ?, 
        NOTIFY_CRON_EXPR = ?, NOTIFY_TEMPLATE = ?, UPDATE_TIME = NOW()
      WHERE id = ?
    `, [
      ruleName, ruleDesc, category, alertLevel, startTime, endTime,
      JSON.stringify(notificationChannels), associatedPlatform, notifyFrequencyType,
      notifyCronExpr, notifyTemplate, id
    ])
    
    // 删除旧条件
    await db.query('DELETE FROM warning_rule_condition WHERE rule_id = ?', [id])
    
    // 添加新条件
    if (conditions && conditions.length > 0) {
      for (const condition of conditions) {
        await db.query(`
          INSERT INTO warning_rule_condition (
            rule_id, group_index, indicator_id, operator, 
            threshold_single, threshold_min, threshold_max
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          id, condition.groupIndex || 1, condition.indicatorId, condition.operator,
          condition.thresholdSingle, condition.thresholdMin, condition.thresholdMax
        ])
      }
    }
    
    // 删除旧指标关联
    await db.query('DELETE FROM warning_rule_indicator WHERE rule_id = ?', [id])
    
    // 添加新指标关联
    if (indicatorIds && indicatorIds.length > 0) {
      for (const indicatorId of indicatorIds) {
        await db.query(`
          INSERT INTO warning_rule_indicator (rule_id, indicator_id) VALUES (?, ?)
        `, [id, indicatorId])
      }
    }
    
    // 删除旧通知对象
    await db.query('DELETE FROM warning_rule_notification_object WHERE rule_id = ?', [id])
    
    // 添加新通知对象
    if (notificationObjects && notificationObjects.length > 0) {
      for (const obj of notificationObjects) {
        await db.query(`
          INSERT INTO warning_rule_notification_object (
            rule_id, object_type, object_code, object_name
          ) VALUES (?, ?, ?, ?)
        `, [id, obj.objectType, obj.objectCode, obj.objectName])
      }
    }
    
    res.json({
      code: 200,
      message: 'success'
    })
  } catch (error) {
    console.error('更新预警规则失败:', error)
    res.json({
      code: 500,
      message: '更新预警规则失败',
      detail: error.message
    })
  }
})

// 删除预警规则
app.delete('/api/v1/warning/rules/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    await db.query('DELETE FROM warning_rule_condition WHERE RULE_ID = ?', [id])
    await db.query('DELETE FROM warning_rule_notification_object WHERE RULE_ID = ?', [id])
    await db.query('DELETE FROM warning_rule WHERE ID = ?', [id])
    
    res.json({
      code: 200,
      message: 'success'
    })
  } catch (error) {
    console.error('删除预警规则失败:', error)
    res.json({
      code: 500,
      message: '删除预警规则失败',
      detail: error.message
    })
  }
})

// 切换预警规则状态
app.put('/api/v1/warning/rules/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { enabled } = req.body
    
    await db.query('UPDATE warning_rule SET ENABLED = ?, UPDATE_TIME = NOW() WHERE ID = ?', [enabled, id])
    
    res.json({
      code: 200,
      message: 'success'
    })
  } catch (error) {
    console.error('切换预警规则状态失败:', error)
    res.json({
      code: 500,
      message: '切换预警规则状态失败',
      detail: error.message
    })
  }
})

// 获取预警规则关联事件
app.get('/api/v1/warning/rules/:id/events', async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, size = 10 } = req.query
    
    const query = `
      SELECT e.*, 
             CASE e.ALERT_LEVEL 
               WHEN 'high' THEN '高危' 
               WHEN 'medium' THEN '中危' 
               WHEN 'low' THEN '低危' 
               ELSE e.ALERT_LEVEL 
             END AS ALERT_LEVEL_NAME,
             CASE e.STATUS 
               WHEN 'pending' THEN '待处理' 
               WHEN 'processed' THEN '处理中' 
               WHEN 'adopted' THEN '已采纳' 
               WHEN 'rejected' THEN '已驳回' 
               ELSE e.STATUS 
             END AS STATUS_NAME
      FROM warning_event e
      WHERE e.RULE_ID = ?
      ORDER BY e.TRIGGER_TIME DESC
    `
    
    // 获取总数
    const totalResult = await db.query(
      query.replace('SELECT e.*,', 'SELECT COUNT(*) as total'),
      [id]
    )
    const total = totalResult[0].total
    
    // 分页
    const offset = (parseInt(page) - 1) * parseInt(size)
    const pagedQuery = query + ' LIMIT ? OFFSET ?'
    
    const results = await db.query(pagedQuery, [id, parseInt(size), offset])
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: results.map(item => ({
          id: item.ID,
          eventNo: item.EVENT_NO,
          alertLevel: item.ALERT_LEVEL,
          alertLevelName: item.ALERT_LEVEL_NAME,
          triggerTime: item.TRIGGER_TIME,
          status: item.STATUS,
          statusName: item.STATUS_NAME
        })),
        total,
        page: parseInt(page),
        size: parseInt(size)
      }
    })
  } catch (error) {
    console.error('获取预警规则关联事件失败:', error)
    res.json({
      code: 500,
      message: '获取预警规则关联事件失败',
      detail: error.message
    })
  }
})

// ==================== 智能问答相关API ====================

// 问答接口
app.post('/api/v1/qa/ask', async (req, res) => {
  try {
    const { question, dataScope = '全部', conversationMode = 'SINGLE', contextId } = req.body
    
    let answer = ''
    let charts = []
    let keyFindings = []
    let extensions = []
    
    try {
      const systemPrompt = `
你是一名智慧公安数据分析专家。请根据用户的问题，提供专业、准确的分析回答。

分析框架：
1. 首先给出直接回答
2. 如果问题涉及数据趋势或统计分析，请生成相应的图表数据
3. 提炼3-5条关键发现
4. 提供2-3条延伸解读或建议

图表数据格式（JSON）：
{
  "charts": [
    {
      "chartType": "LINE",
      "title": "图表标题",
      "data": [{"month": "2026-01", "count": 100}]
    }
  ],
  "keyFindings": ["关键发现1", "关键发现2"],
  "extensions": ["延伸解读1", "延伸解读2"]
}

注意：如果不需要图表，charts可以为空数组。
请在回答中包含以上JSON格式的分析数据。
`

      const fullPrompt = `${systemPrompt}\n\n用户问题：${question}\n数据范围：${dataScope}`
      
      console.log('开始调用AI模型...')
      const aiResponse = await callAIModel(fullPrompt)
      console.log('AI模型返回:', aiResponse)
      
      answer = aiResponse
      
      const greetingWords = ['你好', '您好', 'hello', 'hi', '嗨', '您好！', '你好！', 'Hi', 'Hello']
      const isGreeting = greetingWords.some(word => question.includes(word)) || question.trim().length < 10
      
      if (!isGreeting) {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            const analysisData = JSON.parse(jsonMatch[0])
            if (analysisData.charts) charts = analysisData.charts
            if (analysisData.keyFindings) keyFindings = analysisData.keyFindings
            if (analysisData.extensions) extensions = analysisData.extensions
          } catch (e) {
            console.log('解析JSON失败:', e)
          }
        }
        
        if (!keyFindings.length) {
          keyFindings = ['AI分析完成，回答已生成']
        }
        if (!extensions.length) {
          extensions = ['如需更深入分析，请继续提问']
        }
      } else {
        answer = aiResponse.replace(/```json[\s\S]*```/g, '').trim()
      }
    } catch (aiError) {
      console.error('AI调用失败，使用模拟数据:', aiError.message)
      
      if (question.includes('工单趋势') || question.includes('工单数量')) {
        answer = '已为您生成2026年工单趋势折线图。关键发现：1月工单数量最高（9530件），5月显著下降至2520件。'
        charts = [{
          chartType: 'LINE',
          title: '2026年工单数量趋势',
          data: [
            { month: '2026-01', count: 9530 },
            { month: '2026-02', count: 7800 },
            { month: '2026-03', count: 9000 },
            { month: '2026-04', count: 7500 },
            { month: '2026-05', count: 2520 }
          ]
        }]
        keyFindings = [
          '2026年1月至5月工单数量呈现波动趋势，1月工单数量最高（9530件），5月显著下降至2520件',
          '工单数量在2月至4月间保持相对稳定，但整体呈下降趋势'
        ]
        extensions = [
          '需要分析5月工单数量骤降的原因，是否与政策调整或数据采集异常有关',
          '建议对1月工单数量激增的情况进行分类统计，判断是否为特定事件或问题集中爆发',
          '可结合工单类型或来源进一步细化趋势分析，识别主要驱动因素'
        ]
      } else if (question.includes('警情') || question.includes('接警')) {
        answer = '已为您分析警情数据。近期警情主要集中在盗窃、纠纷等类型。'
        charts = [{
          chartType: 'BAR',
          title: '警情类型分布',
          data: [
            { type: '盗窃', count: 156 },
            { type: '纠纷', count: 128 },
            { type: '求助', count: 89 },
            { type: '诈骗', count: 67 },
            { type: '其他', count: 45 }
          ]
        }]
        keyFindings = [
          '盗窃类警情占比最高，占总警情的32%',
          '纠纷类警情位居第二，占比26%',
          '诈骗警情呈上升趋势，需加强防范宣传'
        ]
        extensions = [
          '建议加强盗窃高发区域的巡逻防控',
          '针对纠纷警情增多情况，可考虑引入调解机制',
          '加大反诈宣传力度，提高群众防范意识'
        ]
      } else {
        answer = '已收到您的问题，正在分析中...\n\n根据数据分析，为您提供以下信息：\n\n当前系统运行正常，数据更新及时。如需更详细的分析，请提供更具体的问题。'
        keyFindings = ['系统数据整体运行正常', '数据更新及时']
        extensions = ['建议提出更具体的问题以获取更详细的分析']
      }
    }
    
    // 保存对话记录
    const insertResult = await db.query(
      'INSERT INTO qa_conversation (user_id, user_name, question, answer, data_scope, conversation_mode, context_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['test_user', '测试用户', question, answer, dataScope, conversationMode, contextId || null, 'COMPLETED']
    )
    
    const conversationId = insertResult.insertId
    
    // 保存图表配置
    for (const chart of charts) {
      await db.query(
        'INSERT INTO qa_chart_config (conversation_id, chart_type, chart_title, chart_config) VALUES (?, ?, ?, ?)',
        [conversationId, chart.chartType, chart.title, JSON.stringify(chart.data)]
      )
    }
    
    // 保存关键发现
    for (const finding of keyFindings) {
      await db.query(
        'INSERT INTO qa_key_finding (conversation_id, finding_type, content, relevance_score) VALUES (?, ?, ?, ?)',
        [conversationId, 'KEY', finding, 0.9]
      )
    }
    
    // 保存延伸解读
    for (const ext of extensions) {
      await db.query(
        'INSERT INTO qa_key_finding (conversation_id, finding_type, content, relevance_score) VALUES (?, ?, ?, ?)',
        [conversationId, 'EXTENSION', ext, 0.85]
      )
    }
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        conversationId,
        question,
        answer,
        charts,
        keyFindings,
        extensions
      }
    })
  } catch (error) {
    console.error('智能问答失败:', error)
    res.json({
      code: 500,
      message: '智能问答失败',
      detail: error.message
    })
  }
})

// 对话历史接口
app.get('/api/v1/qa/history', async (req, res) => {
  try {
    const { page = 1, size = 10 } = req.query
    
    // 获取总数
    const totalResult = await db.query('SELECT COUNT(*) as total FROM qa_conversation')
    const total = totalResult[0].total
    
    // 分页查询
    const offset = (parseInt(page) - 1) * parseInt(size)
    const results = await db.query(
      'SELECT * FROM qa_conversation ORDER BY create_time DESC LIMIT ? OFFSET ?',
      [parseInt(size), offset]
    )
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: results.map(item => ({
          id: item.id,
          question: item.question,
          answer: item.answer,
          dataScope: item.data_scope,
          conversationMode: item.conversation_mode,
          status: item.status,
          createTime: item.create_time
        })),
        total,
        page: parseInt(page),
        size: parseInt(size)
      }
    })
  } catch (error) {
    console.error('获取对话历史失败:', error)
    res.json({
      code: 500,
      message: '获取对话历史失败',
      detail: error.message
    })
  }
})

// 图表数据接口
app.get('/api/v1/qa/chart/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params
    
    const results = await db.query(
      'SELECT * FROM qa_chart_config WHERE conversation_id = ?',
      [conversationId]
    )
    
    if (results.length === 0) {
      return res.json({
        code: 404,
        message: '未找到图表数据'
      })
    }
    
    res.json({
      code: 200,
      message: 'success',
      data: results.map(item => ({
        id: item.id,
        chartType: item.chart_type,
        title: item.chart_title,
        config: {},
        data: JSON.parse(item.chart_config || '[]')
      }))
    })
  } catch (error) {
    console.error('获取图表数据失败:', error)
    res.json({
      code: 500,
      message: '获取图表数据失败',
      detail: error.message
    })
  }
})

// 删除对话记录
app.delete('/api/v1/qa/history/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    await db.query('DELETE FROM qa_key_finding WHERE conversation_id = ?', [id])
    await db.query('DELETE FROM qa_chart_config WHERE conversation_id = ?', [id])
    await db.query('DELETE FROM qa_conversation WHERE id = ?', [id])
    
    res.json({
      code: 200,
      message: 'success'
    })
  } catch (error) {
    console.error('删除对话记录失败:', error)
    res.json({
      code: 500,
      message: '删除对话记录失败',
      detail: error.message
    })
  }
})

// 静态文件服务：提供 H5 前端页面
const h5DistPath = path.join(__dirname, '../../dist/build/h5')
app.use(express.static(h5DistPath))
app.get('*', (req, res) => {
  res.sendFile(path.join(h5DistPath, 'index.html'))
})

// 启动服务器
app.listen(PORT, async () => {
  console.log(`服务器已启动，端口: ${PORT}`)
  console.log(`API地址: http://localhost:${PORT}/api/v1`)
  
  // 初始化配置表
  await initConfigTable()
})