// 截图
const path = require('path')

const {
  BrowserWindow,
  ipcMain,
  globalShortcut,
  systemPreferences,
  desktopCapturer
} = require('electron')

let mainWindows = []
const iswin32 = process.platform == 'win32'
const islinux = process.platform == 'linux'
global.isAero = false
global.CAPTURE_DATA = []

let IMwindow

const winURL = `file://${path.resolve(__dirname, './index.html')}`

// 截图时隐藏IM窗口
let isCutHideWindows = false

if (iswin32) {
  // 因为Windows的基本主题和高对比度主题对transparent: true的兼容问题，这里区分Windows系统的主题，根据不同的主题设置不同的方案
  global.isAero = systemPreferences.isAeroGlassEnabled()
}
// 退出快捷键
const quitKey = 'Esc'

function getSource(win) {
  return new Promise(resolve => {
    desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: win.screenWidth, height: win.screenHeight }
    }).then(sources => {
      const match = sources.find(source => {
        return source.display_id == win.displayId
      })
      global.CAPTURE_DATA.push({
        id: match.display_id,
        thumbnail: match.thumbnail.toJPEG(100)
      })
      resolve(true)
    })
  })
}

// 退出截图快捷键
function quitCutFun() {
  globalShortcut.register(quitKey, () => {
    windowEdit('quit')
  })
}

// 窗口编辑
function windowEdit(type) {
  let isFinish = false
  for (let i = 0; i < mainWindows.length; i++) {
    const win = mainWindows[i]
    if (win) {
      win.webContents.send('capture-finish')
      switch (type) {
        case 'finish':
          setTimeout(() => {
            win.hide()
          }, 100)
          isFinish = true
          break
        case 'hide':
        case 'quit':
          setTimeout(() => {
            win.hide()
          }, 100)
          break
      }
    }
  }
  // 取消截图（按ESC键）或者截图完成后（如保存，取消，保存至剪切板）恢复聊天窗口
  if (isCutHideWindows) {
    IMwindow.show()
  }
  if (isFinish) {
    IMwindow.webContents.send('main-process-messages', {
      action: 'shortcutCapture'
    })
  }
  global.CAPTURE_DATA = []
  // 注销退出截图快捷键
  globalShortcut.unregister(quitKey)
}

// 和渲染进程通讯
ipcMain.on('window-edit', (event, type) => {
  windowEdit(type)
})

function launch(fromWindow, args = {}) {
  isCutHideWindows = args.isHide
  IMwindow = fromWindow
  // IM窗口为全屏化时，切图时会先缩小IM窗口，不会隐藏窗口，不管是否设置为“截图时隐藏窗口与否”
  if (IMwindow.isFullScreen()) {
    IMwindow.setFullScreen(false)
  }

  if (isCutHideWindows) {
    IMwindow.once('hide', (event) => {
      screenShot()
    })
    IMwindow.hide()
  } else {
    screenShot()
  }

  // 激活退出快捷键
  quitCutFun()
}

async function screenShot() {
  for (const win of mainWindows) {
    await getSource(win)
  }
  mainWindows.forEach(win => {
    win.webContents.send('capture-screen')
    win.show()
  })
}

function cacheWindows() {
  mainWindows.forEach(win => {
    win.destroy()
  })
  mainWindows = []
  const displays = require('electron').screen.getAllDisplays()
  for (const display of displays) {
    const winOption = {
      fullscreen: iswin32 || undefined,
      width: display.bounds.width,
      height: display.bounds.height,
      // width: 800,
      // height: 600,
      x: display.bounds.x,
      y: display.bounds.y,
      show: false,
      frame: false,
      transparent: true,
      movable: false,
      resizable: false,
      hasShadow: false,
      enableLargerThanScreen: true,
      webPreferences: {
        // 允许打开调试窗口
        devTools: true,
        // 允许html中运行nodejs
        nodeIntegration: true, // 是否完整的支持 node. 默认值为true.
        webviewTag: true, // 解决webview无法显示问题，版本5以上默认false
        enableRemoteModule: true,
        contextIsolation: false
      }
    }

    // 对Windows的基本主题和高对比度主题单独处理，因为它不支持transparent
    if (iswin32 && !global.isAero) {
      winOption.opacity = 0.0
    }

    if (islinux) {
      delete winOption.resizable
    }

    const mainWindow = new BrowserWindow(winOption)

    mainWindow.setAlwaysOnTop(true, 'screen-saver')

    mainWindow.setSkipTaskbar(true)
    const appendUrl = `${winURL}?id=${display.id}`
    mainWindow.displayId = display.id
    mainWindow.screenWidth = display.size.width * display.scaleFactor
    mainWindow.screenHeight = display.size.height * display.scaleFactor
    mainWindow.loadURL(appendUrl)

    mainWindows.push(mainWindow)
  }
}

module.exports = {
  launch,
  cacheWindows
}

