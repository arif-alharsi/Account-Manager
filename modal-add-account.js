const {ipcRenderer} = require('electron')
const {dialog} = require('electron').remote
const path = require('path')
const db = require(path.join(__dirname,'/config/database/dbconfig'))

submitAccount = () => {
    let accountName = $('#account-name').val()
    let accountUrl = $('#account-url').val()
    if(accountName === "") {
        dialog.showMessageBox({
            title: 'Alert',
            message: 'account name is required'
        })
    } else {
        let check_name = `select count(*) as count from account where account_name = '${accountName}'`
        db.query(check_name, (err, result) => {
            if(err) throw err
            let rowNumber = result[0].count
            if(rowNumber < 1) {
                let query = `insert into account(account_name, account_url) values('${accountName}','${accountUrl}')`
                db.query(query, (err, results) => {
                    if(err) throw err
                    ipcRenderer.send('submit:account', accountName)
                })
            } else {
                dialog.showMessageBoxSync({
                    title: 'Alert',
                    message: 'The account name has already been existed, please use another',
                    type: 'info'
                })
            }
        })

    }
}
closeModal = () => {
    ipcRenderer.send('close:modal-add-account')
}
$('body').keydown(function(e) {
    if(e.keyCode == 13) {
        submitAccount()
    }
})