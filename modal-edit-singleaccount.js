const {ipcRenderer} = require('electron')
const {dialog} = require('electron').remote
const path = require('path')
const md5 = require('md5')
const db = require(path.join(__dirname,'/config/database/dbconfig'))

let accountId
let accountName
ipcRenderer.send('req:account-id')
ipcRenderer.on('res:account-id', (e, id, name) => {
    accountId = id
    accountName = name
})

$('input').keydown(function(e) {
    if(e.keyCode == 13){
        submitEditAccount()
    }
})

submitEditAccount = () => {
    let newAccountName = $('#new-account-name').val()
    if(newAccountName != "") {
        if(newAccountName === accountName) {
            ipcRenderer.send('close:modal-edit-singleaccount', accountName, 'no-changes-made')
        } else {
            let query = `select count (*) as count from account where account_name = '${newAccountName}'`
            db.query(query, (err, result) => {
                if(err) throw err
                let count = result[0].count
                if(count < 1) {
                    let query = `update account set account_name = '${newAccountName}' where account_id = ${accountId}`
                    db.query(query, err => {
                        if(err) throw err
                        ipcRenderer.send('close:modal-edit-singleaccount', newAccountName, 'changes-made')
                    })
                } else {
                    dialog.showMessageBoxSync({
                        title: 'Alert',
                        type: 'info',
                        message: 'Account name has already existed in the table, you should use another name'
                    })
                }
            })
        }
    } else {
        dialog.showMessageBoxSync({
            title: 'Alert',
            type: 'info',
            message: 'New account name field is required'
        })
    }
}