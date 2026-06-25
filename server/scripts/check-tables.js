const mysql = require('mysql2/promise');

async function checkTables() {
  const db = await mysql.createConnection({
    host: 'mysql.sqlpub.com',
    port: 3306,
    user: 'peter_xin',
    password: 's7oADISJGcpiQuQn',
    database: 'dify_test_peter'
  });

  try {
    const [personTables] = await db.query("SHOW TABLES LIKE 'person_household'");
    const [criminalTables] = await db.query("SHOW TABLES LIKE 'criminal_record_db'");
    
    console.log('person_household表存在:', personTables.length > 0);
    console.log('criminal_record_db表存在:', criminalTables.length > 0);
    
    if (personTables.length > 0) {
      const [columns] = await db.query('DESCRIBE person_household');
      console.log('\nperson_household表结构:');
      columns.forEach(col => console.log(`  ${col.Field}: ${col.Type}`));
      
      const [rows] = await db.query('SELECT COUNT(*) as count FROM person_household');
      console.log(`\n记录数: ${rows[0].count}`);
    }
    
    if (criminalTables.length > 0) {
      const [columns] = await db.query('DESCRIBE criminal_record_db');
      console.log('\ncriminal_record_db表结构:');
      columns.forEach(col => console.log(`  ${col.Field}: ${col.Type}`));
      
      const [rows] = await db.query('SELECT COUNT(*) as count FROM criminal_record_db');
      console.log(`\n记录数: ${rows[0].count}`);
    }

  } finally {
    await db.end();
  }
}

checkTables();