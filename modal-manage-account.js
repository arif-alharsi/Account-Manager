const {ipcRenderer} = require('electron')
const {remote} = require('electron')
const path = require('path')
const {dialog, Menu, MenuItem, nativeImage} = remote
const RightMenu = require('./rightMenu')
const db = require(path.join(__dirname,'/config/database/dbconfig'))
let accountId
let accountName
let rowId
const tableMenu = new RightMenu({
    title: 'table'
})

$('#tbody-account').on('contextmenu','input[type="text"]', function() {
    let id = $(this).attr('data-id')
    let name = $(this).attr('data-name')
    accountId = id
    accountName = name
    rowId = id
    tableMenu.popupTableMenu()
})

loadTbodyAccount = (search = false) => {
    let query
    iterateRes = (res) => {
        let tr = ''
        let ind = 0
        res.forEach( (item) => {
            tr += `<tr>
                    <td><input type="checkbox" class="checkbox" data-id="${item.account_id}"></td>
                    <td>
                        <input type="text" data-id="${item.account_id}" data-name="${item.account_name}" value="${item.account_name}" class="account-name" style="border:none;width:100%" data-ind=${ind}>
                        <input type="hidden" class="account-id" data-id="${item.account_id}" data-name="${item.account_name}" data-ind="${ind}" value="${item.account_id}">
                    </td>
                    <td>
                        <input type="text" data-id="${item.account_id}" data-name="${item.account_name}" value="${item.account_url}" placeholder="account url" style="border:none;width:100%" data-ind="${ind}" class="account-url">    
                    </td>
                    <td><a href="#" class="float-right btn-delete-account" data-id="${item.account_id}" data-name="${item.account_name}"><i class="fa fa-times"></i> delete</a></td>
                </tr>`
            ind++
        })
        $('#tbody-account').html(tr)
        $('#res-length').val(res.length)
    }
    if(search){
        let val = $('#input-search').val()
        query = `select * from account where account_name like '%${val}%' or account_url like '%${val}%'`
        db.query(query, (err, results) => {
            if(err) throw err
            if(results.length < 1){
                $('#alert').html('<div class="alert alert-danger">No data found</div>')
                $('#tbody-account').html("")
            } else {
                iterateRes(results)
            }
        })
    } else {
        query = `select * from account`
        db.query(query, (err, results) => {
            if(err) throw err
            iterateRes(results)
        })
    }
}

loadTbodyAccount()
deleteSingleRow = (id) => {
    let msg = dialog.showMessageBoxSync({
        title: 'Alert',
        buttons: ['No', 'Yes'],
        defaultId: [0,1],
        message: 'Are you sure to delete the this account?'
    })
    if(msg === 0){
        return false
    } else {
        let query = `delete from account where account_id = ${id}`
        db.query(query, (err) => {
            if(err) throw err
            loadTbodyAccount()
            $('#alert').html('<div class="alert alert-success">Succesfully delete an account</div>')
            alertFadeOut()

        })
    }
}
$('#tbody-account').on('click','.btn-delete-account', function() {
    let id = $(this).attr('data-id')
    let name = $(this).attr('data-name')
    deleteSingleRow(id, name)
})

alertFadeOut = () => {
    let blankAlert = () => {
        $('#alert').html("")
    }
    setTimeout(blankAlert, 3000)
}

let checkAll = () => {
    $('.checkbox').prop('checked', true)
}

let uncheckAll = () => {
    $('.checkbox').prop('checked', false)
}

let deleteSelectedRow = () => {
    let checkedAccount = []
    $('.checkbox:checked').each(function() {
        checkedAccount.push($(this).attr('data-id'))
    })
    if(checkedAccount.length < 1){
        let msg = dialog.showMessageBoxSync({
            title: 'Alert',
            message: 'You did not select any of data so this action will delete all records/rows in the account table. Are your sure to continue?',
            buttons: ['No','Yes'],
            defaultId: [0,1]
        })
        if(msg === 1) {
            let query = `delete from account`
            db.query(query, (err) => {
                if(err) throw err
                $('#tbody-account').html("")
                $('#alert').html('<div class="alert alert-success">Succesfully delete all account</div>')
                alertFadeOut()
            })
        }
    } else {
        let alert = dialog.showMessageBoxSync({
        title: 'Alert',
        message: 'Are you sure to delete the selected accounts?',
        buttons: ['No','Yes'],
        defaultId: [0,1]
        })
        if(alert === 1){
            joinCheckedAccount = checkedAccount.join(",")
            let query = `delete from account where account_id IN(${joinCheckedAccount})`
            db.query(query, (err) => {
                if(err) throw err
                loadTbodyAccount()
                $('#alert').html('<div class="alert alert-success">Succesfully delete accounts</div>')
                alertFadeOut()
            })
        }
    }
}
let saveChanges = () => {
    let accountURL = [] 
    let accountName = []
    let accountId = []
    let input = []
    let resLength = $('#res-length').val()
    let ind
    for(ind=0;ind<resLength;ind++){
        accountURL.push($(`.account-url[data-ind="${ind}"]`).val())
        accountName.push($(`.account-name[data-ind="${ind}"]`).val())
        accountId.push($(`.account-id[data-ind="${ind}"]`).val())
    }
    let i
    for(i=0;i<resLength;i++){
        input.push(`(${accountId[i]},'${accountName[i]}','${accountURL[i]}')`)
    }
    inputJoin = input.join(",")
    let query = `insert into account(account_id, account_name, account_url) values${inputJoin}
                on duplicate key update account_name=values(account_name), account_url=values(account_url)`
    db.query(query, (err) => {
        if(err) throw err
        loadTbodyAccount()
        $('#alert').html('<div class="alert alert-success">Succesfully save changes</div>')
        alertFadeOut()
    })
}



$('#input-search').keydown( (e) => {
    let search = true
    if(e.keyCode == 13) {
        loadTbodyAccount(search)
    }
})

$('#input-search').keyup(function() {
    let val = $(this).val()
    if(val === ""){
        loadTbodyAccount()
        $('#alert').html("")
    }
})
ipcRenderer.on('modal-manage-account:save-changes', () => {
    saveChanges()
})
ipcRenderer.on('modal-manage-account:delete-data', () => {
    deleteSelectedRow()
})