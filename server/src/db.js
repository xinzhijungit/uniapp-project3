const mysql = require('mysql2/promise')

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

async function withConnection(fn) {
  let connection = null
  try {
    connection = await pool.getConnection()
    console.log('[DB] 成功获取数据库连接')
    const result = await fn(connection)
    return result
  } catch (error) {
    console.error('[DB] 数据库操作失败:', error.message)
    throw error
  } finally {
    if (connection) {
      await connection.release()
      console.log('[DB] 数据库连接已释放')
    }
  }
}

async function query(sql, params = []) {
  return withConnection(async (connection) => {
    console.log('[DB] 执行SQL:', sql)
    console.log('[DB] 参数:', params)
    const [rows] = await connection.query(sql, params)
    console.log('[DB] 查询结果:', rows.length, '条记录')
    return rows
  })
}

async function initConnectionTest() {
  try {
    console.log('[DB] 正在测试数据库连接...')
    console.log('[DB] 连接配置:', {
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      database: DB_CONFIG.database
    })
    
    const result = await query('SELECT 1 as test')
    console.log('[DB] 数据库连接测试成功:', result)
    return true
  } catch (error) {
    console.error('[DB] 数据库连接测试失败:', error.message)
    return false
  }
}

module.exports = {
  pool,
  query,
  withConnection,
  initConnectionTest
}
