import cron from 'node-cron'

export function startCrons(App) {
  const { db } = App.resources

  cron.schedule('*/5 * * * * *', async () => {
    const items = await db.resource('report-items').page(1)
    
    if (!items.length) return
    console.log('FShrt :: clicks - calculating...')

    const report = items.reduce((acc, item) => {
      if (!acc[item.urlId]) acc[item.urlId] = 0
      acc[item.urlId]++
      return acc
    }, {})

    for (const [urlId, clicks] of Object.entries(report)) {
      try {
        const url = await db.resource('urls').get(urlId)
        await db.resource('urls').update(urlId, { clicks: (url.clicks || 0) + clicks })
      } catch (error) {
        console.error('FShrt :: clicks - error:', error)
      }
    }

    await db.resource('report-items').deleteMany(items.map(item => item.id))
  });
}
