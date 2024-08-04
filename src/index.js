const cors = require('cors');
const express = require('express');
const { router } = require('./routes');
const {createTableCards} = require('./Controller/Card');
const {createTableDecks} = require('./Controller/Deck');
const { createTableUsers } = require('./Controller/User');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger_output.json');

const app = express();
const port = 3001;

createTableUsers();
createTableDecks();
createTableCards();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(router);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.listen(port, () => {
  console.log(`Server started on port: ${port}`)
})

module.exports = { app };