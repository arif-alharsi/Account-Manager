const {remote} = require('electron')
const path = require('path')
const {dialog, Menu, MenuItem, nativeImage} = remote
const RightMenu = require('./rightMenu')
const {ipcRenderer} = require('electron')
const db = require(path.join(__dirname,'/config/database/dbconfig'))
let accountId
let accountName
let rowId
const tableMenu = new RightMenu({
    title: 'table'
})
$('#account-info').on('contextmenu', '.tr-row', function() {
    let id = $(this).attr('data-id')
    rowId = id
    tableMenu.popupTableMenu()
})
const accountListMenu = new RightMenu({
    title: 'account list'
})
$('#account-list').on('contextmenu','.account-list', function() {
    let id = $(this).attr('data-id')
    let name = $(this).attr('data-name')
    accountName = name
    accountId = id
    accountListMenu.popupAccountListMenu()
})

editSingleAccount = (id, name) => {
    ipcRenderer.send('load:edit-single-account', id, name)
}
deleteSingleAccount = (id) => {
    let msg = dialog.showMessageBoxSync({
        title: 'Alert',
        type: 'info',
        message: 'Are you sure you want to delete this account?',
        buttons: ['No','Yes'],
        defaultId: [0,1]
    })
    if(msg != 0){
        let query = `delete from account where account_id = ${id}`
        db.query(query, err => {
            if(err) throw err
            $('#alert').html('<div class="alert alert-info">Successfully delete an account</div>')
            alertFadeOut()
            loadAccountList()
            $('#account-info').html("")
            $('h6#header button').css('display','none')
            $('#table-head').html("")
        })
    }
} 


let modalAddAccount = () => {
    ipcRenderer.send('open-modal:add-account')
}

let loadAccountList = (joinIds = false) => {
    iterateAccount = (res) => {
        let accountList = ''
        res.forEach( (item) => {
            accountList += `<a href="#" data-name="${item.account_name}" data-url="${item.account_url}" data-id="${item.account_id}" class="list-group-item list-group-item-action account-list">${item.account_name}</a>`
        })
        $('#account-list').html(accountList)
    }
    if(joinIds){
        let query = `select * from account where account_id IN(${joinIds})`
        db.query(query, (err, results) => {
            if(err) throw err
            iterateAccount(results)
        })
    } else {
        let query = `select * from account`
        db.query(query, (err, results) => {
            if(err) throw err
            iterateAccount(results)
        })
    }
}
loadAccountList()

ipcRenderer.on('load:detail-form', (e, accountId, accountName, accountUrl) => {
    $('#account-id').val(accountId)
    $('#account-url').val(accountUrl)
    loadAccountList()
    loadDetailForm()
    $('#item-0').focus()
    $('#table-head').html(accountName)
    //delete all elements in the array_id
    array_id.splice(0,array_id.length)
    //add 0 element to array_id
    array_id.push(0)
})
ipcRenderer.on('submit:account-info', () => {
    submitRecord()    
})

let addRow = () => {
    let account_id = $('#account-id').val()
    let query = `insert into account_info(item, description, account_id) values("","",${account_id})`
    db.query(query, (err) => {
        if(err) throw err
        loadAccountInfo(account_id)
    })
}

