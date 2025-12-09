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
          .card { max-width: 600px; margin: 0 auto; padding: 24px; border-radius: 12px; background: #111827; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
          h1 { font-size: 24px; margin-bottom: 8px; color: #38bdf8; }
          p { margin: 4px 0; }
          .tag { display: inline-block; margin-top: 8px; padding: 4px 8px; border-radius: 999px; background: #1e293b; font-size: 12px; color: #a5b4fc; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>CloudCrafter Demo App</h1>
          <p>This app was generated from a visual blueprint.</p>
          <p>You can swap this for any backend or UI per blueprint.</p>
          <div class="tag">Prototype deployment target</div>
        </div>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));