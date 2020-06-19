const electron = require('electron')
const path = require('path')
const {app, BrowserWindow, dialog, ipcMain, webContents, Menu, shell, nativeImage} = electron
const db = require('./config/database/dbconfig')
app.allowRendererProcessReuse = true
let modalLoginAccount
let mainPage 
let modalAddAccount
let modalManageAccount
let modalUserAccount
let modalChangePassword
let modalEditAccount
let userName
let meId
let accountId
let accountName
let editIcon = path.join(__dirname,'./assets/images/icon/edit.png')
let plusIcon = path.join(__dirname,'./assets/images/icon/add.png')
let userIcon = path.join(__dirname,'./assets/images/icon/user.png')
app.on('ready', () => {
    mainPage = new BrowserWindow({
        title: 'Accountman 1.0',
        height: 700,
        width: 1200,
        autoHideMenuBar: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: true
        }
    })
    modalLogin()
    db.connect()
    mainPage.loadFile('index.html')

    mainPage.on('close', () => {
        app.quit()
        modalLoginAccount.closable = false
    })
})

ipcMain.on('login:success', (e, username, id) => {
    modalLoginAccount.closable = true
    modalLoginAccount.close()
    mainPage.webContents.send('app:active', username, id)
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
    Menu.setApplicationMenu(mainMenu)
})

ipcMain.on('app:logout', () => {
    modalLogin()
    const loginMenu = Menu.buildFromTemplate(loginMenuTemplate)
    Menu.setApplicationMenu(loginMenu)
})

ipcMain.on('close:app', () => {
    app.quit()
})

ipcMain.on('close:modal-change-password', (e, newUserName) => {
    modalUserAccount.webContents.send('load:new-username', newUserName)
    console.log(newUserName)
    modalChangePassword.close()
})
ipcMain.on('close:modal-add-account', () => {
    modalAddAccount.close()
})
ipcMain.on('close:modal-edit-singleaccount', (e, newAccountName, status) => {
    modalEditAccount.close()
    mainPage.webContents.send('load:new-account-name', newAccountName, status)
})
modalLogin = () => {
    modalLoginAccount = new BrowserWindow({
        frame: false,
        resizable: false,
        closable: false,
        modal: true,
        parent: mainPage,
        width: 250,
        height: 200,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        }
    })
    modalLoginAccount.loadFile('login.html')
    modalLoginAccount.on('ready-to-show', () => {
        const loginMenu = Menu.buildFromTemplate(loginMenuTemplate)
        Menu.setApplicationMenu(loginMenu)
    })
}
modalAdd = () => {
    modalAddAccount = new BrowserWindow({
        title: 'Add Account',
        webPreferences: {
            nodeIntegration: true
        },
        parent: mainPage,
        width: 300,
        height: 250,
        autoHideMenuBar: true,
        modal: true,
        resizable: false,
        minimizable: false,
        icon: false,
        icon: plusIcon
    })
    modalAddAccount.loadFile('modal-add-account.html')
} 

ipcMain.on('open-modal:add-account', (e) => {
    modalAdd()
})

ipcMain.on('submit:account', (e, accountName) => {
    let query = `select * from account where account_name = '${accountName}'`
    db.query(query, (err, result) => {
        if(err) throw err
        let accountId = result[0].account_id
        let accountUrl = result[0].account_url
        mainPage.webContents.send('load:detail-form', accountId, accountName, accountUrl)
    })
    modalAddAccount.close()
    
})

modalManAccount = () => {
    modalManageAccount = new BrowserWindow({
        title: 'Account list',
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        },
        width: 600,
        height: 600,
        parent: mainPage,
        modal: true,
        resizable: false,
        minimizable: false,
        icon: editIcon
    })

    modalManageAccount.loadFile('modal-manage-account.html')
    modalManageAccount.on('close', () => {
        if(accountId ==="" || accountId ===  undefined){
            mainPage.webContents.send('load:account', accountId, accountName, '')
        } else {
            let query = `select * from account where account_id = ${accountId}`
            db.query(query, (err, result) => {
                if(err) throw err
                let accountUrl = result[0].account_url
                mainPage.webContents.send('load:account', accountId, accountName, accountUrl)
            })
        }
        const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
        Menu.setApplicationMenu(mainMenu)
    })

    modalManageAccount.on('focus', () => {
        const manageMenu = Menu.buildFromTemplate(modalManageAccountMenu)
        Menu.setApplicationMenu(manageMenu)
    })
}
ipcMain.on('load:modal-manage-account', (e, id, name) => {
    modalManAccount()
    accountId = id
    accountName = name
})

ipcMain.on('load:web', (e, url) => {
    let URL = url.replace('https://',"")
    shell.openExternal(`https://${URL}`)
})

modalUser = () => {
    modalUserAccount = new BrowserWindow({
        title: 'User Info',
        width: 600,
        height: 600,
        resizable: false,
        minimizable: false,
        modal: true,
        autoHideMenuBar: true,
        parent: mainPage,
        webPreferences: {
            nodeIntegration: true
        },
        icon: userIcon     
    })
    modalUserAccount.loadFile('modal-user-info.html')
    modalUserAccount.on('close', () => {
        const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
        Menu.setApplicationMenu(mainMenu)
    })

    modalUserAccount.on('focus', () => {
        const userMenu = Menu.buildFromTemplate(modalUserAccountMenu)
        Menu.setApplicationMenu(userMenu)
    })
}

