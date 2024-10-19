import createError from 'http-errors'

export function authMiddleware(App) {
  const {
    FS_AUTH_USERNAME = 'fshortner',
    FS_AUTH_PASSWORD = 'secret',
  } = App.env

  return async function (req, res, next) {
    const authHeader = req.headers['authorization']
    if (!authHeader) return next(createError(401, 'No authorization header'))

    const token = authHeader.split(' ')[1]
    if (!token) return next(createError(401, 'Missing token'))

    const [username, password] = Buffer.from(token, 'base64').toString().split(':')
    if (username !== FS_AUTH_USERNAME || password !== FS_AUTH_PASSWORD) return next(createError(401, 'Invalid credentials'))
    
    req.user = {
      username,
      password,
    }

    next()
  }
}
