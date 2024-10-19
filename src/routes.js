import path from 'path'
import QRCode from 'qrcode'
import Express from 'express'
import { nanoid } from 'nanoid'
import createError from 'http-errors'
import { body, validationResult } from 'express-validator'

import { authMiddleware } from './middlewares/auth.js';
import { getOS, getBrowser } from './utils/user-agent.js'
import { sessionIdMiddleware } from './middlewares/session-id.js'

function createErrorWithDetails(status, message, details = {}) {
  const error = createError(status, message);
  error.details = details
  return error;
}

function getIPv4(ip) {
  if (ip.includes('::ffff:')) {
    return ip.split('::ffff:')[1];
  }
  return ip;
}

export function addRoutes(App) {
  const {
    db,
    events,
    server,
  } = App.resources

  const {
    FS_DOMAIN,
    FS_ID_SIZE = 16,
    FS_AUTH_ENABLED = 'false',
    FS_REDIRECT_TIMEOUT = '0.6', // needs to be in seconds
    FS_REDIRECT_TEMPLATE = 'corporate',
  } = App.env

  let middlewares = []
  if ([true, 'true'].includes(FS_AUTH_ENABLED)) middlewares.push(authMiddleware(App))

  // url: create
  server.post('/v1/urls', [
    body('link').isURL(),
    body('webhook').optional(),
    body('getFingerprints').isBoolean().default(true).optional(),
    body('openGraph.title').isString().optional(),
    body('openGraph.description').isString().optional(),
    body('openGraph.image').isURL().optional(),
  ], ...middlewares, async (req, res, next) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return next(createErrorWithDetails(400, 'invalid request data from request', validationErrors.array()));
    }

    const data = {
      ...req.body,
      ip: getIPv4(req.ip),
    }

    const {
      isValid,
      errors: resourceValidationErrors,
    } = await db.resource('urls').validate(data)

    if (!isValid) {
      return next(createErrorWithDetails(400, 'invalid request data from validator', resourceValidationErrors));
    }

    data.id = nanoid(parseInt(FS_ID_SIZE, 10))

    let shareableLink = new URL([
      req.protocol,
      '://',
      FS_DOMAIN ?? req.get('host'),
      req.originalUrl
    ].join(''))

    shareableLink.pathname = `/${data.id}`
    data.shareableLink = shareableLink.toString()

    try {
      const url = await db.resource('urls').insert(data)
      events.emit('url:created', url)
      delete url.ip
      return res.json(url);
    } catch (error) {
      return next(createErrorWithDetails(500, 'could not create url', error));
    }
  })

  // url: show
  server.get('/v1/urls/:id', ...middlewares, async (req, res, next) => {
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

  // url : show (qrcode)
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
  server.get('/:id', sessionIdMiddleware(App), async (req, res, next) => {
    let url

    try {
      url = await db.resource('urls').get(req.params.id)
    } catch (error) {
      return next(createErrorWithDetails(404, 'url not found', error));
    }

    const click = {
      url,
      ip: getIPv4(req.ip),
      urlId: url.id,
      sessionId: req.session.id,
    }

    for (const [key, value] of Object.entries(req.query)) {
      if (key.startsWith('utm_')) {
        if (!click.utm) click.utm = {}
        click.utm[key.replace('utm_', '')] = value;
      }
    }

    events.emit('url:redirected', { url, click })

    if (!url.getFingerprints) return res.redirect(url.link, 302);

    const options = {
      link: url.link,
      timeout: parseFloat(FS_REDIRECT_TIMEOUT),
      openGraph: url.openGraph,
    }

    return res.render(FS_REDIRECT_TEMPLATE, options, (error, html) => {
      if (error) {
        App.log.error('error rendering template', error)
        return next(createErrorWithDetails(500, 'error rendering template', error));
      }

      return res.send(html)
    })
  })

  // enrich
  server.post('/v1/live', sessionIdMiddleware(App), async (req, res, next) => {
    const { fingerprint, view } = req.body
    fingerprint.lastIp = getIPv4(req.ip)
    fingerprint.system = getOS(fingerprint.userAgent)
    fingerprint.browser = getBrowser(fingerprint.userAgent)
    fingerprint.lastSessionId = req.cookies.sessionId

    try {
      const { id, ...rest } = fingerprint
      const exists = await db.resource('fingerprints').exists(id)

      if (exists) {
        await db.resource('fingerprints').update(id, rest)
        events.emit('fingerprint:updated', fingerprint)
      } else {
        await db.resource('fingerprints').insert(fingerprint)
        events.emit('fingerprint:created', fingerprint)
      }
    } catch (error) {
      return next(createErrorWithDetails(500, 'fingerprint not saved', error));
    }

    let url
    try {
      url = await db.resource('urls').get(view.urlId)
    } catch (error) {
      return next(createErrorWithDetails(404, 'could not find url', error));
    }

    view.ip = getIPv4(req.ip)
    view.url = url
    view.fingerprint = fingerprint
    view.fingerprintId = fingerprint.id
    view.sessionId = req.cookies.sessionId

    if (view.utm && Object.keys(view.utm).length === 0) delete view.utm

    try {
      await Promise.all([
        db.resource('views').insert(view),
        db.resource('views-report').insert(view),
      ])
      events.emit('view:created', view)
    } catch (error) {
      return next(createErrorWithDetails(500, 'view was not saved', error));
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

    App.log.error(err.status, err)
    res.json(errorResponse);
  })
}
