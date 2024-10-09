import ky from 'ky';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';

import { addRoutes } from "./routes.js"
import { startCrons } from "./crons.js"
import { addEventsHandlers } from "./events.js"
import { createDB, createServer } from "./resources/index.js"
import { default as pkg } from '../package.json' assert { type: 'json' };


export const App = {
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
    addRoutes(this)
    addEventsHandlers(this)

    if ([true, 'true'].includes(this.env.FS_CRON_ENABLE || true)) startCrons(this)

    this.resources.server.listen(this.env.PORT, () => console.info(`FShrt :: server - running on port ${this.env.PORT}`))
  }
}
