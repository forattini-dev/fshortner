import cron from 'node-cron'

export function startCrons(App) {
  const { db } = App.resources

  const {
    FS_CRON_CLICKS_COUNTER = '*/30 * * * * *',
    FS_CRON_VIEWS_COUNTER = '*/30 * * * * *',
  } = App.env


  // calculate clicks
  cron.schedule(FS_CRON_CLICKS_COUNTER, async () => {
    const items = await db.resource('clicks-report').page(1)
    
    if (!items.length) return
    console.log('FShrt :: clicks - calculating...')

    const click = items.reduce((acc, item) => {
      if (!acc[item.urlId]) acc[item.urlId] = 0
      acc[item.urlId]++
      return acc
    }, {})

    for (const [urlId, clicks] of Object.entries(click)) {
      try {
        const url = await db.resource('urls').get(urlId)
        await db.resource('urls').update(urlId, { 
          clicks: (url.clicks || 0) + clicks
        })
      } catch (error) {
        console.error('FShrt :: clicks - error:', error)
      }
    }

    await db.resource('clicks-report').deleteMany(items.map(item => item.id))
  });

  // calculate views
  cron.schedule(FS_CRON_VIEWS_COUNTER, async () => {
    const items = await db.resource('views-report').page(1)
    
    if (!items.length) return
    console.log('FShrt :: views - calculating...')

    const click = items.reduce((acc, item) => {
      if (!acc[item.urlId]) acc[item.urlId] = 0
      acc[item.urlId]++
      return acc
    }, {})

    for (const [urlId, views] of Object.entries(click)) {
      try {
        const url = await db.resource('urls').get(urlId)
        await db.resource('urls').update(urlId, { 
          views: (url.views || 0) + views
        })
      } catch (error) {
        console.error('FShrt :: views - error:', error)
      }
    }

    await db.resource('views-report').deleteMany(items.map(item => item.id))
  });
}
