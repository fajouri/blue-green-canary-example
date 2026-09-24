const express = require('express');
const app = express();
const port = 3002;

let requestCount = 0;

app.get('/', (req, res) => {
  requestCount += 1;
  console.log(`v2 request count: ${requestCount}`);
  res.send(`Hello from v2 (Green/Canary)! Requests: ${requestCount}`);
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    version: 'v2'
  });
});

app.listen(port, () => console.log(`v2 running on ${port}`));
