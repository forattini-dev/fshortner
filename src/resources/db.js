import { S3db } from 's3db.js'

export async function createDB(App) {
  const db = new S3db({
    connectionString: App.env.FS_CONNECTION_STRING,
  })

  await db.connect()

  await db.createResource({
    name: 'urls',
    attributes: {
      link: 'string',
      shareable: 'string',
      ip: 'string',
      clicks: 'number|optional|min:0',
      views: 'number|optional|min:0',
    },
  })

  await db.createResource({
    name: 'users',
    attributes: {
      userAgent: 'string',
      cpu: 'number',
      memory: 'number',
      screenWidth: 'number',
      screenHeight: 'number',
      resolution: 'string',
      colorDepth: 'number',
      timezone: 'string',
    },
  })

  const dynamicEventsAttrs = {
    urlId: 'string',
    ip: 'string',
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
    attributes: dynamicEventsAttrs,
  })

  await db.createResource({
    name: 'views-report',
    attributes: dynamicEventsAttrs,
  })

  return db
}
