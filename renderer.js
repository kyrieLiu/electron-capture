const {ipcRenderer,clipboard} =require('electron')

function capture(){
    ipcRenderer.send('screen-capture')
}

ipcRenderer.on('main-process-messages',(event,data)=>{
    let pic=clipboard.readImage()
    let url=pic.toDataURL()
    let imgPreview=document.getElementById('imgPreview')
    imgPreview.src=url
})
