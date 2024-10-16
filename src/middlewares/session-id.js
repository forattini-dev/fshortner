import { encrypt, decrypt } from 's3db.js'

export function sessionIdMiddleware(App) {
  const { db } = App.resources

  const {
    FS_SESSION_SECRET = 'secret'
  } = App.env

  return async function (req, res, next) {
    let session

    if (!req.cookies.session) {
      session = await db.resource('sessions').insert({})
    } else {
      const sessionId = await decrypt(req.cookies.session, FS_SESSION_SECRET)
      const sessionExists = await db.resource('sessions').exists(sessionId)

      if (!sessionExists) {
        session = await db.resource('sessions').insert({})
      } else {
        session = await db.resource('sessions').get(sessionId)
      }
    }

    res.cookie('session',
      await encrypt(session.id, FS_SESSION_SECRET),
      {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        sameSite: 'Strict',
      }
    )

    req.session = session;
    next();
  }
}
