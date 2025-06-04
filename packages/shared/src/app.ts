import express from 'express';
import { prometheus } from './config/metrics';

const app = express();

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', prometheus.register.contentType);
    res.end(await prometheus.register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

export { app }; 