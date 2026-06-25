const mysql = require('mysql2/promise');
const fs = require('fs');

async function generateDoc() {
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
    const [householdData] = await db.query('SELECT * FROM person_household');
    const [criminalRecords] = await db.query('SELECT * FROM criminal_record_db');

    const allCitizens = [];
    const citizenIdMap = new Map();

    citizens.forEach(c => {
      const id = c.BH;
      citizenIdMap.set(c.ZJHM, id);
      allCitizens.push({
        id: id,
        name: c.XM,
        idCard: c.ZJHM,
        phone: c.LXDH,
        registeredAddr: c.HJXZ,
        currentAddr: c.XZXZ,
        isKeyPerson: c.SFZDRY === '1',
        plateNumber: c.CPH_ontology,
        source: 'FKD_BJR'
      });
    });

    householdData.forEach(h => {
      if (!citizenIdMap.has(h.id_card)) {
        const newId = `citizen_${h.id_card}`;
        citizenIdMap.set(h.id_card, newId);
        allCitizens.push({
          id: newId,
          name: h.name,
          idCard: h.id_card,
          phone: '-',
          registeredAddr: h.address,
          currentAddr: h.address,
          isKeyPerson: false,
          plateNumber: '-',
          source: 'person_household'
        });
      }
    });

    criminalRecords.forEach(c => {
      if (!citizenIdMap.has(c.id_card)) {
        const newId = `citizen_${c.id_card}`;
        citizenIdMap.set(c.id_card, newId);
        allCitizens.push({
          id: newId,
          name: c.name,
          idCard: c.id_card,
          phone: '-',
          registeredAddr: c.household_addr || '-',
          currentAddr: c.household_addr || '-',
          isKeyPerson: false,
          plateNumber: '-',
          source: 'criminal_record_db'
        });
      }
    });

    let doc = `# 知识图谱数据定义

## 一、节点数据

### 1. 人员节点 (citizen)

| 节点ID | 姓名 | 身份证号 | 联系电话 | 户籍地 | 现住址 | 是否重点人员 | 车牌号 | 数据来源 |
|--------|------|----------|----------|--------|--------|--------------|--------|----------|
`;

    allCitizens.forEach(c => {
      doc += `| ${c.id} | ${c.name || '-'} | ${c.idCard || '-'} | ${c.phone || '-'} | ${c.registeredAddr || '-'} | ${c.currentAddr || '-'} | ${c.isKeyPerson ? '是' : '否'} | ${c.plateNumber || '-'} | ${c.source} |\n`;
    });

    doc += `\n---\n\n### 2. 案件节点 (case)\n\n| 节点ID | 警情编号 | 报警内容 | 报警时间 |\n|--------|----------|----------|----------|\n`;

    cases.forEach(c => {
      const time = c.BJSJ ? new Date(c.BJSJ).toLocaleString('zh-CN') : '-';
      doc += `| case_${c.JJDBH} | ${c.JJDBH} | ${c.BJNR || '-'} | ${time} |\n`;
    });

    doc += `\n---\n\n### 3. 民警节点 (police)\n\n| 节点ID | 民警工号 | 姓名 | 职能 | 状态 | 所属单位 | 联系电话 |\n|--------|----------|------|------|------|----------|----------|\n`;

    polices.forEach(p => {
      doc += `| police_${p.MJGH} | ${p.MJGH} | ${p.XM || '-'} | ${p.ZN_ontology || '-'} | ${p.ZT_ontology || '-'} | ${p.SJDWMC || '-'} | ${p.LXDH || '-'} |\n`;
    });

    doc += `\n---\n\n### 4. 户籍节点 (household)\n\n| 节点ID | 户籍编号 | 户号 | 户籍地址 | 户别 |\n|--------|----------|------|----------|------|\n`;

    const householdSet = new Set();
    householdData.forEach(h => {
      if (!householdSet.has(h.household_id)) {
        householdSet.add(h.household_id);
        doc += `| household_${h.household_id} | ${h.household_id} | ${h.household_number || '-'} | ${h.address || '-'} | ${h.household_type || '-'} |\n`;
      }
    });

    doc += `\n---\n\n### 5. 案底记录节点 (criminal)\n\n| 节点ID | 姓名 | 罪名 | 服刑状态 | 判决日期 | 刑期（月） |\n|--------|------|------|----------|----------|------------|\n`;

    criminalRecords.forEach(c => {
      const sentenceDate = c.sentence_date ? new Date(c.sentence_date).toLocaleDateString('zh-CN') : '-';
      doc += `| criminal_${c.record_id} | ${c.name || '-'} | ${c.crime_type || '-'} | ${c.prison_status || '-'} | ${sentenceDate} | ${c.sentence_months || '-'} |\n`;
    });

    doc += `\n---\n\n## 二、关系数据\n\n### 1. 人员-案件关系（涉及）\n\n| 关系ID | 源节点 | 目标节点 | 关系类型 | 备注 |\n|--------|--------|----------|----------|------|\n`;

    smsjRelations.forEach((r, i) => {
      doc += `| SMSJ${String(i + 1).padStart(8, '0')} | ${r.BJR_BH} | case_${r.JJDBH} | 涉及 | ${r.BZ || '报警人'} |\n`;
    });

    doc += `\n---\n\n### 2. 民警-案件关系（负责）\n\n| 关系ID | 源节点 | 目标节点 | 关系类型 | 开始时间 | 备注 |\n|--------|--------|----------|----------|----------|------|\n`;

    mfjzRelations.forEach((r, i) => {
      const time = r.FZKS ? new Date(r.FZKS).toLocaleString('zh-CN') : '-';
      doc += `| MJFZ${String(i + 1).padStart(8, '0')} | police_${r.MJGH} | case_${r.JJDBH} | 负责 | ${time} | ${r.BZ || '处警民警'} |\n`;
    });

    doc += `\n---\n\n### 3. 人员-户籍关系（每一行person_household对应一条关系）\n\n| 关系ID | 源节点 | 目标节点 | 关系类型 | 户籍地址 |\n|--------|--------|----------|----------|----------|\n`;

    householdData.forEach((h, i) => {
      const citizenId = citizenIdMap.get(h.id_card);
      if (citizenId) {
        doc += `| HH${String(i + 1).padStart(8, '0')} | ${citizenId} | household_${h.household_id} | ${h.relation_to_head || '户籍成员'} | ${h.address || '-'} |\n`;
      }
    });

    doc += `\n---\n\n### 4. 人员-案底关系（每一行criminal_record_db对应一条关系）\n\n| 关系ID | 源节点 | 目标节点 | 关系类型 | 罪名 |\n|--------|--------|----------|----------|------|\n`;

    criminalRecords.forEach((c, i) => {
      const citizenId = citizenIdMap.get(c.id_card);
      if (citizenId) {
        const relation = c.prison_status === '通缉' ? '通缉在逃' : (c.prison_status === '在逃' ? '在逃' : '有案底');
        doc += `| CR${String(i + 1).padStart(8, '0')} | ${citizenId} | criminal_${c.record_id} | ${relation} | ${c.crime_type || '-'} |\n`;
      }
    });

    doc += `\n---\n\n## 三、图例定义\n\n| 节点类型 | 颜色 | 图标 |\n|----------|------|------|\n| 人员 (citizen) | #2196F3 | 🔵 |\n| 案件 (case) | #F44336 | 🔴 |\n| 民警 (police) | #4CAF50 | 🟢 |\n| 户籍 (household) | #FF9800 | 🟠 |\n| 案底 (criminal) | #9C27B0 | 🟣 |\n\n---\n\n## 四、数据统计\n\n| 类别 | 数量 |\n|------|------|\n| 人员节点 | ${allCitizens.length} |\n| 案件节点 | ${cases.length} |\n| 民警节点 | ${polices.length} |\n| 户籍节点 | ${householdSet.size} |\n| 案底记录节点 | ${criminalRecords.length} |\n| **节点总计** | **${allCitizens.length + cases.length + polices.length + householdSet.size + criminalRecords.length}** |\n| 人员-案件关系 | ${smsjRelations.length} |\n| 民警-案件关系 | ${mfjzRelations.length} |\n| 人员-户籍关系 | ${householdData.length} |\n| 人员-案底关系 | ${criminalRecords.length} |\n| **关系总计** | **${smsjRelations.length + mfjzRelations.length + householdData.length + criminalRecords.length}** |\n\n---\n\n## 五、数据来源\n\n| 数据表 | 记录数 |\n|--------|--------|\n| FKD_BJR（人员表） | ${citizens.length} |\n| JJD_JJD（案件表） | ${cases.length} |\n| MJ_XX_ontology（民警表） | ${polices.length} |\n| JQ_SMSJ_ontology（人员-案件关系） | ${smsjRelations.length} |\n| JQ_MJFZ_ontology（民警-案件关系） | ${mfjzRelations.length} |\n| person_household（人口库） | ${householdData.length} |\n| criminal_record_db（案底库） | ${criminalRecords.length} |\n`;

    fs.writeFileSync('/Users/xiaoping/Desktop/智慧西安开发/uniapp-project/docs/知识图谱数据.md', doc);
    console.log('知识图谱文档生成成功！');
    console.log(`人员节点总数: ${allCitizens.length}`);
    console.log(`户籍关系数: ${householdData.length}`);
    console.log(`案底关系数: ${criminalRecords.length}`);

  } finally {
    await db.end();
  }
}

generateDoc();