const {
  ipcRenderer,
  remote
} = require('electron')

const {
  $,
  // eslint-disable-next-line no-unused-vars
  chromeMediaSourceId,
  currentWidth,
  currentHeight
} = require('./getCurWin')

const {
  cut
} = require('./render')

const imgDom = $('screenImg')
const mask = $('mask')

const iswin32 = process.platform == 'win32'
const islinux = process.platform == 'linux'

// retina显示屏和普通显示屏
// eslint-disable-next-line no-unused-vars
const ratio = window.devicePixelRatio || 1

const currentWindow = remote.getCurrentWindow()
const isAero = remote.getGlobal('isAero')

// handleError
// eslint-disable-next-line no-unused-vars
function handleError(error) {
  console.error(`${error.errmsg || error.toString()}`)
}

// handleStream
function handleStream(stream) {
  // 操作img
  imgDom.style.cssText += 'width: ' + currentWidth + 'px; height: ' + currentHeight + 'px;display:block;'
  const blob = new Blob([stream], { type: 'image/jpeg' })
  imgDom.src = URL.createObjectURL(blob)
  imgDom.onload = function() {
    mask.style.cssText += 'opacity: 1'
  }
  // 对Windows的基本主题和高对比度主题单独处理，因为它不支持transparent
  if (iswin32 && !isAero) {
    currentWindow.setOpacity(1.0)
  }

  // linux
  if (islinux) {
    ipcRenderer.send('linux-fullscreen')
  }

  // 触发截图
  cut()
}

// 避免偶尔的截取的全屏图片带有mask透明，不是清晰的全屏图
mask.style.cssText += 'opacity:0'

// 防止截图不截取任何区域，直接双击拷贝，拷贝的是上次截的图
localStorage.cutImgUrl = ''

const id = getUrlParam('id')

// const captureData = remote.getGlobal('CAPTURE_DATA')
// const currentScreenData = captureData.find(item => {
//   return item.id === id.toString()
// })
// const imgUrl = currentScreenData.thumbnail
// handleStream(imgUrl)

function getUrlParam(key) {
  const url = window.location.href
  const p = url.split('?')[1]
  const params = new URLSearchParams(p)
  return params.get(key)
}

ipcRenderer.on('capture-screen', () => {
  const captureData = remote.getGlobal('CAPTURE_DATA')
  const currentScreenData = captureData.find(item => {
    return item.id === id.toString()
  })
  const imgUrl = currentScreenData.thumbnail
  handleStream(imgUrl)
})
