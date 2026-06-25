export const mockPersonData = {
  basicInfo: {
    name: '王利民',
    idCard: '320382198512096789',
    phone: '13812345678',
    plateNumber: '陕A-88888',
    gender: '男',
    age: 41,
    occupation: '无固定职业',
    domicile: '江苏省徐州市',
    address: '西安市雁塔区小寨东路12号',
    workUnit: '无固定单位',
    status: '在逃人员',
    riskScore: 92
  },
  riskTags: [
    { name: '高危人员', priority: 'high', code: 'HIGH_RISK_PERSON' },
    { name: '前科人员', priority: 'high', code: 'CRIMINAL_RECORD' },
    { name: '昼伏夜出', priority: 'medium', code: 'NOCTURNAL' },
    { name: '涉毒人员', priority: 'high', code: 'DRUG_INVOLVED' },
    { name: '活动异常', priority: 'medium', code: 'ABNORMAL_ACTIVITY' }
  ],
  riskDetails: [
    {
      type: '同行风险',
      level: 'high',
      description: '近期与前科人员同行3次，同监所同行1次，最近涉警2次',
      suggestion: '布控拦截'
    },
    {
      type: '涉警风险',
      level: 'high',
      description: '近30天涉及2次治安警情（打架斗殴）',
      suggestion: '轨迹监控'
    },
    {
      type: '购买风险',
      level: 'medium',
      description: '通过电商平台购买强力开锁工具',
      suggestion: '重点关注'
    }
  ],
  aiAnalysis: 'AI分析原因如下：最近与前科人员同行3次，同监所同行1次，最近涉警2次，近期网购精密购买危险品1次