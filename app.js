const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const {open} = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'userData.db')

app.use(express.json())
let db = null
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http:/localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.mesage}`)
    process.exit(1)
  }
}
initializeDBAndServer()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const userQuery = `SELECT * FROM user WHERE username='${username}'`
  const userExist = await db.get(userQuery)
  const hashedPassword = await bcrypt.hash(password, 10)
  if (userExist === undefined) {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const createUserQuery = `INSERT INTO user(username,name,password,gender,location) VALUES ("${username}","${name}","${hashedPassword}","${gender}","${location}");`
      await db.run(createUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const userQuery = `SELECT * FROM user WHERE username='${username}';`
  const userExist = await db.get(userQuery)
  if (userExist === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const passwordMatched = await bcrypt.compare(password, userExist.password)
    if (passwordMatched === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const userQuery = `SELECT * FROM user WHERE username='${username}';`
  const userExist = await db.get(userQuery)
  const ispasswordMatched = await bcrypt.compare(
    oldPassword,
    userExist.password,
  )
  if (userExist != undefined) {
    if (ispasswordMatched === true) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const newhashedPassword = await bcrypt.hash(newPassword, 10)
        const updatePassword = `UPDATE user SET password="${newhashedPassword}" WHERE username='${username}';`
        await db.run(updatePassword)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  } else {
    response.status(400)
    response.send('Invalid user')
  }
})
module.exports = app
