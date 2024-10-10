import path from 'path'
import Express from 'express';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import createError from 'http-errors';
import { body, validationResult } from 'express-validator'

export function createErrorWithDetails (status, message, details = {}) {
  const error = createError(status, message);
  error.details = details ? String(details) : '';
  return error;
}

export function addRoutes(App) {
  const { server, db, events } = App.resources

  const {
    FS_ID_SIZE = '16',
    FS_REDIRECT_TIMEOUT = '0.5',
    FS_REDIRECT_TEMPLATE = 'corporate',
  } = App.env

  // create
  server.post('/v1/urls', [
    body('link').isURL(),
    body('webhook').optional(),
  ], async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return next(createErrorWithDetails(400, 'invalid data', errors.array()));
    }

    const id = nanoid(parseInt(FS_ID_SIZE))

    let shareable = new URL([
      req.protocol,
      '://',
      App.env.FS_DOMAIN ?? req.get('host'),
      req.originalUrl
    ].join(''))

    shareable.pathname = `/${id}`
    shareable = shareable.toString()

    const data = {
      ...req.body,
      id,
      shareable,
      ip: req.ip,
    }
    
    try {
      const url = await db.resource('urls').insert(data)
      delete url.ip
      events.emit('url:created', url)
      return res.json(url);
    } catch (error) {
      return next(createErrorWithDetails(500, 'could not create url', error));
    }
  })

  // show
  server.get('/v1/urls/:id', async (req, res, next) => {
    try {
      const url = await db.resource('urls').get(req.params.id)
      url.createdAt = url._createdAt
      delete url.ip
      delete url._length
      delete url._createdAt
      if (url.webhook) url.webhook = true
      return res.json(url)
    } catch (error) {
      return next(createErrorWithDetails(404, 'url not found', error));
    }
  })

  // show qrcode
  server.get('/v1/urls/:id/qrcode', async (req, res, next) => {
    let url 

    try {
      url = await db.resource('urls').get(req.params.id)
    } catch (error) {
      return next(createErrorWithDetails(404, 'url not found', error));
    }

    try {
      res.setHeader('Content-Type', 'image/png');
      const qrimg = await QRCode.toBuffer(url.link, { type: 'png' });
      res.send(qrimg);
    } catch (error) {
      return next(createErrorWithDetails(500, 'could not create qr code', error));
    }
  })

  // redirect
  server.get('/:id', async (req, res, next) => {
    let url

    try {
      url = await db.resource('urls').get(req.params.id)
    } catch (error) {
      return next(createErrorWithDetails(404, 'url not found', error));
    }

    const click = {
      ip: req.ip,
      urlId: req.params.id,
      url,
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

      events.emit('click:created', click)
    } catch (error) {
      const err = createError(500, 'could not save click')
      err.details = error
      console.log(err)
    }

    const options = {
      link: url.link,
      timeout: parseFloat(FS_REDIRECT_TIMEOUT), // needs to be in seconds
    }

    return res.render(FS_REDIRECT_TEMPLATE, options, (error, html) => {
      if (error) {
        return next(createErrorWithDetails(500, 'error rendering template', error));
      }

      return res.send(html)
    })
  })

  // enrich
  server.post('/v1/live', async (req, res, next) => {
    const { user, view } = req.body

    try {
      const { id, ...rest } = user
      const exists = await db.resource('users').exists(id)

      if (exists) {
        await db.resource('users').update(id, rest)
        events.emit('user:updated', user)
      } else {
        await db.resource('users').insert(user)
        events.emit('user:created', user)
      }

    } catch (error) {
      return next(createErrorWithDetails(500, 'user not saved', error));
    }

    view.ip = req.ip
    if (view.utm && Object.keys(view.utm).length === 0) delete view.utm

    try {
      await Promise.all([
        db.resource('views').insert(view),
        db.resource('views-report').insert(view),
      ])
      
      view.user = user
      view.url = await db.resource('urls').get(view.urlId)

      events.emit('view:created', view)
    } catch (error) {
      return next(createErrorWithDetails(500, 'live data not saved', error));
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

