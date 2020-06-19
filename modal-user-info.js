const {ipcRenderer} = require('electron')
const {remote} = require('electron')
const path = require('path')
const {dialog, Menu, MenuItem, nativeImage} = remote
const RightMenu = require('./rightMenu')
const db = require(path.join(__dirname,'/config/database/dbconfig'))

let username
let id
let rowId
ipcRenderer.send('req:user', 'user info')
ipcRenderer.on('send:user', (e, userName, meId) => {
    username = userName
    id = meId
    loadUserInfo()
    $('#myname').html(username)
})
const tableMenu = new RightMenu({
    title: 'table'
})
$('#tbody-user').on('contextmenu','input[type="text"]', function() {
    let id = $(this).attr('data-id')
    rowId = id
    tableMenu.popupTableMenu()
})


loadUserInfo = (search = "") => {
    iterateRes = (res) => {
        let tr = ''
        let ind = 0
        res.forEach( (item) => {
            tr+=`<tr>
                    <td><input type="checkbox" class="checkbox" data-id="${item.id}" data-ind="${ind}"></td>
                    <td><input type="text" style="border:none;width:100%;" class="item-user" data-id="${item.id}" data-ind="${ind}" value="${item.item}"></td>
                    <td><input type="text" style="border:none;width:100%;" class="desc-user" data-id="${item.id}" data-ind="${ind}" value="${item.description}"></td>
                    <td><a href="#" class="delete-user-info" data-id="${item.id}" data-ind="${ind}"><i class="fa fa-times"></i> delete</a></td>    
                </tr>`
            ind++
        })
        $('#tbody-user').html(tr)
        $('#res-length').val(res.length)
    }
    if(search != ""){
        let query = `select * from me_info where me_id = ${id} and item like '%${search}%' or description like '%${search}%'`
        db.query(query, (err, results) => {
            if(err) throw err
            if(results.length < 1){
            $('#alert').html('<div class="alert alert-danger">No data found</div>')
            $('#tbody-user').html("")
        } else {
            iterateRes(results)
        }
    })
    } else {
        let query = `select * from me_info where me_id = ${id}`
        db.query(query, (err, results) => {
            if(err) throw err
            iterateRes(results)
        })
    }
}
checkAll = () => {
    $('.checkbox').prop('checked',true)
}
uncheckAll = () => {
    $('.checkbox').prop('checked',false)
}
deleteSelectedRow = () => {
    let info = []
    $('.checkbox:checked').each(function() {
        info.push($(this).attr('data-id'))
    })
    if(info.length < 1){
        let msg = dialog.showMessageBoxSync({
            title: 'Alert',
            message: 'You didnot select any of data, this action will delete all data in the table. Are you sure to continue',
            buttons: ['No','Yes'],
            defaultId: [0,1]
        })
        if(msg == 1){
            let query = `delete from me_info`
            db.query(query, (err) => {
                if(err) throw err
                $('#alert').html('<div class="alert alert-success">Succesfully delete all data</di>')
                alertFadeOut()
                loadUserInfo()
            })
        }
    } else {
        let msg = dialog.showMessageBoxSync({
            title: 'Alert',
            message: 'Are you sure to delete the selected data?',
            buttons: ['No','Yes'],
            defaultId: [0,1]
        })
        if(msg == 1){
            joinInfo = info.join(",")
            let query = `delete from me_info where id IN(${joinInfo})`
            db.query(query, (err) => {
                if(err) throw err
                $('#alert').html('<div class="alert alert-success">Succesfully delete the selected data</di>')
                alertFadeOut()
                loadUserInfo()
            })
        }
    }
}
alertFadeOut = () => {
    let blankAlert = () => {
        $('#alert').html("")
    }
    setTimeout(blankAlert, 3000)
}
deleteSingleRow = (id) => {
    let msg = dialog.showMessageBoxSync({
        title: 'Alert',
        message: 'Are you sure to delete this row?',
        buttons: ['No','Yes'],
        defaultId: [0,1]
    })
    if(msg === 1) {
        let query = `delete from me_info where id = ${id}`
        db.query(query, (err) => {
            if(err) throw err
            $('#alert').html('<div class="alert alert-success">Succesfully delete the selected data</di>')
            alertFadeOut()
            loadUserInfo()
        })
    }
}
$('#tbody-user').on('click','.delete-user-info', function() {
    let id = $(this).attr('data-id')
    deleteSingleRow(id)
})

addRow = () => {
    let query = `insert into me_info(item, description, me_id) values("","",${id})`
    db.query(query, (err) => {
        if(err) throw err
        loadUserInfo()
        $('#alert').html("")
    })
}

searchInfo = () => {
    let search = $('#input-search').val()
    loadUserInfo(search)
}
$('#input-search').keyup(function() {
    let val = $(this).val()
    if(val === ""){
        $('#alert').html("")
        loadUserInfo()
    }
})
$('#input-search').keydown(function(e) {
    let search = $(this).val()
    if(e.keyCode == 13) {
        loadUserInfo(search)
    }
})
saveChanges = () => {
    let id = []
    let item = []
    let description = []
    let input = []
    let i
    let ind
    let resLength = $('#res-length').val()
    for(i=0;i<resLength;i++){
        item.push($(`.item-user[data-ind="${i}"]`).val())
        description.push($(`.desc-user[data-ind="${i}"]`).val())
        id.push($(`.checkbox[data-ind="${i}"]`).attr('data-id'))
    }
    for(ind=0;ind<resLength;ind++){
        input.push(`(${id[ind]},'${item[ind]}','${description[ind]}')`)
    }
    joinInput = input.join(",")
    let query = `insert into me_info(id, item, description) values${joinInput}
                on duplicate key update item=values(item), description=values(description)`
    db.query(query, (err) => {
        if(err) throw err
        loadUserInfo()
        $('#alert').html('<div class="alert alert-success">Successfully save changes</di>')
        alertFadeOut()
    })
}
changePassword = () => {
    ipcRenderer.send('load:change-password', username, id)
}
ipcRenderer.on('load:new-username', (e, newUserName) => {
    $('#myname').html(newUserName)
})

ipcRenderer.on('modal-user-account:add-row', () => {
    addRow()
})

ipcRenderer.on('modal-user-account:save-changes', () => {
    saveChanges()
})
ipcRenderer.on('modal-user-account:delete-data', () => {
    deleteSelectedRow()
})