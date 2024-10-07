import { S3db } from 's3db.js'

export async function createDB (App) {
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
    },
  })

  const clicksAttributes = { 
    urlId: 'string',
    ip: 'string',
    utm: {
      $$type: 'object',
      source: 'string|optional',
      medium: 'string|optional',
      campaign: 'string|optional',
      content: 'string|optional',
      term: 'string|optional',
    }
  }

  await db.createResource({ 
    name: 'clicks', 
    attributes: clicksAttributes,
  })

  await db.createResource({ 
    name: 'report-items', 
    attributes: clicksAttributes,
  })

  return db
}
