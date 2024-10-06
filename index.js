import { config } from "dotenv";
config()

import { App } from "./src/app.js";
App.create().then(() => App.start())
