import path from 'path'
import Express from 'express';
import { nanoid } from 'nanoid';
import createError from 'http-errors';
import { body, validationResult } from 'express-validator'

export function addRoutes(App) {
  const { server, db } = App.resources

  const {
    FS_ID_SIZE = '16',
    FS_REDIRECT_TIMEOUT = '1',
    FS_REDIRECT_TEMPLATE = 'corporate',
  } = App.env

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

    const id = nanoid(parseInt(App.env.FS_ID_SIZE))

    let shareable = new URL([
      req.protocol,
      '://',
      App.env.FS_DOMAIN ?? req.get('host'),
      req.originalUrl
    ].join(''))

    shareable.pathname = `/${id}`
    shareable = shareable.toString()

    const url = await db.resource('urls').insert({
      ...req.body,
      id,
      shareable,
      ip: req.ip,
    })

    delete url.ip
    return res.json(url);
  })

  // show
  server.get('/v1/urls/:id', async (req, res, next) => {
    try {
      const url = await db.resource('urls').get(req.params.id)
      url.createdAt = url._createdAt
      delete url.ip
      delete url._length
      delete url._createdAt
      return res.json(url)
    } catch (error) {
      const err = createError(404, 'url not found')
      err.details = error
      return next(err);
    }
  })

  server.get('/:id', async (req, res, next) => {
    let url

    try {
      url = await db.resource('urls').get(req.params.id)
    } catch (error) {
      const err = createError(404, 'url not found')
      err.details = error
      return next(err);
    }

    const click = {
      ip: req.ip,
      urlId: req.params.id,
    }

    for (const [key, value] of Object.entries(req.query)) {
      if (key.startsWith('utm_')) {
        if (!click.utm) click.utm = {}
        click.utm[key.replace('utm_', '')] = value;
      }
    }

    try {
      await Promise.all([
        db.resource('clicks').insert(click),
        db.resource('clicks-report').insert(click),
      ])
    } catch (error) {
      const err = createError(500, 'could not save click')
      err.details = error
      console.log(err)
    }

    const options = {
      link: url.link,
      timeout: parseFloat(FS_REDIRECT_TIMEOUT), // needs to be in seconds
    }

    return res.render(FS_REDIRECT_TEMPLATE, options, (err, html) => {
      if (err) {
        const error = createError(500, 'error rendering template')
        error.details = err
        return next(error);
      }

      return res.send(html)
    })
  })

  server.post('/v1/live', async (req, res, next) => {
    const { user, view } = req.body

    try {
      const { id, ...rest } = user
      const exists = await db.resource('users').exists(id)

      if (exists) {
        await db.resource('users').update(id, rest)
      } else {
        await db.resource('users').insert(user)
      }
    } catch (error) {
      const err = createError(500, 'user not saved')
      err.details = error
      return next(err);
    }

    view.ip = req.ip
    if (view.utm && Object.keys(view.utm).length === 0) delete view.utm

    try {
      await Promise.all([
        db.resource('views').insert(view),
        db.resource('views-report').insert(view),
      ])
    } catch (error) {
      const err = createError(500, 'live data not saved')
      err.details = error
      console.log(error)
      return next(err);
    }

    return res.sendStatus(204)
  })

  server.use(Express.static(path.join(App.root, '..', 'public'), {
    etag: false,
    maxAge: 0,
    cacheControl: false,

    setHeaders: (res, path) => {
      res.setHeader('Expires', '0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Surrogate-Control', 'no-store');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
  }));

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
  })
}

