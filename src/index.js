const cors = require('cors');
const express = require('express');
const { router } = require('./routes');
const {createTableCards} = require('./Controller/Card');
const {createTableDecks} = require('./Controller/Deck');
const { createTableUsers } = require('./Controller/User');

const app = express();
const port = 3000;

createTableUsers();
createTableDecks();
createTableCards();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(router);
app.listen(port, () => {
  console.log(`Server started on port: ${port}`)
})

module.exports = { app };