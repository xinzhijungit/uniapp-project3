const mysql = require('mysql2/promise');
const fs = require('fs');

async function exportToJson() {
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

    const graphData = {
      nodes: [],
      links: []
    };

    const nodeIdMap = new Set();
    const citizenIdMap = new Map();

    citizens.forEach(citizen => {
      const nodeId = citizen.BH;
      citizenIdMap.set(citizen.ZJHM, nodeId);
      if (!nodeIdMap.has(nodeId)) {
        nodeIdMap.add(nodeId);
        graphData.nodes.push({
          id: nodeId,
          type: 'citizen',
          label: citizen.XM,
          color: '#2196F3',
          properties: {
            BH: citizen.BH,
            XM: citizen.XM,
            XB: citizen.XB,
            ZJHM: citizen.ZJHM,
            LXDH: citizen.LXDH,
            HJXZ: citizen.HJXZ,
            XZXZ: citizen.XZXZ,
            GZDW: citizen.GZDW,
            SFZDRY: citizen.SFZDRY,
            CPH_ontology: citizen.CPH_ontology,
            AI_TAG_ontology: citizen.AI_TAG_ontology,
            dataSource: 'FKD_BJR'
          }
        });
      }
    });

    householdData.forEach(h => {
      if (!citizenIdMap.has(h.id_card)) {
        const nodeId = `citizen_${h.id_card}`;
        citizenIdMap.set(h.id_card, nodeId);
        if (!nodeIdMap.has(nodeId)) {
          nodeIdMap.add(nodeId);
          graphData.nodes.push({
            id: nodeId,
            type: 'citizen',
            label: h.name,
            color: '#2196F3',
            properties: {
              ZJHM: h.id_card,
              XM: h.name,
              dataSource: 'person_household'
            }
          });
        }
      }
    });

    criminalRecords.forEach(c => {
      if (!citizenIdMap.has(c.id_card)) {
        const nodeId = `citizen_${c.id_card}`;
        citizenIdMap.set(c.id_card, nodeId);
        if (!nodeIdMap.has(nodeId)) {
          nodeIdMap.add(nodeId);
          graphData.nodes.push({
            id: nodeId,
            type: 'citizen',
            label: c.name,
            color: '#2196F3',
            properties: {
              ZJHM: c.id_card,
              XM: c.name,
              dataSource: 'criminal_record_db'
            }
          });
        }
      }
    });

    cases.forEach(caseItem => {
      const nodeId = 'case_' + caseItem.JJDBH;
      if (!nodeIdMap.has(nodeId)) {
        nodeIdMap.add(nodeId);
        graphData.nodes.push({
          id: nodeId,
          type: 'case',
          label: caseItem.JJDBH.substring(0, 14),
          color: '#F44336',
          properties: {
            JJDBH: caseItem.JJDBH,
            BJNR: caseItem.BJNR,
            BJSJ: caseItem.BJSJ
          }
        });
      }
    });

    polices.forEach(police => {
      const nodeId = 'police_' + police.MJGH;
      if (!nodeIdMap.has(nodeId)) {
        nodeIdMap.add(nodeId);
        graphData.nodes.push({
          id: nodeId,
          type: 'police',
          label: police.XM,
          color: '#4CAF50',
          properties: {
            MJGH: police.MJGH,
            XM: police.XM,
            ZN_ontology: police.ZN_ontology,
            ZT_ontology: police.ZT_ontology,
            SJDWMC: police.SJDWMC,
            LXDH: police.LXDH
          }
        });
      }
    });

    const householdSet = new Set();
    householdData.forEach(item => {
      const nodeId = 'household_' + item.household_id;
      if (!nodeIdMap.has(nodeId) && !householdSet.has(item.household_id)) {
        householdSet.add(item.household_id);
        nodeIdMap.add(nodeId);
        graphData.nodes.push({
          id: nodeId,
          type: 'household',
          label: item.household_number,
          color: '#FF9800',
          properties: {
            household_id: item.household_id,
            household_number: item.household_number,
            address: item.address,
            household_type: item.household_type,
            created_date: item.created_date,
            issuing_authority: item.issuing_authority
          }
        });
      }
    });

    criminalRecords.forEach(record => {
      const nodeId = 'criminal_' + record.record_id;
      if (!nodeIdMap.has(nodeId)) {
        nodeIdMap.add(nodeId);
        graphData.nodes.push({
          id: nodeId,
          type: 'criminal',
          label: record.crime_type || '案底记录',
          color: '#9C27B0',
          properties: {
            record_id: record.record_id,
            id_card: record.id_card,
            name: record.name,
            crime_type: record.crime_type,
            crime_detail: record.crime_detail,
            prison_status: record.prison_status,
            sentence_date: record.sentence_date,
            sentence_months: record.sentence_months
          }
        });
      }
    });

    smsjRelations.forEach(relation => {
      if (nodeIdMap.has(relation.BJR_BH) && nodeIdMap.has('case_' + relation.JJDBH)) {
        graphData.links.push({
          source: relation.BJR_BH,
          target: 'case_' + relation.JJDBH,
          relation: relation.GXLX_ontology || '涉及',
          relationId: relation.GXBH,
          remark: relation.BZ
        });
      }
    });

    mfjzRelations.forEach(relation => {
      if (nodeIdMap.has('police_' + relation.MJGH) && nodeIdMap.has('case_' + relation.JJDBH)) {
        graphData.links.push({
          source: 'police_' + relation.MJGH,
          target: 'case_' + relation.JJDBH,
          relation: relation.GXLX_ontology || '负责',
          relationId: relation.GXBH,
          remark: relation.BZ,
          startTime: relation.FZKS
        });
      }
    });

    householdData.forEach((h, i) => {
      const citizenId = citizenIdMap.get(h.id_card);
      if (citizenId && nodeIdMap.has(citizenId) && nodeIdMap.has('household_' + h.household_id)) {
        graphData.links.push({
          source: citizenId,
          target: 'household_' + h.household_id,
          relation: h.relation_to_head || '户籍成员',
          relationId: `HH${String(i + 1).padStart(8, '0')}`,
          remark: h.address
        });
      }
    });

    criminalRecords.forEach((c, i) => {
      const citizenId = citizenIdMap.get(c.id_card);
      if (citizenId && nodeIdMap.has(citizenId) && nodeIdMap.has('criminal_' + c.record_id)) {
        const relationText = c.prison_status === '通缉' ? '通缉在逃' : (c.prison_status === '在逃' ? '在逃' : '有案底');
        graphData.links.push({
          source: citizenId,
          target: 'criminal_' + c.record_id,
          relation: relationText,
          relationId: `CR${String(i + 1).padStart(8, '0')}`,
          remark: c.crime_type
        });
      }
    });

    const jsonContent = JSON.stringify(graphData, null, 2);
    fs.writeFileSync('/Users/xiaoping/Desktop/智慧西安开发/uniapp-project/server/graph-data.json', jsonContent);
    
    console.log('JSON数据导出成功！');
    console.log(`节点数: ${graphData.nodes.length}`);
    console.log(`关系数: ${graphData.links.length}`);

  } finally {
    await db.end();
  }
}

exportToJson();