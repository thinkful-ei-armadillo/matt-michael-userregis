const xss = require('xss')
const bcrypt = require('bcryptjs')


const UserService = {
  hasUserWithUserName(db, user_name){
    return db('thingful_users')
      .where({user_name})
      .first()
      .then(user => !!user)
  }, 
  insertUser(db, newUser){
    return db
     .insert(newUser)
     .into('thingful_users')
     .returning('*')
     .then(([user]) => user)
  }, 
  serializeUser(user){
    return {
      id: user.id,
      full_name: xss(user.full_name),
      user_name: xss(user.user_name),
      
    }
  },
  hashPassword(password){
    return bcrypt.hash(password, 12);
  }
  
}

module.exports = UserService;