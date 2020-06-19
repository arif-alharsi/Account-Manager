const mysql = require('mysql')
const dbconfig = {
    hostname: '',
    user: '',
    password: '',
    database: ''
}
const db = mysql.createConnection(dbconfig)
module.exports = db