// 知识图谱数据 - 从知识图谱数据.md文档解析
// 这是唯一非数据库来源的数据

const graphData = {
  // 人员节点
  citizens: [
    { id: 'BJR20260500001', name: '李明', idCard: '610103199001011234', phone: '13812345601', householdAddress: '碑林区友谊西路123号', currentAddress: '碑林区友谊西路123号', isKeyPerson: '否', plateNo: '陕A3F7B2' },
    { id: 'BJR20260500002', name: '王丽', idCard: '610113198506152345', phone: '13912345602', householdAddress: '雁塔区长安南路456号', currentAddress: '雁塔区长安南路456号', isKeyPerson: '否', plateNo: '陕A8K1E5' },
    { id: 'BJR20260500003', name: '张磊', idCard: '610112199203013456', phone: '13712345603', householdAddress: '未央区凤城五路789号', currentAddress: '未央区凤城五路789号', isKeyPerson: '否', plateNo: '陕A2M9C6' },
    { id: 'BJR20260500004', name: '赵强', idCard: '610104198803154567', phone: '13612345604', householdAddress: '莲湖区西关正街12号', currentAddress: '莲湖区西关正街12号', isKeyPerson: '否', plateNo: '陕U5H4A3' },
    { id: 'BJR20260500005', name: '刘洋', idCard: '610111199508086789', phone: '13512345605', householdAddress: '灞桥区纺织城东街66号', currentAddress: '灞桥区纺织城东街66号', isKeyPerson: '否', plateNo: '陕A7D6G1' },
    { id: 'BJR20260500006', name: '陈静', idCard: '610116199104209876', phone: '13312345606', householdAddress: '长安区韦曲南街100号', currentAddress: '长安区韦曲南街100号', isKeyPerson: '否', plateNo: '陕A9R2L8' },
    { id: 'BJR20260500007', name: '黄浩', idCard: '610113198706212345', phone: '13212345607', householdAddress: '雁塔区朱雀大街88号', currentAddress: '雁塔区朱雀大街88号', isKeyPerson: '是', plateNo: '陕U1W3N4' },
    { id: 'BJR20260500008', name: '周华', idCard: '610103198102034567', phone: '13112345608', householdAddress: '碑林区南大街15号', currentAddress: '碑林区南大街15号', isKeyPerson: '是', plateNo: '陕A4T7P9' },
    { id: 'BJR20260500009', name: '吴强', idCard: '610104199312056789', phone: '13012345609', householdAddress: '莲湖区劳动路30号', currentAddress: '莲湖区劳动路30号', isKeyPerson: '否', plateNo: '陕A6J5V2' },
    { id: 'BJR20260500010', name: '郑丽', idCard: '610112199507123456', phone: '12912345610', householdAddress: '未央区太华北路200号', currentAddress: '未央区太华北路200号', isKeyPerson: '是', plateNo: '陕U0B8C7' },
    { id: 'BJR20260500011', name: '冯军', idCard: '610111198909091234', phone: '12812345611', householdAddress: '灞桥区纺一路77号', currentAddress: '灞桥区纺一路77号', isKeyPerson: '否', plateNo: '陕A2Z9F4' },
    { id: 'BJR20260500012', name: '蒋涛', idCard: '610116197802124567', phone: '12712345612', householdAddress: '长安区西长安街50号', currentAddress: '长安区西长安街50号', isKeyPerson: '否', plateNo: '陕A5X1M3' },
    { id: 'BJR20260500013', name: '何娟', idCard: '610113200105013456', phone: '12612345613', householdAddress: '雁塔区小寨东路100号', currentAddress: '雁塔区小寨东路100号', isKeyPerson: '否', plateNo: '陕U7L2K6' },
    { id: 'BJR20260500014', name: '马玲', idCard: '610103199812206789', phone: '12512345614', householdAddress: '碑林区东大街200号', currentAddress: '碑林区东大街200号', isKeyPerson: '否', plateNo: '陕A8Q4H9' },
    { id: 'BJR20260500015', name: '罗强', idCard: '610104199006153456', phone: '12412345615', householdAddress: '莲湖区大庆路88号', currentAddress: '莲湖区大庆路88号', isKeyPerson: '否', plateNo: '陕A3C6J1' },
    { id: 'BJR20260500016', name: '宋丽', idCard: '610112199108086789', phone: '12312345616', householdAddress: '未央区凤城二路60号', currentAddress: '未央区凤城二路60号', isKeyPerson: '否', plateNo: '陕U9Y5R2' },
    { id: 'BJR20260500017', name: '唐伟', idCard: '610111199410203456', phone: '12212345617', householdAddress: '灞桥区十里铺街道', currentAddress: '灞桥区十里铺街道', isKeyPerson: '否', plateNo: '陕A1N7B4' },
    { id: 'BJR20260500018', name: '曹静', idCard: '610116200306051234', phone: '12112345618', householdAddress: '长安区青年北街30号', currentAddress: '长安区青年北街30号', isKeyPerson: '否', plateNo: '陕A4P8T3' },
    { id: 'BJR20260500019', name: '邓华', idCard: '610113195005013456', phone: '12012345619', householdAddress: '雁塔区翠华路107号', currentAddress: '雁塔区翠华路107号', isKeyPerson: '否', plateNo: '陕U6D2X9' },
    { id: 'BJR20260500020', name: '彭娟', idCard: '610103198705083456', phone: '11912345620', householdAddress: '碑林区长安北路50号', currentAddress: '碑林区长安北路50号', isKeyPerson: '否', plateNo: '陕A0F5K7' },
    { id: 'BJR20260500021', name: '秦军', idCard: '610104199203058901', phone: '11812345621', householdAddress: '莲湖区西华门大街20号', currentAddress: '莲湖区西华门大街20号', isKeyPerson: '否', plateNo: '陕A2G9M1' },
    { id: 'BJR20260500022', name: '沈涛', idCard: '610111199604122345', phone: '11712345622', householdAddress: '灞桥区浐灞生态区', currentAddress: '灞桥区浐灞生态区', isKeyPerson: '否', plateNo: '陕A7H3L8' },
    { id: 'BJR20260500023', name: '杨华', idCard: '610116198510023456', phone: '11612345623', householdAddress: '长安区文苑南路', currentAddress: '长安区文苑南路', isKeyPerson: '否', plateNo: '陕U5R1Q4' },
    { id: 'BJR20260500024', name: '韩丽', idCard: '610113197612053456', phone: '11512345624', householdAddress: '雁塔区电子正街88号', currentAddress: '雁塔区电子正街88号', isKeyPerson: '否', plateNo: '陕A8T6N2' },
    { id: 'BJR20260500025', name: '余浩', idCard: '610103198303216789', phone: '11412345625', householdAddress: '碑林区太白北路10号', currentAddress: '碑林区太白北路10号', isKeyPerson: '否', plateNo: '陕A1Z4C7' },
    { id: 'BJR20260500026', name: '方芳', idCard: '610104199409093456', phone: '11312345626', householdAddress: '莲湖区北大街118号', currentAddress: '莲湖区北大街118号', isKeyPerson: '否', plateNo: '陕U3B9P5' },
    { id: 'BJR20260500027', name: '袁明', idCard: '610112197805201234', phone: '11212345627', householdAddress: '未央区凤城八路100号', currentAddress: '未央区凤城八路100号', isKeyPerson: '否', plateNo: '陕A6K2V8' },
    { id: 'BJR20260500028', name: '许静', idCard: '610113199708074567', phone: '11112345628', householdAddress: '雁塔区科技路50号', currentAddress: '雁塔区科技路50号', isKeyPerson: '否', plateNo: '陕A9W7D3' },
    { id: 'BJR20260500029', name: '丁磊', idCard: '610116199105163456', phone: '11012345629', householdAddress: '长安区郭杜东街15号', currentAddress: '长安区郭杜东街15号', isKeyPerson: '否', plateNo: '陕U4L1F6' },
    { id: 'BJR20260500030', name: '苏伟', idCard: '610111198901021234', phone: '10912345630', householdAddress: '灞桥区矿山路88号', currentAddress: '灞桥区矿山路88号', isKeyPerson: '否', plateNo: '陕A0P5Y2' }
  ],

  // 案件节点
  cases: [
    { id: 'case_JJ20260500001', caseNo: 'JJ20260500001', content: '电动车被盗，价值约3000元', time: '2026/5/3 10:30:00' },
    { id: 'case_JJ20260500002', caseNo: 'JJ20260500002', content: '接到冒充公检法电话诈骗，被骗转账5万元', time: '2026/5/5 14:20:00' },
    { id: 'case_JJ20260500003', caseNo: 'JJ20260500003', content: '网络刷单被骗3万元', time: '2026/5/12 09:45:00' },
    { id: 'case_JJ20260500004', caseNo: 'JJ20260500004', content: '两辆小轿车追尾，无人员受伤', time: '2026/5/1 08:15:00' },
    { id: 'case_JJ20260500005', caseNo: 'JJ20260500005', content: '电动车与行人碰撞，行人轻伤', time: '2026/5/8 17:30:00' },
    { id: 'case_JJ20260500006', caseNo: 'JJ20260500006', content: '三车连环相撞，有人员被困', time: '2026/5/20 12:00:00' },
    { id: 'case_JJ20260500007', caseNo: 'JJ20260500007', content: '多人聚集赌博，赌资较大', time: '2026/5/4 22:10:00' },
    { id: 'case_JJ20260500008', caseNo: 'JJ20260500008', content: '棋牌室内赌博', time: '2026/5/15 21:30:00' },
    { id: 'case_JJ20260500009', caseNo: 'JJ20260500009', content: '网络赌博，手机下注', time: '2026/5/25 20:00:00' },
    { id: 'case_JJ20260500010', caseNo: 'JJ20260500010', content: '疑似吸毒，精神恍惚', time: '2026/5/7 15:00:00' },
    { id: 'case_JJ20260500011', caseNo: 'JJ20260500011', content: '发现疑似毒品交易', time: '2026/5/18 16:20:00' },
    { id: 'case_JJ20260500012', caseNo: 'JJ20260500012', content: '种植罂粟原植物', time: '2026/5/28 11:10:00' },
    { id: 'case_JJ20260500013', caseNo: 'JJ20260500013', content: '被陌生男子猥亵', time: '2026/5/6 19:45:00' },
    { id: 'case_JJ20260500014', caseNo: 'JJ20260500014', content: '被一男子猥亵', time: '2026/5/19 20:30:00' },
    { id: 'case_JJ20260500015', caseNo: 'JJ20260500015', content: '以找工作为由被骗2万元', time: '2026/5/2 11:00:00' },
    { id: 'case_JJ20260500016', caseNo: 'JJ20260500016', content: '假冒客服退款诈骗，损失1.5万', time: '2026/5/22 13:15:00' },
    { id: 'case_JJ20260500017', caseNo: 'JJ20260500017', content: '持刀抢劫手机一部', time: '2026/5/10 23:05:00' },
    { id: 'case_JJ20260500018', caseNo: 'JJ20260500018', content: '背包被抢夺，内有现金2000元', time: '2026/5/11 22:40:00' },
    { id: 'case_JJ20260500019', caseNo: 'JJ20260500019', content: '78岁老人走失，患有阿尔茨海默病', time: '2026/5/9 08:30:00' },
    { id: 'case_JJ20260500020', caseNo: 'JJ20260500020', content: '5岁男孩走失，身穿红色上衣', time: '2026/5/13 16:00:00' },
    { id: 'case_JJ20260500021', caseNo: 'JJ20260500021', content: '有人晕倒，急需急救', time: '2026/5/14 09:30:00' },
    { id: 'case_JJ20260500022', caseNo: 'JJ20260500022', content: '有人溺水，正在挣扎', time: '2026/5/16 14:45:00' },
    { id: 'case_JJ20260500023', caseNo: 'JJ20260500023', content: '有人从教学楼坠落', time: '2026/5/17 07:20:00' },
    { id: 'case_JJ20260500024', caseNo: 'JJ20260500024', content: '住宅起火，浓烟滚滚', time: '2026/5/21 18:10:00' },
    { id: 'case_JJ20260500025', caseNo: 'JJ20260500025', content: '闻到浓烈燃气味，疑似泄漏', time: '2026/5/23 11:50:00' },
    { id: 'case_JJ20260500026', caseNo: 'JJ20260500026', content: '电梯故障多人被困', time: '2026/5/24 19:35:00' },
    { id: 'case_JJ20260500027', caseNo: 'JJ20260500027', content: '拖欠农民工工资，聚集讨薪', time: '2026/5/26 10:00:00' },
    { id: 'case_JJ20260500028', caseNo: 'JJ20260500028', content: '消费纠纷，顾客与店家冲突', time: '2026/5/27 12:30:00' },
    { id: 'case_JJ20260500029', caseNo: 'JJ20260500029', content: '医疗纠纷，家属围堵医院', time: '2026/5/29 15:00:00' },
    { id: 'case_JJ20260500030', caseNo: 'JJ20260500030', content: '物业与业主纠纷，堵门', time: '2026/5/30 09:00:00' }
  ],

  // 民警节点
  police: [
    { id: 'police_J001', policeNo: 'J001', name: '张伟', duty: '接警民警', status: '在岗状态', unit: '西安市公安局指挥中心', phone: '13800000001' },
    { id: 'police_J002', policeNo: 'J002', name: '王芳', duty: '接警民警', status: '在岗状态', unit: '西安市公安局指挥中心', phone: '13800000002' },
    { id: 'police