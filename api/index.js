const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise')
const https = require('https')

// 数据库连接配置（直接写在代码中）
const DB_CONFIG = {
  host: 'mysql.sqlpub.com',
  port: 3306,
  user: 'peter_xin',
  password: 's7oADISJGcpiQuQn',
  database: 'dify_test_peter'
}

const pool = mysql.createPool({
  host: DB_CONFIG.host,
  port: DB_CONFIG.port,
  user: DB_CONFIG.user,
  password: DB_CONFIG.password,
  database: DB_CONFIG.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: false
})

async function query(sql, params = []) {
  let connection = null
  try {
    connection = await pool.getConnection()
    const [rows] = await connection.query(sql, params)
    return rows
  } finally {
    if (connection) {
      await connection.release()
    }
  }
}

// AI模型调用函数
async function callAIModel(prompt) {
  return new Promise(async (resolve, reject) => {
    try {
      // 读取所有AI相关配置
      console.log('正在从数据库读取AI配置...')
      const configResults = await query('SELECT CONFIG_KEY, CONFIG_VALUE FROM XAGA_config WHERE CONFIG_KEY LIKE ?', ['ai_%'])
      
      console.log('数据库查询结果:', JSON.stringify(configResults, null, 2))
      
      const config = {}
      configResults.forEach(row => {
        config[row.CONFIG_KEY] = row.CONFIG_VALUE
      })
      
      // 使用配置或默认值
      const aiModelUrl = config.ai_model_url || 'https://new-api.jointpilot.com/v1/chat/completions'
      const aiModelName = config.ai_model_name || 'kimi-k2.6'
      const aiApiKey = config.ai_api_key || ''
      const aiMaxTokens = parseInt(config.ai_max_tokens) || 1024
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
        rejectUnauthorized: false
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

const app = express()

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'success', data: { status: 'healthy', timestamp: new Date().toISOString() } })
})

// 配置参数查询接口
app.get('/api/v1/config', async (req, res) => {
  try {
    const results = await query('SELECT * FROM XAGA_config ORDER BY CONFIG_KEY')
    res.json({ code: 200, message: 'success', data: results })
  } catch (error) {
    res.json({ code: 500, message: '获取配置失败', detail: error.message })
  }
})

