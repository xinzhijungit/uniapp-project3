-- 预警规则指标关联表
CREATE TABLE IF NOT EXISTS warning_rule_indicator (
  id BIGINT AUTO_INCREMENT COMMENT '主键ID' PRIMARY KEY,
  rule_id BIGINT NOT NULL COMMENT '预警规则ID，关联warning_rule表',
  indicator_id BIGINT NOT NULL COMMENT '预警指标ID，关联warning_indicator表',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  CONSTRAINT fk_wri_rule_id FOREIGN KEY (rule_id) REFERENCES warning_rule(id) ON DELETE CASCADE,
  CONSTRAINT fk_wri_indicator_id FOREIGN KEY (indicator_id) REFERENCES warning_indicator(id) ON DELETE CASCADE,
  UNIQUE KEY uk_rule_indicator (rule_id, indicator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预警规则指标关联表：存储预警规则与预警指标的多对多关联关系';

-- 智能问答对话记录表
CREATE TABLE IF NOT EXISTS qa_conversation (
  id BIGINT AUTO_INCREMENT COMMENT '主键ID' PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL COMMENT '用户ID',
  user_name VARCHAR(256) DEFAULT NULL COMMENT '用户姓名',
  question TEXT NOT NULL COMMENT '用户问题',
  answer TEXT COMMENT 'AI回答',
  data_scope VARCHAR(100) DEFAULT '全部' COMMENT '数据集范围',
  conversation_mode VARCHAR(20) DEFAULT 'SINGLE' COMMENT '对话模式: SINGLE(单轮), MULTI(多轮)',
  context_id BIGINT DEFAULT NULL COMMENT '关联的上下文对话ID',
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' COMMENT '状态: PROCESSING(处理中), COMPLETED(已完成), FAILED(失败)',
  error_message TEXT COMMENT '错误信息',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY idx_user_id (user_id),
  KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='智能问答对话记录表';

-- 图表配置表
CREATE TABLE IF NOT EXISTS qa_chart_config (
  id BIGINT AUTO_INCREMENT COMMENT '主键ID' PRIMARY KEY,
  conversation_id BIGINT NOT NULL COMMENT '关联的对话ID',
  chart_type VARCHAR(20) NOT NULL COMMENT '图表类型: LINE(折线图), BAR(柱状图), PIE(饼图), TABLE(表格)',
  chart_title VARCHAR(200) COMMENT '图表标题',
  chart_config JSON COMMENT '图表配置参数',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  KEY idx_conversation_id (conversation_id),
  CONSTRAINT fk_chart_conversation FOREIGN KEY (conversation_id) REFERENCES qa_conversation(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图表配置表';

-- 关键发现表
CREATE TABLE IF NOT EXISTS qa_key_finding (
  id BIGINT AUTO_INCREMENT COMMENT '主键ID' PRIMARY KEY,
  conversation_id BIGINT NOT NULL COMMENT '关联的对话ID',
  finding_type VARCHAR(20) NOT NULL COMMENT '发现类型: KEY(关键发现), EXTENSION(延伸解读)',
  content TEXT NOT NULL COMMENT '发现内容',
  relevance_score DECIMAL(5,2) DEFAULT NULL COMMENT '相关度评分',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  KEY idx_conversation_id (conversation_id),
  CONSTRAINT fk_finding_conversation FOREIGN KEY (conversation_id) REFERENCES qa_conversation(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='关键发现表';