let row = 0
let array_id = []
function addRecord() {
    row++
    appendDetailForm(row)
    array_id.push(row)
}
let appendDetailForm = (i) => {
    let form = `<tr class="tr-record" data-id="${i}" id="tr-record-${i}">
                    <td><input type="text" class="form-control form-control-sm record" id="item-${i}" placeholder="example: username, email, password, etc"></td>
                    <td><input type="text" class="form-control form-control-sm record" id="description-${i}"></td>
                    <td><button class="bas-btn-sm float-right btn-delete" data-id="${i}"><i class="fa fa-trash"></i></button></td>
                </tr>
                `
    $('#account-info').append(form)
}
let loadDetailForm = () => {
    $('#btn-add-record, #btn-save').css('display','inline')
    $('#btn-open-web, #btn-add-row').css('display','none')
    let form = `<tr class="tr-record" data-id="0" id="tr-record-0">
                    <td><input type="text" class="form-control form-control-sm record" id="item-0" placeholder="Item (example: username, email etc)" autofocus></td>
                    <td><input type="text" class="form-control form-control-sm record" id="description-0" placeholder="Desc (Example: arif-alharsi, me@gmail.com, etc"></td>
                    <td><button class="bas-btn-sm float-right btn-delete" data-id="0"><i class="fa fa-trash"></i></button></td>
                </tr>
                `
    $('#account-info').html(form)
}
$('#account-info').on('keydown', '.record', function(e) {
    if(e.keyCode == 13){
        addRecord()
    }
})
$('#account-info').on('keydown', '.data', function(e) {
    if(e.keyCode == 13){
        addRow()
    }
})
$('#account-info').on('click','.btn-delete', function() {
    let id = $(this).attr('data-id')
    $(`.tr-record[data-id="${id}"]`).remove()
    let ind = array_id.indexOf(parseInt(id))
    if(ind>-1){
        array_id.splice(ind,1)
        console.log(array_id)
    }
})
$('#account-info').on('click', '#btn-copy-record', function() {
    let id = $(this).attr('data-id')
    let copyText = document.getElementById(`description-${id}`)
    copyText.select()
    document.execCommand('copy')
})
$('#account-info').on('click', '#btn-delete-record', function() {
    let id = $(this).attr('data-id')
    deleteSingleRow(id)
})

deleteSingleRow = (id) => {
    let query = `delete from account_info where id = ${id}`
    db.query(query, (err) => {
        if(err) throw err
        let account_id = $('#account-id').val()
        loadAccountInfo(account_id)
    })
}

let submitRecord = () => {
    let id = []
    let item = []
    let description = []
    let accountId = $('#account-id').val()
    let input = []
    let url = $('#account-url').val()
    let i
    for(i=0;i<array_id.length;i++){
        item.push($(`#item-${array_id[i]}`).val())
        description.push($(`#description-${array_id[i]}`).val())
        id.push($(`#accountinfoId-${array_id[i]}`).val())
    }

    if(item[0] == undefined || description[0] == undefined){
        return false
    } else {
        let ind
        let queryInsert
        if(id[0] == undefined){
            for(ind=0;ind<array_id.length;ind++){
                input.push(`('${item[ind]}', '${description[ind]}',${accountId})`)
            }
            let inputJoin = input.join(",")
            queryInsert = `insert into account_info(item, description, account_id) values${inputJoin}`
        } else {
            for(ind=0;ind<array_id.length;ind++){
                input.push(`(${id[ind]},'${item[ind]}', '${description[ind]}',${accountId})`)
            }
            let inputJoin = input.join(",")
            queryInsert = `insert into account_info(id, item, description, account_id) values${inputJoin} 
                                on duplicate key update item=values(item), description=values(description), account_id=values(account_id)`
        }

        db.query(queryInsert, (err) => {
            if(err) throw err
            $('#alert').html('<div class="alert alert-success">Successfully save data</div>')
            alertFadeOut()
            loadAccountInfo(accountId, url)
        })
    }
}