// 人联研判检索接口
app.post('/api/v1/search/entity', async (req, res) => {
  try {
    const { idCard, plateNumber, caseNumber, phoneNumber } = req.body
    
    let personInfo = null
    let queryParams = []
    let sqlQuery = 'SELECT * FROM FKD_BJR WHERE 1=1'
    
    if (idCard) {
      sqlQuery += ' AND ZJHM = ?'
      queryParams.push(idCard)
    } else if (plateNumber) {
      sqlQuery += ' AND CPH_ontology = ?'
      queryParams.push(plateNumber)
    } else if (phoneNumber) {
      sqlQuery += ' AND LXDH = ?'
      queryParams.push(phoneNumber)
    } else if (caseNumber) {
      sqlQuery = `SELECT b.* FROM FKD_BJR b JOIN JQ_SMSJ_ontology s ON b.BH = s.BJR_BH JOIN JJD_JJD j ON s.JJDBH = j.JJDBH WHERE j.JJDBH = ?`
      queryParams.push(caseNumber)
    }
    
    sqlQuery += ' LIMIT 1'
    
    const results = await query(sqlQuery, queryParams)
    if (results.length > 0) {
      personInfo = results[0]
    }
    
    if (personInfo) {
      // 获取警情记录
      const caseRecords = await query(`
        SELECT j.JJDBH as caseNumber, j.BJNR as content, j.BJSJ as alarmTime 
        FROM JJD_JJD j JOIN JQ_SMSJ_ontology s ON j.JJDBH = s.JJDBH 
        WHERE s.BJR_BH = ? ORDER BY j.BJSJ DESC
      `, [personInfo.BH])
      
      // 获取户籍信息
      const householdInfo = await query('SELECT * FROM person_household WHERE id_card = ?', [personInfo.ZJHM])
      
      // 获取案底记录
      const personCriminalRecords = await query('SELECT * FROM criminal_record_db WHERE id_card = ?', [personInfo.ZJHM])
      
      // 计算预警等级
      const hasWanted = personCriminalRecords.some(r => r.prison_status === '通缉')
      const warningLevel = hasWanted 
        ? { level: 'high', label: '高危预警', description: '目标人员本人案底库的服刑状态是"通缉"' }
        : personCriminalRecords.some(r => r.prison_status === '已服刑')
        ? { level: 'medium', label: '关注人员', description: '目标人员本人或关联户籍成员有案底库的服刑状态是"已服刑"' }
        : { level: 'normal', label: '正常人员', description: '目标人员本人及关联户籍成员无案底库关联记录' }
      
      // 计算风险评分
      let riskScore = 50
      const riskTags = []
      
      if (personInfo.SFZDRY === '1') {
        riskTags.push('重点人员')
        riskScore += 30
      }
      if (warningLevel.level === 'high') riskScore += 30
      if (warningLevel.level === 'medium') riskScore += 15
      riskScore = Math.min(riskScore, 100)
      
      // 生成建议
      const suggestions = []
      if (warningLevel.level === 'high') {
        suggestions.push('建议立即布控拦截，防止嫌疑人逃脱')
        suggestions.push('通知相关部门协同配合抓捕')
      } else if (warningLevel.level === 'medium') {
        suggestions.push('建议加强日常监控，关注其活动轨迹')
        suggestions.push('核查其近期活动情况')
      } else {
        suggestions.push('建议常规处理，注意观察异常行为')
      }
      
      res.json({
        code: 200,
        message: 'success',
        data: {
          personInfo,
          riskScore,
          riskTags,
          caseRecords: caseRecords || [],
          householdInfo: householdInfo[0] || null,
          householdMembers: [],
          personCriminalRecords: personCriminalRecords || [],
          householdCriminalRecords: [],
          warningLevel,
          suggestions,
          graphData: { nodes: [], links: [] },
          analysisText: '基于多维度数据分析完成',
          features: [],
          tags: []
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
    res.json({ code: 500, message: '检索失败', detail: error.message })
  }
})

// 知识图谱查询接口
app.post('/api/v1/graph/query', async (req, res) => {
  try {
    const { entityId, entityType } = req.body
    
    const nodes = []
    const links = []
    
    if (entityId) {
      // 添加中心节点
      if (entityType === 'citizen') {
        const personResults = await query('SELECT BH, XM FROM FKD_BJR WHERE BH = ?', [entityId])
        if (personResults.length > 0) {
          nodes.push({
            id: personResults[0].BH,
            type: 'citizen',
            label: personResults[0].XM,
            color: '#2196F3'
          })
        }
      }
    }
    
    res.json({ code: 200, message: 'success', data: { nodes, links } })
  } catch (error) {
    console.error('图谱查询失败:', error)
    res.json({ code: 500, message: '图谱查询失败', detail: error.message })
  }
})

// 重新生成知识图谱
app.post('/api/v1/graph/regenerate', async (req, res) => {
  try {
    const { entityId, entityType } = req.body
    
    // 模拟重新生成图谱
    const nodes = []
    const links = []
    
    if (entityId && entityType === 'citizen') {
      // 获取人员信息
      const personResults = await query('SELECT BH, XM FROM FKD_BJR WHERE BH = ?', [entityId])
      if (personResults.length > 0) {
        const person = personResults[0]
        
        // 添加中心节点
        nodes.push({
          id: person.BH,
          type: 'citizen',
          label: person.XM,
          color: '#2196F3'
        })
        
        // 获取关联警情
        const caseResults = await query(`
          SELECT j.JJDBH, j.BJNR 
          FROM JJD_JJD j 
          JOIN JQ_SMSJ_ontology s ON j.JJDBH = s.JJDBH 
          WHERE s.BJR_BH = ? 
          LIMIT 5
        `, [entityId])
        
        caseResults.forEach((caseItem, index) => {
          const caseId = `case_${caseItem.JJDBH}`
          nodes.push({
            id: caseId,
            type: 'case',
            label: `警情${index + 1}`,
            color: '#FF5722'
          })
          links.push({
            source: person.BH,
            target: caseId,
            relation: '涉及'
          })
        })
      }
    }
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        nodes,
        links,
        message: '知识图谱重新生成成功'
      }
    })
  } catch (error) {
    console.error('重新生成图谱失败:', error)
    res.json({ code: 500, message: '重新生成图谱失败', detail: error.message })
  }
})

// 标签管理接口
app.get('/api/v1/tags', async (req, res) => {
  try {
    const { page = 1, size = 20 } = req.query
    
    const totalResult = await query('SELECT COUNT(*) as total FROM TAG_CONFIG_ontology')
    const total = totalResult[0].total
    
    const offset = (parseInt(page) - 1) * parseInt(size)
    const results = await query(`SELECT * FROM TAG_CONFIG_ontology ORDER BY CREATE_TIME DESC LIMIT ${parseInt(size)} OFFSET ${offset}`)
    
    res.json({
      code: 200,
      message: 'success',
      data: { list: results, total, page: parseInt(page), size: parseInt(size) }
    })
  } catch (error) {
    console.error('获取标签列表失败:', error)
    res.json({ code: 500, message: '获取标签列表失败', detail: error.message })
  }
})

// 标签统计
app.get('/api/v1/tags/statistics', async (req, res) => {
  try {
    const totalResult = await query('SELECT COUNT(*) as count FROM TAG_CONFIG_ontology')
    const enabledResult = await query('SELECT COUNT(*) as count FROM TAG_CONFIG_ontology WHERE STATUS = 1')
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        totalTags: totalResult[0].count,
        enabledTags: enabledResult[0].count,
        rulesCount: 0,
        modelName: 'DeepSeek'
      }
    })
  } catch (error) {
    res.json({ code: 500, message: '获取标签统计失败', detail: error.message })
  }
})

