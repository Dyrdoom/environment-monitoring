import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import aqRoutes from './routes/aqRoutes.js';
import notFound from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({
    message: 'Eco Monitor API is up. See /api/aq',
    docs: {
      list: '/api/aq',
      fetch: '/api/aq/fetch (POST)',
    }
  });
});

app.use('/api/aq', aqRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
