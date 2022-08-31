const { app, BrowserWindow,ipcMain } = require('electron')
const {launch,cacheWindows}=require('./capture/captureWindow.js')

let mainWindow

function createWindow () {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            devTools: true, // Whether to enable DevTools.
            nodeIntegration: true, // 是否完整的支持 node. 默认值为true.
            enableRemoteModule: true,
            contextIsolation: false
        }
    })

    mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
    initCaptureWindow()
})

function initCaptureWindow(){
    cacheWindows()
    ipcMain.on('screen-capture',(event,data)=>{
        launch(mainWindow)
    })
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
