import createError from 'http-errors';
import { body, validationResult } from 'express-validator'

export function addRoutes(App) {
  const { server, db } = App.resources

  // create
  server.post('/v1/urls', [
    body('link').isURL(),
  ], async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const err = createError(400, 'invalid data')
      err.details = errors.array()
      return next(err);
    }

    const url = await db.resource('urls').insert({ 
      ...req.body,
      ip: req.ip,
      createdAt: Date.now(),
    })

    delete url.ip

    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    url.shareble = new URL(fullUrl)
    url.shareble.pathname = `/${url.id}`
    url.shareble = url.shareble.toString()

    return res.json(url);
  })

  // show
  server.get('/v1/urls/:id', async (req, res, next) => {
    try {
      const url = await db.resource('urls').get(req.params.id)
      delete url.ip

      return res.json(url)
    } catch (error) {
      const err = createError(404, 'url not found')
      err.details = error
      return next(err);
    }
  })

  // redirect
  server.get('/:id', async (req, res, next) => {
    try {
      const url = await db.resource('urls').get(req.params.id)
      
      const click = {
        urlId: url.id,
        ip: req.ip,
        utm: {
          source: req.query.utm_source,
          medium: req.query.utm_medium,
          campaign: req.query.utm_campaign,
          content: req.query.utm_content,
          term: req.query.utm_term,
        },
      }

      await Promise.all([
        db.resource('clicks').insert(click),
        db.resource('report-items').insert(click),
      ])

      return res.redirect(302, url.link)
    } catch (error) {
      const err = createError(404, 'url not found')
      err.details = error
      return next(err);
    }
  })

  server.use((req, res, next) => {
    next(createError(404, 'route not found'));
  });

  server.use((err, req, res, next) => {
    res.status(err.status || 500);

    const errorResponse = {
      status: err.status || 500,
      message: err.message,
    };

    if (err.details) {
      errorResponse.details = err.details;
    }

    res.json(errorResponse);
  });
}

