const mysql = require('mysql2/promise');

async function queryAllData() {
  const db = await mysql.createConnection({
    host: 'mysql.sqlpub.com',
    port: 3306,
    user: 'peter_xin',
    password: 's7oADISJGcpiQuQn',
    database: 'dify_test_peter'
  });

  try {
    const [citizens] = await db.query('SELECT * FROM FKD_BJR');
    const [cases] = await db.query('SELECT * FROM JJD_JJD');
    const [polices] = await db.query('SELECT * FROM MJ_XX_ontology');
    const [smsjRelations] = await db.query('SELECT * FROM JQ_SMSJ_ontology');
    const [mfjzRelations] = await db.query('SELECT * FROM JQ_MJFZ_ontology');
    
    console.log(JSON.stringify({ citizens, cases, polices, smsjRelations, mfjzRelations }, null, 2));
  } finally {
    await db.end();
  }
}
queryAllData();