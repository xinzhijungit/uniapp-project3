// 配置表初始化脚本
// 在后端服务中添加配置表创建和参数插入功能

const initConfigTable = async () => {
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
}