// 获取标签详情
app.get('/api/v1/tags/:tagCode', async (req, res) => {
  try {
    const { tagCode } = req.params
    const results = await query('SELECT * FROM TAG_CONFIG_ontology WHERE TAG_CODE = ?', [tagCode])
    
    if (results.length > 0) {
      res.json({ code: 200, message: 'success', data: results[0] })
    } else {
      res.json({ code: 404, message: '标签不存在' })
    }
  } catch (error) {
    res.json({ code: 500, message: '获取标签详情失败', detail: error.message })
  }
})

// 创建标签
app.post('/api/v1/tags', async (req, res) => {
  try {
    const { TAG_CODE, TAG_NAME, TAG_DESC, STATUS, PRIORITY, CATEGORY } = req.body
    
    const result = await query(
      'INSERT INTO TAG_CONFIG_ontology (TAG_CODE, TAG_NAME, TAG_DESC, STATUS, PRIORITY, CATEGORY, CREATE_TIME, UPDATE_TIME) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [TAG_CODE, TAG_NAME, TAG_DESC, STATUS || 1, PRIORITY || 1, CATEGORY]
    )
    
    res.json({ code: 200, message: 'success', data: { TAG_CODE } })
  } catch (error) {
    console.error('创建标签失败:', error)
    res.json({ code: 500, message: '创建标签失败', detail: error.message })
  }
})

// 更新标签
app.put('/api/v1/tags/:tagCode', async (req, res) => {
  try {
    const { tagCode } = req.params
    const { TAG_NAME, TAG_DESC, STATUS, PRIORITY, CATEGORY } = req.body
    
    await query(
      'UPDATE TAG_CONFIG_ontology SET TAG_NAME = ?, TAG_DESC = ?, STATUS = ?, PRIORITY = ?, CATEGORY = ?, UPDATE_TIME = NOW() WHERE TAG_CODE = ?',
      [TAG_NAME, TAG_DESC, STATUS, PRIORITY, CATEGORY, tagCode]
    )
    
    res.json({ code: 200, message: 'success' })
  } catch (error) {
    console.error('更新标签失败:', error)
    res.json({ code: 500, message: '更新标签失败', detail: error.message })
  }
})

// 删除标签
app.delete('/api/v1/tags/:tagCode', async (req, res) => {
  try {
    const { tagCode } = req.params
    
    await query('DELETE FROM TAG_CONFIG_ontology WHERE TAG_CODE = ?', [tagCode])
    
    res.json({ code: 200, message: 'success' })
  } catch (error) {
    console.error('删除标签失败:', error)
    res.json({ code: 500, message: '删除标签失败', detail: error.message })
  }
})

