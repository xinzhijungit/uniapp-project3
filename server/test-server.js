const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/api/v1/warning/events', (req, res) => {
  console.log('Received request:', req.query);
  res.json({ 
    code: 200, 
    message: 'success', 
    data: { 
      list: [{ id: 1, eventNo: 'YJ-2026-0521-0001', ruleName: '测试预警', alertLevel: 'RED', status: 'PENDING' }], 
      total: 1 
    } 
  });
});

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});