const {ipcRenderer} = require('electron')
const {dialog} = require('electron').remote
const path = require('path')
const md5 = require('md5')
const db = require(path.join(__dirname,'/config/database/dbconfig'))
submitLogin = () => {
    let name = $('#my-name').val()
    let password = md5($('#password').val())
    let sql = `select *, count(*) as count from me where my_name = '${name}' and password = '${password}'`
    db.query(sql, (err, result) => {
        if(err) throw err
        let rowCount = result[0].count
        let meId = result[0].id
        if(rowCount == 0){
            dialog.showErrorBox('Invalid Data', 'Username or password is incorrect')
        } else {
            ipcRenderer.send('login:success', name, meId)
        }
    })
}
closeApp = () => {
    ipcRenderer.send('close:app')
}
$('#my-name').keydown( (e)  => {
    if(e.keyCode == 13){
        submitLogin()
    }
})
$('#password').keydown( (e) => {
    if(e.keyCode == 13) {
        submitLogin()
    }
})