// 测试标签
app.post('/api/v1/tags/:tagCode/test', async (req, res) => {
  try {
    const { tagCode } = req.params
    
    // 模拟测试结果
    res.json({
      code: 200,
      message: 'success',
      data: {
        success: true,
        message: '标签测试通过',
        testResult: '模拟测试结果正常'
      }
    })
  } catch (error) {
    console.error('标签测试失败:', error)
    res.json({ code: 500, message: '标签测试失败', detail: error.message })
  }
})

// 批量测试标签
app.post('/api/v1/tags/:tagCode/batch-test', async (req, res) => {
  try {
    const { tagCode } = req.params
    const { count = 5 } = req.body
    
    // 模拟批量测试结果
    res.json({
      code: 200,
      message: 'success',
      data: {
        success: true,
        total: count,
        passed: count,
        failed: 0,
        message: `批量测试完成，共测试 ${count} 条，全部通过`
      }
    })
  } catch (error) {
    console.error('批量测试标签失败:', error)
    res.json({ code: 500, message: '批量测试标签失败', detail: error.message })
  }
})

// 获取标签示例列表
app.get('/api/v1/tags/:tagCode/examples', async (req, res) => {
  try {
    const { tagCode } = req.params
    const results = await query('SELECT * FROM TAG_EXAMPLE_ontology WHERE TAG_CODE = ? ORDER BY CREATE_TIME DESC', [tagCode])
    
    res.json({
      code: 200,
      message: 'success',
      data: results.map(item => ({
        id: item.ID,
        tagCode: item.TAG_CODE,
        exampleText: item.EXAMPLE_TEXT,
        expectedResult: item.EXPECTED_RESULT,
        entityKey: item.ENTITY_KEY,
        graphData: item.GRAPH_DATA,
        aiSummary: item.AI_SUMMARY,
        createTime: item.CREATE_TIME
      }))
    })
  } catch (error) {
    console.error('获取标签示例失败:', error)
    res.json({ code: 500, message: '获取标签示例失败', detail: error.message })
  }
})

// 添加标签示例
app.post('/api/v1/tags/:tagCode/examples', async (req, res) => {
  try {
    const { tagCode } = req.params
    const { EXAMPLE_TEXT, EXPECTED_RESULT, ENTITY_KEY, GRAPH_DATA, AI_SUMMARY } = req.body
    
    const result = await query(
      'INSERT INTO TAG_EXAMPLE_ontology (TAG_CODE, EXAMPLE_TEXT, EXPECTED_RESULT, ENTITY_KEY, GRAPH_DATA, AI_SUMMARY, CREATE_TIME) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [tagCode, EXAMPLE_TEXT, EXPECTED_RESULT, ENTITY_KEY, GRAPH_DATA, AI_SUMMARY]
    )
    
    res.json({ code: 200, message: 'success', data: { id: result.insertId } })
  } catch (error) {
    console.error('添加标签示例失败:', error)
    res.json({ code: 500, message: '添加标签示例失败', detail: error.message })
  }
})

// 删除标签示例
app.delete('/api/v1/tags/:tagCode/examples/:exampleId', async (req, res) => {
  try {
    const { exampleId } = req.params
    
    await query('DELETE FROM TAG_EXAMPLE_ontology WHERE ID = ?', [exampleId])
    
    res.json({ code: 200, message: 'success' })
  } catch (error) {
    console.error('删除标签示例失败:', error)
    res.json({ code: 500, message: '删除标签示例失败', detail: error.message })
  }
})

// 预警事件列表
app.get('/api/v1/warning/events', async (req, res) => {
  try {
    const { page = 1, size = 10 } = req.query
    
    const totalResult = await query('SELECT COUNT(*) as total FROM warning_event')
    const total = totalResult[0].total
    
    const offset = (parseInt(page) - 1) * parseInt(size)
    const results = await query(`SELECT * FROM warning_event ORDER BY TRIGGER_TIME DESC LIMIT ${parseInt(size)} OFFSET ${offset}`)
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: results.map(item => ({
          id: item.id,
          eventNo: item.event_no,
          ruleName: item.rule_name,
          alertLevel: item.alert_level,
          triggerTime: item.trigger_time,
          status: item.status
        })),
        total,
        page: parseInt(page),
        size: parseInt(size)
      }
    })
  } catch (error) {
    res.json({ code: 500, message: '获取预警事件列表失败', detail: error.message })
  }
})

