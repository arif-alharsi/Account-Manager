const {ipcRenderer} = require('electron')
const {dialog} = require('electron').remote
const path = require('path')
const md5 = require('md5')
const db = require(path.join(__dirname,'/config/database/dbconfig'))
let username
let id
ipcRenderer.send('req:user', 'change password')
ipcRenderer.on('send:user', (e, userName, meId) => {
    username = userName
    id = meId
})
submitPswdChange = () => {
    let newName = $('#new-name').val()
    let oldPassword = $('#old-password').val()
    let newPassword = $('#new-password').val()
    if(oldPassword === "") {
        dialog.showMessageBoxSync({
            title: 'Alert',
            message: 'Old password is required'
        })
    } else {
        let query = `select count(*) as count from me where my_name = '${username}' and password = '${md5(oldPassword)}'`
        db.query(query, (err, result) => {
            if(err) throw err
            let count = result[0].count
            if(count < 1){
                dialog.showErrorBox('Incorrect password', 'Old password is incorrect')
            } else {
                if(newName != ""){
                    if(newName === username){
                        if(newPassword != ""){
                            let query = `update me set password = '${md5(newPassword)}' where id = ${id}`
                            db.query(query, err => {
                                if(err) throw err
                                dialog.showMessageBoxSync({
                                    type: 'info',
                                    title: 'Alert',
                                    message: 'Password updated'
                                })
                                ipcRenderer.send('close:modal-change-password', username)
                            })
                        } else {
                            dialog.showMessageBoxSync({
                                    type: 'info',
                                    title: 'Alert',
                                    message: 'No changes made'
                                })
                            ipcRenderer.send('close:modal-change-password', username)
                        }
                    } else {
                        let query = `select count(*) as count from me where my_name = '${newName}'`
                        db.query(query, (err, result) => {
                            if(err) throw err
                            let count = result[0].count
                            if(count < 1) {
                                if(newPassword != ""){
                                    let query = `update me set my_name = '${newName}', password = '${md5(newPassword)}' where id = ${id}`
                                    db.query(query, err => {
                                        if(err) throw err
                                        dialog.showMessageBoxSync({
                                            type: 'info',
                                            title: 'Alert',
                                            message: 'Username and password updated'
                                        })
                                        ipcRenderer.send('close:modal-change-password', newName)
                                    })
                                } else {
                                    dialog.showMessageBoxSync({
                                        type: 'info',
                                        title: 'Alert',
                                        message: 'Username changed'
                                    })
                                    ipcRenderer.send('close:modal-change-password', newName)
                                }
                            }
                        })
                    }
                } else {
                    if(newPassword != ""){
                        let query = `update me set password = '${md5(newPassword)}' where id = ${id}`
                        db.query(query, err => {
                            if(err) throw err
                            dialog.showMessageBoxSync({
                                type: 'info',
                                title: 'Alert',
                                message: 'Password updated'
                            })
                            ipcRenderer.send('close:modal-change-password', username)
                        })
                    } else {
                        dialog.showMessageBoxSync({
                                type: 'info',
                                title: 'Alert',
                                message: 'No changes made'
                            })
                        ipcRenderer.send('close:modal-change-password', username)
                    }
                }
            }
        })
    } 
}

$('.input-change').keydown(function(e) {
    if(e.keyCode == 13){
        submitPswdChange()
    }
})