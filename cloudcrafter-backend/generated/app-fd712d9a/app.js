const express = require('express');
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>CloudCrafter Demo App</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; background: #0f172a; color: #e5e7eb; }
          .card { max-width: 640px; margin: 0 auto; padding: 24px; border-radius: 12px; background: #020617; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
          h1 { font-size: 24px; margin-bottom: 8px; color: #38bdf8; }
          p { margin: 4px 0; }
          .buttons { margin-top: 16px; display: flex; gap: 8px; }
          .btn { padding: 8px 14px; border-radius: 999px; border: none; cursor: pointer; font-size: 13px; }
          .btn-primary { background: #22c55e; color: #022c22; }
          .btn-secondary { background: #1e293b; color: #e5e7eb; }
          .tag { display: inline-block; margin-top: 12px; padding: 4px 10px; border-radius: 999px; background: #1e293b; font-size: 12px; color: #a5b4fc; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>CloudCrafter Demo App</h1>
          <p>This is a fake demo app generated from your visual blueprint.</p>
          <p>In a full version, each blueprint would get its own real UI and backend.</p>
          <div class="buttons">
            <button class="btn btn-primary">Simulate Request</button>
            <button class="btn btn-secondary">View Logs</button>
          </div>
          <div class="tag">Prototype deployment target</div>
        </div>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));