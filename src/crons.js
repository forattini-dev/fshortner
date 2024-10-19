import cron from 'node-cron'
import { PromisePool } from '@supercharge/promise-pool'

export function startCrons(App) {
  const { db } = App.resources

  const {
    FS_COSTS_ENABLED = 'true',
    FS_CRON_REPORT = '*/30 * * * * *',
    FS_CRON_VIEWS_COUNTER = '*/30 * * * * *',
    FS_CRON_CLICKS_COUNTER = '0 */10 * * * *',
  } = App.env
  
  // costs
  if ([true, 'true'].includes(FS_COSTS_ENABLED)) {
    cron.schedule(FS_CRON_REPORT, async () => {
      const { total, requests } = App.resources.db.client.costs
      App.log.info(`Requests: ${String(requests.total).padStart(5)} | Costs: ${total.toFixed(4)} USD`)
    });
  }

  // calculate clicks
  cron.schedule(FS_CRON_CLICKS_COUNTER, async () => {
    const items = await db.resource('clicks-report').page({ size: 1000 })
    
    if (!items.length) return
    App.log.info('crons :: calculating clicks...')

    const clicksMap = items.reduce((acc, item) => {
      if (!acc.urls[item.urlId]) acc.urls[item.urlId] = 0
      if (!acc.sessions[item.sessionId]) acc.sessions[item.sessionId] = 0
      
      acc.urls[item.urlId]++
      acc.sessions[item.sessionId]++
      return acc
    }, { urls: {}, sessions: {}})

    const requests = []
      .concat(Object.entries(clicksMap.urls).map(([urlId, clicks]) => ({ resource: 'urls', id: urlId, clicks })))
      .concat(Object.entries(clicksMap.sessions).map(([sessionId, clicks]) => ({ resource: 'sessions', id: sessionId, clicks })))

    const { results, errors } = await PromisePool
      .withConcurrency(25)
      .for(requests)
      .process(async ({ resource, id, clicks }, index, pool) => {
        const live = await db.resource(resource).get(id)
        await db.resource(resource).update(id, { clicks: (live.clicks || 0) + clicks })
        return live
      })

    App.log.warn('crons :: clicks updates:', results.length, '(errors:', (errors.length/results.length).toFixed(2) * 100 + '%)')
    await db.resource('clicks-report').deleteMany(items.map(item => item.id))
    App.log.info('crons :: clicks-report data removed.')
  });

  // calculate views
  cron.schedule(FS_CRON_VIEWS_COUNTER, async () => {
    const items = await db.resource('views-report').page({ size: 1000 })
    
    if (!items.length) return
    App.log.info('crons :: calculating views...')

    const viewsMap = items.reduce((acc, item) => {
      if (!acc.urls[item.urlId]) acc.urls[item.urlId] = 0
      if (!acc.sessions[item.sessionId]) acc.sessions[item.sessionId] = 0
      
      acc.urls[item.urlId]++
      acc.sessions[item.sessionId]++
      return acc
    }, { urls: {}, sessions: {}})

    const requests = []
      .concat(Object.entries(viewsMap.urls).map(([urlId, views]) => ({ resource: 'urls', id: urlId, views })))
      .concat(Object.entries(viewsMap.sessions).map(([sessionId, views]) => ({ resource: 'sessions', id: sessionId, views })))

    const { results, errors } = await PromisePool
      .withConcurrency(25)
      .for(requests)
      .process(async ({ resource, id, views }, index, pool) => {
        const live = await db.resource(resource).get(id)
        await db.resource(resource).update(id, { views: (live.views || 0) + views })
        return live
      })

    App.log.warn('crons :: views updates:', results.length, '(errors:', (errors.length/results.length).toFixed(2) * 100 + '%)')
    await db.resource('views-report').deleteMany(items.map(item => item.id))
    App.log.info('crons :: views-report data removed.')
  });
}
