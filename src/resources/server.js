import hpp from 'hpp'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import Express from 'express';
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import statusMonitor from 'express-status-monitor'

export async function createServer (App) {
  const server = Express();
  
  server.use(statusMonitor());
  server.use(Express.json());
  server.use(Express.urlencoded({ extended: true }));
  server.use(cors());
  server.use(hpp());
  server.use(helmet());
  server.use(compression());
  server.use(morgan('dev'));
  server.use(rateLimit({
    max: 100,
    windowMs: 15 * 60 * 1000,
  }));

  return server
}
