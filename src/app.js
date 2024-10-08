import path from 'path';
import { fileURLToPath } from 'url';

import { addRoutes } from "./routes.js"
import { startCrons } from "./crons.js"
import { createDB, createServer } from "./resources/index.js"

export const App = {
  resources: {},
  env: process.env,
  root: path.dirname(fileURLToPath(import.meta.url)),

  async create() {
    this.resources.db = await createDB(this)
    this.resources.server = await createServer(this)
  },

  async start() {
    addRoutes(this)

    if ([true, 'true'].includes(this.env.FS_CRON_ENABLE || true)) startCrons(this)

    this.resources.server.listen(this.env.PORT, () => console.info(`FShrt :: server - running on port ${this.env.PORT}`))
  }
}
