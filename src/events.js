export function addEventsHandlers(App) {
  const { events, httpClient } = App.resources

  events.on('url:created', async (url) => {
    if (!url.webhook) return

    try {
      await httpClient.post(url.webhook, { 
        json: {
          event: 'url:created',
          data: url,
        }
      })
    } catch (error) {
      console.error('FShrt :: webhook - error:', error)
    }
  })

  events.on('click:created', async (click) => {
    if (!click.url.webhook) return
    
    try {
      await httpClient.post(click.url.webhook, { 
        json: {
          event: 'click:created',
          data: click,
        }
      })
    } catch (error) {
      console.error('FShrt :: webhook - error:', error)
    }
  })

  events.on('view:created', async (view) => {
    if (!view.url.webhook) return
    
    try {
      await httpClient.post(view.url.webhook, { 
        json: {
          event: 'view:created',
          data: view,
        }
      })
    } catch (error) {
      console.error('FShrt :: webhook - error:', error)
    }
  })
}

export default addEventsHandlers