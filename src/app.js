import ky from 'ky';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';

import logger from './resources/log.js'
import { addRoutes } from "./routes.js"
import { startCrons } from "./crons.js"
import { addEventsHandlers } from "./events.js"
import { createDB, createServer } from "./resources/index.js"
import { default as pkg } from '../package.json' assert { type: 'json' };

export const App = {
  log: logger,
  env: process.env,
  root: path.dirname(fileURLToPath(import.meta.url)),
  
  resources: {
    events: new EventEmitter(),

    httpClient: ky.create({
      headers: {
        'user-agent': `FShrt/${pkg.version}`,
      }
    })
  },

  async create() {
    this.resources.db = await createDB(this)
    this.resources.server = await createServer(this)
  },

  async start() {
    const {
      PORT,
      FS_CRON_ENABLE,
    } = this.env
    
    addRoutes(this)
    addEventsHandlers(this)

    if ([true, 'true'].includes(FS_CRON_ENABLE || true)) {
      this.log.info('crons :: enabled')
      startCrons(this)
      this.log.info('crons :: started')
    }
    else this.log.info('crons :: disabled')

    this.resources.server.listen(PORT, () => this.log.info(`server :: running on port ${PORT}`))
  }
}