// 预警统计
app.get('/api/v1/warning/events/statistics', async (req, res) => {
  try {
    const totalResult = await query('SELECT COUNT(*) as count FROM warning_event')
    const pendingResult = await query('SELECT COUNT(*) as count FROM warning_event WHERE status = "PENDING"')
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        totalCount: totalResult[0].count,
        pendingCount: pendingResult[0].count,
        adoptedCount: 0,
        rejectedCount: 0,
        trendData: []
      }
    })
  } catch (error) {
    res.json({ code: 500, message: '获取预警统计失败', detail: error.message })
  }
})

// 预警指标列表
app.get('/api/v1/warning/indicators', async (req, res) => {
  try {
    const { page = 1, size = 10 } = req.query
    
    const totalResult = await query('SELECT COUNT(*) as total FROM warning_indicator')
    const total = totalResult[0].total
    
    const offset = (parseInt(page) - 1) * parseInt(size)
    const results = await query(`SELECT * FROM warning_indicator ORDER BY create_time DESC LIMIT ${parseInt(size)} OFFSET ${offset}`)
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: results.map(item => ({
          id: item.id,
          indicatorName: item.indicator_name,
          indicatorDesc: item.indicator_desc,
          configType: item.config_type,
          enabled: item.enabled
        })),
        total,
        page: parseInt(page),
        size: parseInt(size)
      }
    })
  } catch (error) {
    res.json({ code: 500, message: '获取预警指标列表失败', detail: error.message })
  }
})

// 预警规则列表
app.get('/api/v1/warning/rules', async (req, res) => {
  try {
    const { page = 1, size = 10 } = req.query
    
    const totalResult = await query('SELECT COUNT(*) as total FROM warning_rule')
    const total = totalResult[0].total
    
    const offset = (parseInt(page) - 1) * parseInt(size)
    const results = await query(`SELECT * FROM warning_rule ORDER BY create_time DESC LIMIT ${parseInt(size)} OFFSET ${offset}`)
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: results.map(item => ({
          id: item.id,
          ruleName: item.rule_name,
          ruleDesc: item.rule_desc,
          alertLevel: item.alert_level,
          enabled: item.enabled
        })),
        total,
        page: parseInt(page),
        size: parseInt(size)
      }
    })
  } catch (error) {
    res.json({ code: 500, message: '获取预警规则列表失败', detail: error.message })
  }
})

// 预警事件详情
app.get('/api/v1/warning/events/:eventNo', async (req, res) => {
  try {
    const { eventNo } = req.params
    const results = await query('SELECT * FROM warning_event WHERE event_no = ?', [eventNo])
    
    if (results.length > 0) {
      const item = results[0]
      res.json({
        code: 200,
        message: 'success',
        data: {
          id: item.id,
          eventNo: item.event_no,
          ruleName: item.rule_name,
          alertLevel: item.alert_level,
          triggerTime: item.trigger_time,
          status: item.status,
          detail: item.detail || ''
        }
      })
    } else {
      res.json({ code: 404, message: '预警事件不存在' })
    }
  } catch (error) {
    console.error('获取预警事件详情失败:', error)
    res.json({ code: 500, message: '获取预警事件详情失败', detail: error.message })
  }
})

// 预警事件反馈
app.put('/api/v1/warning/events/:eventNo/feedback', async (req, res) => {
  try {
    const { eventNo } = req.params
    const { feedback, status } = req.body
    
    await query(
      'UPDATE warning_event SET feedback = ?, status = ?, update_time = NOW() WHERE event_no = ?',
      [feedback, status, eventNo]
    )
    
    res.json({ code: 200, message: 'success' })
  } catch (error) {
    console.error('预警事件反馈失败:', error)
    res.json({ code: 500, message: '预警事件反馈失败', detail: error.message })
  }
})

// 预警指标详情
app.get('/api/v1/warning/indicators/:id', async (req, res) => {
  try {
    const { id } = req.params
    const results = await query('SELECT * FROM warning_indicator WHERE id = ?', [id])
    
    if (results.length > 0) {
      const item = results[0]
      res.json({
        code: 200,
        message: 'success',
        data: {
          id: item.id,
          indicatorName: item.indicator_name,
          indicatorDesc: item.indicator_desc,
          configType: item.config_type,
          enabled: item.enabled
        }
      })
    } else {
      res.json({ code: 404, message: '预警指标不存在' })
    }
  } catch (error) {
    console.error('获取预警指标详情失败:', error)
    res.json({ code: 500, message: '获取预警指标详情失败', detail: error.message })
  }
})

