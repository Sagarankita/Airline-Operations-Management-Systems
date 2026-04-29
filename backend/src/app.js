const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const { NODE_ENV, CORS_ORIGIN } = require('./config/env');
const routes       = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { setupSwagger } = require('../swagger');

const app = express();

app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (NODE_ENV !== 'test') app.use(morgan('dev'));

setupSwagger(app);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1', routes);

app.use(errorHandler);

module.exports = app;
