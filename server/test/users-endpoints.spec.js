const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')
const bcrypt = require('bcryptjs')

describe.only('Users Endpoints', function () {
  let db

  const { testUsers } = helpers.makeThingsFixtures()

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => helpers.cleanTables(db))

  afterEach('cleanup', () => helpers.cleanTables(db))

  describe(`POST /api/users`, () => {
    context(`User Validation`, () => {
      beforeEach('insert users', () =>
        helpers.seedUsers(
          db,
          testUsers,
        )
      )

      const requiredFields = ['user_name', 'password', 'full_name']

      requiredFields.forEach(field => {
        const registerAttemptBody = {
          user_name: 'test user_name',
          password: 'test password',
          full_name: 'test full_name',
          nickname: 'test nickname',
        }

        it(`responds with 400 required error when '${field}' is missing`, () => {
          delete registerAttemptBody[field]

          return supertest(app)
            .post('/api/users')
            .send(registerAttemptBody)
            .expect(400, {
              error: `Missing '${field}' in request body`,
            })
        })

        it('responds 400 password must be longer than 8 characters', () => {
          const userShortPassword = {
            user_name: 'test user_name',
            password: '1234567',
            full_name: 'test full_name'
          }
          return supertest(app)
            .post('/api/users')
            .send(userShortPassword)
            .expect(400, { error: 'Password be longer than 8 characters' })
        })

        it('responds 400 password must be 72 characters or less', () => {
          const longPassword = {
            user_name: 'test User_name',
            password: '*'.repeat(73),
            full_name: 'test test'
          }
          return supertest(app)
            .post('/api/users')
            .send(longPassword)
            .expect(400, { error: 'Password be 72 characters or less' })
        })

        it('responds 400 when password starts with space', () => {
          // Password must not start or end with space
          const test = {
            user_name: 'test User_name',
            password: ' adfsa5f6423',
            full_name: 'test test'
          }
          return supertest(app)
            .post('/api/users')
            .send(test)
            .expect(400, {error: 'Password must not start or end with space'})
        })

        it('responds 400 when password does not contain char, num, lower, or upper case', () => {
          // Password must not start or end with space
          const test = {
            user_name: 'test User_name',
            password: 'aaaaaaaaaaaaaa',
            full_name: 'test test'
          }
          return supertest(app)
            .post('/api/users')
            .send(test)
            .expect(400, {error: 'Password must contain 1 upper case, lower case, number and special character'})
        })

        const testUser = testUsers[0];

        it('responds 400 when duplicate usernames', () => {
          
          const test = {
            user_name: testUser.user_name,
            password: '12asbD!!!dfsfsdsf',
            full_name: 'test test'
          }
          return supertest(app)
            .post('/api/users')
            .send(test)
            .expect(400)
        })

        context(`Happy path`, () => {
          it('responds 201, serialize user, storing bcrypted password', () => {
            const newUser = {
              id: 105,
              user_name: 'test user_name',
              password: '11AAaa!!',
              full_name: 'test full_name',
            }
            return supertest(app)
              .post('/api/users')
              .send(newUser)
              .expect(201)
              .expect(res => {
                expect(res.body).to.have.property('id')
                expect(res.body.user_name).to.eql(newUser.user_name)
                expect(res.body.full_name).to.eql(newUser.full_name)
                expect(res.body.nickname).to.eql('')
                expect(res.body).to.not.have.property('password')
                expect(res.headers.location).to.eql(`/api/users/${res.body.id}`)
               })
               .expect(res => {
                 db
                  .from('thingful_users')
                  .select('*')
                  .where({ id: req.body.id})
                  .first()
                  .then(row =>{
                    expect(row.user_name).to.eql(newUser.user_name)
                    expect(row.full_name).to.eql(newUser.full_name)

                  })
                  return bcrypt.compare(newUser.password, row.password)
                    .then(compareMatch =>{
                      expect(compareMatch).to.be.true
                    }) 
               })
              
          })
        })

      })
    })
  })
})