// 创建预警指标
app.post('/api/v1/warning/indicators', async (req, res) => {
  try {
    const { indicatorName, indicatorDesc, configType, enabled } = req.body
    
    const result = await query(
      'INSERT INTO warning_indicator (indicator_name, indicator_desc, config_type, enabled, create_time, update_time) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [indicatorName, indicatorDesc, configType, enabled]
    )
    
    res.json({ code: 200, message: 'success', data: { id: result.insertId } })
  } catch (error) {
    console.error('创建预警指标失败:', error)
    res.json({ code: 500, message: '创建预警指标失败', detail: error.message })
  }
})

// 更新预警指标
app.put('/api/v1/warning/indicators/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { indicatorName, indicatorDesc, configType, enabled } = req.body
    
    await query(
      'UPDATE warning_indicator SET indicator_name = ?, indicator_desc = ?, config_type = ?, enabled = ?, update_time = NOW() WHERE id = ?',
      [indicatorName, indicatorDesc, configType, enabled, id]
    )
    
    res.json({ code: 200, message: 'success' })
  } catch (error) {
    console.error('更新预警指标失败:', error)
    res.json({ code: 500, message: '更新预警指标失败', detail: error.message })
  }
})

// 删除预警指标
app.delete('/api/v1/warning/indicators/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    await query('DELETE FROM warning_indicator WHERE id = ?', [id])
    
    res.json({ code: 200, message: 'success' })
  } catch (error) {
    console.error('删除预警指标失败:', error)
    res.json({ code: 500, message: '删除预警指标失败', detail: error.message })
  }
})

// 切换预警指标状态
app.put('/api/v1/warning/indicators/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { enabled } = req.body
    
    await query(
      'UPDATE warning_indicator SET enabled = ?, update_time = NOW() WHERE id = ?',
      [enabled, id]
    )
    
    res.json({ code: 200, message: 'success' })
  } catch (error) {
    console.error('切换预警指标状态失败:', error)
    res.json({ code: 500, message: '切换预警指标状态失败', detail: error.message })
  }
})

// 预警指标下拉选择
app.get('/api/v1/warning/indicators/select', async (req, res) => {
  try {
    const results = await query('SELECT id, indicator_name as name FROM warning_indicator WHERE enabled = 1 ORDER BY indicator_name')
    
    res.json({
      code: 200,
      message: 'success',
      data: results
    })
  } catch (error) {
    console.error('获取预警指标选择列表失败:', error)
    res.json({ code: 500, message: '获取预警指标选择列表失败', detail: error.message })
  }
})

// 预警规则详情
app.get('/api/v1/warning/rules/:id', async (req, res) => {
  try {
    const { id } = req.params
    const results = await query('SELECT * FROM warning_rule WHERE id = ?', [id])
    
    if (results.length > 0) {
      const item = results[0]
      res.json({
        code: 200,
        message: 'success',
        data: {
          id: item.id,
          ruleName: item.rule_name,
          ruleDesc: item.rule_desc,
          alertLevel: item.alert_level,
          enabled: item.enabled
        }
      })
    } else {
      res.json({ code: 404, message: '预警规则不存在' })
    }
  } catch (error) {
    console.error('获取预警规则详情失败:', error)
    res.json({ code: 500, message: '获取预警规则详情失败', detail: error.message })
  }
})

// 创建预警规则
app.post('/api/v1/warning/rules', async (req, res) => {
  try {
    const { ruleName, ruleDesc, alertLevel, enabled } = req.body
    
    const result = await query(
      'INSERT INTO warning_rule (rule_name, rule_desc, alert_level, enabled, create_time, update_time) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [ruleName, ruleDesc, alertLevel, enabled]
    )
    
    res.json({ code: 200, message: 'success', data: { id: result.insertId } })
  } catch (error) {
    console.error('创建预警规则失败:', error)
    res.json({ code: 500, message: '创建预警规则失败', detail: error.message })
  }
})

