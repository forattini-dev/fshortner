import { S3db, CostsPlugin } from 's3db.js'

export async function createDB(App) {
  const { 
    FS_CONNECTION_STRING,
    FS_COSTS_ENABLE = 'true',
  } = App.env

  let plugins = []
  if ([true, 'true'].includes(FS_COSTS_ENABLE)) plugins.push(CostsPlugin)

  const db = new S3db({
    plugins,
    connectionString: FS_CONNECTION_STRING,
  })

  await db.connect()

  await db.createResource({
    name: 'urls',
    attributes: {
      ip: 'string',
      link: 'string',
      shareableLink: 'string|optional',
      webhook: 'string|optional',
      clicks: 'number|optional|min:0',
      views: 'number|optional|min:0',
      getFingerprints: 'boolean|optional|default:true',
      openGraph: {
        $$type: 'object|optional',
        title: 'string|optional',
        description: 'string|optional',
        image: 'string|optional',
      },
    },
  })

  const dynamicEventsAttrs = {
    urlId: 'string',
    ip: 'string',
    sessionId: 'string',
    utm: {
      $$type: 'object|optional',
      source: 'string|optional',
      medium: 'string|optional',
      campaign: 'string|optional',
      content: 'string|optional',
      term: 'string|optional',
    }
  }

  await db.createResource({
    name: 'clicks',
    attributes: dynamicEventsAttrs,
  })

  await db.createResource({
    name: 'clicks-report',
    attributes: dynamicEventsAttrs,
  })

  await db.createResource({
    name: 'views',
    attributes: {
      ...dynamicEventsAttrs,
      fingerprintId: 'string',
    },
  })

  await db.createResource({
    name: 'views-report',
    attributes: {
      ...dynamicEventsAttrs,
      fingerprintId: 'string',
    },
  })

  await db.createResource({
    name: 'fingerprints',
    attributes: {
      lastSessionId: 'string',
      cpu: 'number',
      memory: 'number',
      lastIp: 'string',
      timezone: 'string',
      userAgent: 'string',
      colorDepth: 'number',
      resolution: 'string',
      windowSize: 'string',
      system: 'string|optional',
      browser: 'string|optional',
    },
  })

  await db.createResource({
    name: 'sessions',
    attributes: {
      clicks: 'number|optional|min:0',
      views: 'number|optional|min:0',
      lastFingerprintId: 'string|optional',
    },
  })

  return db
}
