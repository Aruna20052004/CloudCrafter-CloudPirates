const express = require('express');
const app = express();
app.use(express.json());
app.get('/', (req, res) => res.json({message: 'Hello CloudCrafter!'}));
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Running on port ${{PORT}}`));