modalChangePswd = () => {
    modalChangePassword = new BrowserWindow({
        title: 'Change username and password',
        width: 300,
        height: 250,
        autoHideMenuBar: true,
        modal: true,
        parent: modalUserAccount,
        resizable: false,
        minimizable: false,
        webPreferences: {
            nodeIntegration: true
        },
        icon: editIcon
    })
    modalChangePassword.loadFile('change-password.html')
}
ipcMain.on('load:user-info', (e, username, id) => {
    modalUser()
    userName = username
    meId = id
})
ipcMain.on('load:change-password', (e, username, id) => {
    userName = username
    meId = id
    modalChangePswd()
})
ipcMain.on('req:user', (e, msg) => {
    if(msg === 'change password'){
        modalChangePassword.webContents.send('send:user', userName, meId)
    } else {
        modalUserAccount.webContents.send('send:user', userName, meId)
    }

})

modalEdit = () => {
    modalEditAccount = new BrowserWindow({
        title: 'Edit name',
        width: 300,
        height: 150,
        autoHideMenuBar: true,
        resizable: false,
        minimizable: false,
        modal: true,
        parent: mainPage,
        webPreferences: {
            nodeIntegration: true
        },
        icon: editIcon
    })
    modalEditAccount.loadFile('modal-edit-singleaccount.html')
}
ipcMain.on('load:edit-single-account', (e, id, name) => {
    accountId = id
    accountName = name
    modalEdit()
})
ipcMain.on('req:account-id', () => {
    modalEditAccount.webContents.send('res:account-id', accountId, accountName)
})

const mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Add account',
                accelerator: 'Ctrl+D',
                click: () => {
                    modalAdd()
                }
            },
            {
                label: 'Submit record',
                accelerator: 'Ctrl+S',
                click: () => {
                    mainPage.webContents.send('submit:account-info')
                }
            },
            {
                label: 'Manage account',
                accelerator: 'Ctrl+Q',
                click: () => {
                    mainPage.webContents.send('manage-account')
                }
            },
            {
                label: 'User info',
                accelerator: 'Ctrl+T',
                click: () => {
                    mainPage.webContents.send('user-info')
                }
            },
            {
                label: 'Log out',
                accelerator: 'Ctrl+Shift+E',
                click: () => {
                    mainPage.webContents.send('logout')
                }
            },
            {
                label: 'Export'
            },
            {
                label: 'Search all',
                accelerator: 'Ctrl+F',
                click: () => {
                    mainPage.webContents.send('emit:search-all')
                }
            },
            {
                label: 'Search Account',
                accelerator: 'Ctrl+Shift+F',
                click: () => {
                    mainPage.webContents.send('emit:search-account')
                }
            },
            {
                label: 'Settings'
            },
            {
                label: 'Close tab'
            },
            {
                role: 'close'
            }
        ]
    },
    {   
        role: 'editMenu'
    },
    {
        label: 'View',
        submenu: [
            {
                type: 'separator'
            },
            {
                role: 'resetZoom'
            },
            {
                role: 'zoomIn'
            },
            {
                role: 'zoomOut'
            },
            {
                role: 'toggleDevTools',
                accelerator: 'Ctrl+I'
            },
            {
                type: 'separator'
            },
            {
                role: 'toggleFullScreen'
            }
        ]
    },
    {
        label: 'Window',
        role: 'windowMenu'
    },
    {
        label: 'Help',
        submenu: [
            {
                label: 'Check for updates'
            },
            {
                label: 'Documentation'
            },
            {
                label: 'Twitter'
            },
            {
                label: 'Facebook'
            },
            {
                label: 'Support'
            }
        ]
    }
]
const loginMenuTemplate = []
const modalChangePasswordMenu = []
const modalEditAccountMenu = []
const modalManageAccountMenu = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Save changes',
                accelerator: 'Ctrl+S',
                click: () => {
                    modalManageAccount.webContents.send('modal-manage-account:save-changes')
                }
            },
            {
                label: 'Delete',
                accelerator: 'Ctrl+E',
                click: () => {
                    modalManageAccount.webContents.send('modal-manage-account:delete-data')
                }
            }
        ]
    },
    {
        label: 'View',
        submenu: [
            {
                type: 'separator'
            },
            {
                role: 'resetZoom'
            },
            {
                role: 'zoomIn'
            },
            {
                role: 'zoomOut'
            },
            {
                role: 'toggleDevTools',
                accelerator: 'Ctrl+I'
            },
            {
                type: 'separator'
            },
            {
                role: 'toggleFullScreen'
            }
        ]
    },
]
const modalUserAccountMenu = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Add row',
                accelerator: 'Ctrl+D',
                click: () => {
                    modalUserAccount.webContents.send('modal-user-account:add-row')
                }
            },
            {
                label: 'Save changes',
                accelerator: 'Ctrl+S',
                click: () => {
                    modalUserAccount.webContents.send('modal-user-account:save-changes')
                }
            },
            {
                label: 'Delete',
                accelerator: 'Ctrl+E',
                click: () => {
                    modalUserAccount.webContents.send('modal-user-account:delete-data')
                }
            }
        ]
    },
    {
        label: 'View',
        submenu: [
            {
                type: 'separator'
            },
            {
                role: 'resetZoom'
            },
            {
                role: 'zoomIn'
            },
            {
                role: 'zoomOut'
            },
            {
                role: 'toggleDevTools',
                accelerator: 'Ctrl+I'
            },
            {
                type: 'separator'
            },
            {
                role: 'toggleFullScreen'
            }
        ]
    },
]

process.env.NODE_ENV = 'production'