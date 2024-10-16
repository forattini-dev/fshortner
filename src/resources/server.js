import path from 'path'
import hpp from 'hpp'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import Express from 'express';
import nocache from 'nocache';
import compression from 'compression'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import statusMonitor from 'express-status-monitor'
import { nanoid } from 'nanoid'

export async function createServer(App) {
  const {
    FS_BEHIND_PROXY = 'false',
  } = App.env

  const server = Express();

  server.disable('etag');
  server.disable('x-powered-by');

  if ([true, 'true'].includes(FS_BEHIND_PROXY)) {
    server.set('trust proxy', true);
  }

  server.set('view engine', 'ejs');
  server.set('views', path.join(App.root, 'views'));

  server.use(statusMonitor());
  server.use(Express.json());
  server.use(Express.urlencoded({ extended: true }));
  server.use(hpp());
  server.use(cors());
  server.use(helmet())
  server.use(nocache());
  server.use(compression());
  server.use(morgan('dev'));
  server.use(cookieParser());

  server.use(rateLimit({
    max: 100,
    windowMs: 2 * 60 * 1000,
  }));

  server.use((req, res, next) => {
    res.setHeader('Expires', '0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    next();
  });

  return server
}
