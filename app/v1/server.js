const express = require('express');
const app = express();
const port = 3001;

let requestCount = 0;

app.get('/', (req, res) => {
  requestCount += 1;
  console.log(`v1 request count: ${requestCount}`);
  res.send(`Hello from v1 (Blue)! Requests: ${requestCount}`);
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    version: 'v1'
  });
});

app.listen(port, () => console.log(`v1 running on ${port}`));
