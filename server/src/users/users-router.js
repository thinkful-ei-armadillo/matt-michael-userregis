const express = require('express')
const UserService = require('./users-service')
const usersRouter = express.Router()
const jsonBodyParser = express.json()

usersRouter
  .post('/', jsonBodyParser, (req, res, next) => {
    const { user_name,password } = req.body
    const REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/

    for (const field of ['full_name', 'user_name', 'password'])
      if (!req.body[field])
        return res.status(400).json({ error: `Missing '${field}' in request body` })
    
    if (password.length < 8)
      return res.status(400).json({ error: 'Password be longer than 8 characters' })
    if (password.length > 72)
      return res.status(400).json({ error: 'Password be 72 characters or less' })
    if (password.startsWith(' ') || password.endsWith(' '))
      return res.status(400).json({ error: 'Password must not start or end with space' })
    if (!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(password))
      return res.status(400).json({ error: 'Password must contain 1 upper case, lower case, number and special character' })

    UserService.hasUserWithUserName(req.app.get('db'), user_name)
      .then(username => {
        if(username)
          res.status(400)
        res.send('ok')
      })
      .catch(next)
    
  })

module.exports = usersRouter;