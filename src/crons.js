import cron from 'node-cron'

export function startCrons(App) {
  const { db } = App.resources

  cron.schedule('*/10 * * * * *', async () => {
    const items = await db.resource('report-items').page(1)
    
    if (!items.length) return
    else console.log(' clicks :: calculating...')

    const report = items.reduce((acc, item) => {
      if (!acc[item.urlId]) acc[item.urlId] = 0
      acc[item.urlId]++
      return acc
    }, {})

    for (const [urlId, clicks] of Object.entries(report)) {
      const url = await db.resource('urls').get(urlId)
      await db.resource('urls').update(urlId, { clicks: url.clicks + clicks })
    }

    await db.resource('report-items').deleteMany(items.map(item => item.id))
    console.log(' clicks :: added:', items.length);
  });
}