loadAccountInfo = (id = false, url = false) => {
    $('#btn-open-web, #btn-add-row, #btn-save').css('display','inline')
    $('#btn-add-record').css('display','none')
    array_id.splice(0,array_id.length)
    let select
    if(id) {
        $('#account-id').val(id)
        $('#account-url').val(url)
        select = `select * from account_info where account_id = ${id}`
        db.query(select, (err, results) => {
            if(err) throw err
            let tr = ''
            results.forEach( (item) => {
                tr += `<tr data-id="${item.id}" class="tr-row">
                            <th>
                                <input type="text" id="item-${item.id}" value="${item.item}" style="border:none" class="form-control form-control-sm data">
                                <input type="hidden" id="accountinfoId-${item.id}" value="${item.id}">
                            </th>
                            <td><input type="text" id="description-${item.id}" value="${item.description}" style="border:none" class="form-control form-control-sm data"></td>
                            <td>
                                <button class="bas-btn-sm float-right" id="btn-copy-record" title="Copy description" data-id="${item.id}" data-desc="${item.description}"><i class="fa fa-clone"></i></button>
                                <button class="bas-btn-sm float-right" id="btn-delete-record" title="Delete row" data-id="${item.id}"><i class="fa fa-trash"></i></button>
                            </td>
                        </tr>`
                array_id.push(item.id)
            })
            $('#account-info').html(tr)
            $(`#account-list a.account-list`).removeClass('active')
            $(`#account-list a.account-list[data-id="${id}"]`).addClass('active')
        })
    } else {
        $('#account-info').html("")
    }
}
$('#account-list').on('click', '.account-list', function() {
    let id = $(this).attr('data-id')
    let accountName = $(this).attr('data-name')
    let accountUrl = $(this).attr('data-url')
    loadAccountInfo(id, accountUrl)
    $('#table-head').html(accountName)
    $('#alert').html("")
})

let searchAll = () => {
    let inp = $('#input-search-all').val()
    if(inp === ""){
        return false;
    } else {
        $('h6#header button').css('display','none')
        let query = `select * from account_info where description like '%${inp}%' group by account_id order by id DESC`
        db.query(query, (err, results) => {
            if(err) throw err
            if(results.length < 1){
                $('#alert').html('<div class="alert alert-danger">No data found</div>')
                $('#account-info').html("")
                $('#table-head').html("")
            } else {
                let tr = ''
                $(`#account-list a.account-list`).removeClass('active')
                results.forEach( (item) => {
                    tr += `<tr data-id="${item.id}" class="tr-row">
                            <th><input id="item-${item.id}" value="${item.item}" style="border:none" class="form-control form-control-sm"></th>
                            <td><input id="description-${item.id}" value="${item.description}" style="border:none" class="form-control form-control-sm"></td>
                            <td>
                                <button class="bas-btn-sm float-right" id="btn-copy-record" title="Copy description" data-id="${item.id}" data-desc="${item.description}"><i class="fa fa-clone"></i></button>
                                <button class="bas-btn-sm float-right" id="btn-delete-record" title="Delete row" data-id="${item.id}"><i class="fa fa-trash"></i></button>
                            </td>
                        </tr>`            
                        $(`#account-list a.account-list[data-id="${item.account_id}"]`).addClass('active')
                    array_id.push(item.id)
                })
                $('#table-head').html("")
                $('#account-info').html(tr)
            }
        })
    }
}

$('#input-search-all').keydown( (e) => {
    if(e.keyCode == 13){
        searchAll()
    }
})
$('#input-search-all').keyup( function() {
    let inp = $(this).val()
    if(inp === ""){
        loadAccountList()
        $('#alert').html("")
        $('#account-info').html("")
    }
})
$('#input-search-account').keyup( function() {
    let inp = $(this).val()
    if(inp === ""){
        loadAccountList()
        $('#alert').html("")
    }
})
let alertFadeOut = () => {
    let timeOut = () => {
        $('#alert').html("")
    }
    setTimeout(timeOut, 3000)
}

