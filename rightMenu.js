class RightMenu {
    constructor(options) {
        this.obj = options
        switch(this.obj.title) {
            case 'table':
                this.getTableMenu();
            case 'account list':
                this.getAccountListMenu()  
        }
    }
    getIcon(icon) {
        return path.join(__dirname,`/assets/images/icon/${icon}.png`)
    }

    getTableMenu() {
        const selectIcon = this.getIcon('select')
        const deleteIcon = this.getIcon('delete')
        const copyIcon = this.getIcon('copy')
        const pasteIcon = this.getIcon('paste')
        const undoIcon = this.getIcon('undo')
        const redoIcon = this.getIcon('redo')
        let separator = new MenuItem({type: 'separator'})
        const menu = new Menu()
        menu.append(new MenuItem({
            label: 'Copy',
            icon: copyIcon,
            role: 'copy'
        }))
        menu.append(new MenuItem({
            label: 'Paste',
            icon: pasteIcon,
            role: 'paste'
        }))
        menu.append(separator)
        menu.append(new MenuItem({
            label: 'Select All',
            icon: selectIcon,
            role: 'selectAll'
        }))
        menu.append(new MenuItem({
            label: 'Undo',
            icon: undoIcon,
            role: 'undo'
        }))
        menu.append(new MenuItem({
            label: 'Redo',
            icon: redoIcon,
            role: 'redo'
        }))
        menu.append(separator)
        menu.append(new MenuItem({
            label: 'Delete row',
            icon: deleteIcon,
            click: () => {
                deleteSingleRow(rowId)
            }
        }))
        this.tableMenu = menu
    }

    popupTableMenu() {
        this.tableMenu.popup({window: remote.getCurrentWindow()},false)
    }

    getAccountListMenu() {
        const editIcon = this.getIcon('pencil')
        const deleteIcon = this.getIcon('delete')
        const accountMenu = new Menu()
        accountMenu.append(new MenuItem({
            label: 'Edit name',
            icon: editIcon,
            click: () => {
                editSingleAccount(accountId, accountName)
            }
        }))
        accountMenu.append(new MenuItem({
            label: 'Delete account',
            icon: deleteIcon,
            click: () => {
                deleteSingleAccount(accountId)
            }
        }))

        this.accountListMenu = accountMenu
    }
    popupAccountListMenu() {
        this.accountListMenu.popup({window: remote.getCurrentWindow()}, false)
    }
}

module.exports = RightMenu