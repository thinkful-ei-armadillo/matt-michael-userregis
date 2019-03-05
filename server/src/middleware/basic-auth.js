'use strict';

function requireAuth(req, res, next) {
  const authToken = req.get('Authorization') || '';
  let bearerToken;
  if (!authToken.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  } else {
    bearerToken = authToken.slice(7, authToken.length);
  }
  const [tokenUserName, tokenPassword] = Buffer.from(bearerToken, 'base64')
    .toString()
    .split(':');

  if (!tokenUserName || !tokenPassword) {
    return res.status(401).json({ error: 'Unauthorized Request' });
  }

  req.app.get('db')('thingful_users')
    .where({user_name: tokenUserName})
    .first()
    .then(user => {
      if(!user || user.password !== tokenPassword){
        return res.status(401).json({error: 'Unathorized request'});
      }
      req.user=user;
      next();
    })
    .catch(next);

}

module.exports = {
  requireAuth
};