let searchAccount = () => {
    let inp = $('#input-search-account').val()
    array_id.splice(0,array_id.length)
    if(inp === ""){
        return false
    } else {
        $('#btn-open-web, #btn-add-row, #btn-save').css('display','inline')
        $('#btn-add-record').css('display','none')
        let query = `select * from account where account_name like '%${inp}%'`
        db.query(query, (err, result) => {
            if(err) throw err
            if(result.length == 1){
                $('#account-id').val(result[0].account_id)
                $('#account-url').val(result[0].account_url)
                $(`#account-list a.account-list`).removeClass('active')
                $(`#account-list a.account-list[data-id="${result[0].account_id}"]`).addClass('active')
                select = `select * from account_info where account_id = ${result[0].account_id}`
                db.query(select, (err, results) => {
                    if(err) throw err
                    let tr = ''
                    results.forEach( (item) => {
                        tr += `<tr data-id="${item.id}">
                                    <th>
                                        <input type="text" id="item-${item.id}" value="${item.item}" style="border:none" class="form-control form-control-sm data">
                                        <input type="hidden" id="accountinfoId-${item.id}" value="${item.id}">
                                    </th>
                                    <td><input type="text" id="description-${item.id}" value="${item.description}" style="border:none" class="form-control form-control-sm data"></td>
                                    <td>
                                        <button class="bas-btn-sm float-right" id="btn-copy-record" data-id="${item.id}" data-desc="${item.description}"><i class="fa fa-clone"></i></button>
                                        <button class="bas-btn-sm float-right" id="btn-delete-record" data-id="${item.id}"><i class="fa fa-trash"></i></button>
                                    </td>
                                </tr>`
                        array_id.push(item.id)
                    })
                    $('#account-info').html(tr)
                    $('#table-head').html(result[0].account_name)
                    $('#alert').html("")
                })
            } else if (result.length > 1) {
                $(`#account-list a.account-list`).removeClass('active')
                let accountIdArray = []
                result.forEach( (item) => {
                    accountIdArray.push(item.account_id)
                })
                let joinAccountIdArray = accountIdArray.join(",")
                loadAccountList(joinAccountIdArray)
                $('#account-info').html("")
                $('#table-head').html("")
                $('h6#header button').css('display','none')
            } else {
                $('#alert').html('<div class="alert alert-danger">No data found</div>')
                $('#account-info').html("")
                $('#table-head').html("")
                $('h6#header button').css('display','none')
            }
        })
    }

}

$('#input-search-account').keydown( (e) => {
    if(e.keyCode == 13){
        searchAccount()
    }
})
ipcRenderer.on('emit:search-all', () => {
    $('#input-search-all').focus()
})
ipcRenderer.on('emit:search-account', () => {
    $('#input-search-account').focus()
})

let loadAccountDialog = () => {
    let accountId = $('#account-list a.account-list.active').attr('data-id')
    let accountName = $('#account-list a.account-list.active').attr('data-name')
    ipcRenderer.send('load:modal-manage-account', accountId, accountName)
    $('#account-info').html("")
    $('#table-head').html("")
    $('h6#header button').css('display','none')
}

ipcRenderer.on('load:account', (e, accountId, accountName, accountUrl) => {
    loadAccountList()
    if(accountId === "" || accountId === undefined || accountId === null){
        $('#table-head').html("")
        $('h6#header button').css('display','none')
    } else {
        loadAccountInfo(accountId, accountUrl)
        $('#table-head').html(accountName)
    }
    $('#alert').html("")
})

let loadWebsite = () => {
    let url = $('#account-url').val()
    console.log(url)
    if(url != "null" && url != ""){
        ipcRenderer.send('load:web', url)
    } else {
        dialog.showMessageBoxSync({
            title: 'Alert',
            type: 'info',
            message: 'No url found, you might have not inserted it in the table'
        })
    }
}

ipcRenderer.on('app:active', (e, username, userid) => {
    $('.overlay').addClass('out')
    $('#username').val(username)
    $('#userid').val(userid)
})

let logOut = () => {
    $('.overlay').removeClass('out')
    ipcRenderer.send('app:logout')
}

let userInfoDialog = () => {
    let username = $('#username').val()
    let userid = $('#userid').val()
    ipcRenderer.send('load:user-info', username, userid)
}

ipcRenderer.on('load:new-account-name', (e, newAccountName, status) => {
    $('#table-head').html(newAccountName)
    if(status == 'no-changes-made') {
        $('#alert').html('<div class="alert alert-info">No changes made</div>')
        alertFadeOut()
    } else {
        $('#alert').html('<div class="alert alert-success">Succesfully change account name</div>')
        alertFadeOut()
    }
    loadAccountList()
})

ipcRenderer.on('logout', () => {
    logOut()
})
ipcRenderer.on('manage-account', () => {
    loadAccountDialog()
})
ipcRenderer.on('user-info', () => {
    userInfoDialog()
})