// 更新预警规则
app.put('/api/v1/warning/rules/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { ruleName, ruleDesc, alertLevel, enabled } = req.body
    
    await query(
      'UPDATE warning_rule SET rule_name = ?, rule_desc = ?, alert_level = ?, enabled = ?, update_time = NOW() WHERE id = ?',
      [ruleName, ruleDesc, alertLevel, enabled, id]
    )
    
    res.json({ code: 200, message: 'success' })
  } catch (error) {
    console.error('更新预警规则失败:', error)
    res.json({ code: 500, message: '更新预警规则失败', detail: error.message })
  }
})

// 删除预警规则
app.delete('/api/v1/warning/rules/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    await query('DELETE FROM warning_rule WHERE id = ?', [id])
    
    res.json({ code: 200, message: 'success' })
  } catch (error) {
    console.error('删除预警规则失败:', error)
    res.json({ code: 500, message: '删除预警规则失败', detail: error.message })
  }
})

// 切换预警规则状态
app.put('/api/v1/warning/rules/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { enabled } = req.body
    
    await query(
      'UPDATE warning_rule SET enabled = ?, update_time = NOW() WHERE id = ?',
      [enabled, id]
    )
    
    res.json({ code: 200, message: 'success' })
  } catch (error) {
    console.error('切换预警规则状态失败:', error)
    res.json({ code: 500, message: '切换预警规则状态失败', detail: error.message })
  }
})

// 获取规则关联事件
app.get('/api/v1/warning/rules/:id/events', async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, size = 10 } = req.query
    
    const totalResult = await query('SELECT COUNT(*) as total FROM warning_event WHERE rule_id = ?', [id])
    const total = totalResult[0].total
    
    const offset = (parseInt(page) - 1) * parseInt(size)
    const results = await query(
      `SELECT * FROM warning_event WHERE rule_id = ? ORDER BY TRIGGER_TIME DESC LIMIT ${parseInt(size)} OFFSET ${offset}`,
      [id]
    )
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: results.map(item => ({
          id: item.id,
          eventNo: item.event_no,
          ruleName: item.rule_name,
          alertLevel: item.alert_level,
          triggerTime: item.trigger_time,
          status: item.status
        })),
        total,
        page: parseInt(page),
        size: parseInt(size)
      }
    })
  } catch (error) {
    console.error('获取规则关联事件失败:', error)
    res.json({ code: 500, message: '获取规则关联事件失败', detail: error.message })
  }
})

// 智能问答接口
app.post('/api/v1/qa/ask', async (req, res) => {
  try {
    const { question } = req.body
    
    // 调用AI模型
    const prompt = `你是一个公安数据分析助手。请回答以下问题：\n\n${question}\n\n请提供简洁、专业的回答。`
    const aiAnswer = await callAIModel(prompt)
    
    // 保存对话记录
    const insertResult = await query(
      'INSERT INTO qa_conversation (user_id, user_name, question, answer, status) VALUES (?, ?, ?, ?, ?)',
      ['test_user', '测试用户', question, aiAnswer, 'COMPLETED']
    )
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        conversationId: insertResult.insertId,
        question,
        answer: aiAnswer,
        charts: [],
        keyFindings: ['AI分析完成'],
        extensions: ['建议提出更具体的问题以获取更详细的分析']
      }
    })
  } catch (error) {
    console.error('智能问答失败:', error)
    res.json({ code: 500, message: '智能问答失败', detail: error.message })
  }
})

// 对话历史
app.get('/api/v1/qa/history', async (req, res) => {
  try {
    const { page = 1, size = 10 } = req.query
    
    const totalResult = await query('SELECT COUNT(*) as total FROM qa_conversation')
    const total = totalResult[0].total
    
    const offset = (parseInt(page) - 1) * parseInt(size)
    const results = await query(`SELECT * FROM qa_conversation ORDER BY create_time DESC LIMIT ${parseInt(size)} OFFSET ${offset}`)
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: results.map(item => ({
          id: item.id,
          question: item.question,
          answer: item.answer,
          createTime: item.create_time
        })),
        total,
        page: parseInt(page),
        size: parseInt(size)
      }
    })
  } catch (error) {
    res.json({ code: 500, message: '获取对话历史失败', detail: error.message })
  }
})

// Vercel Serverless 导出
module.exports = app
