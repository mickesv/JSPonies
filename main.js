'use strict';
const electron = require('electron');
const path = require('path');
const PonyContainer = require('./PonyContainer');
const PonyWindow = require('./PonyWindow');
const TouchBarPony = require('./TouchBarPony');
const {DefaultStable, DefaultTouchBarPony} = require('./Config');

let ponyContainer = new PonyContainer();
let ponyWindows = [];
let mainWindow;
let screenBoundaries;

function createMainWindow () {
    mainWindow = new electron.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
        }
    });
//    mainWindow.webContents.openDevTools();    
    mainWindow.loadFile('index.html');
    mainWindow.on('closed', () => { mainWindow = null; });
    return mainWindow;
}

function getScreenBoundaries(win) {
    let bounds = win.getBounds();
    let screen = electron.screen.getDisplayNearestPoint({x:bounds.x, y:bounds.y});
    return {x:screen.bounds.width, y:screen.bounds.height};
}

function launchPony(pony) {
    if (!pony) return;
    console.log('Releasing %s to pasture...', pony.name);
    pony.toggle(true);

    let pw = new PonyWindow(pony);
    ponyWindows.push(pw);

    pw.once('ready-to-show', () => {
        pw.teleport(screenBoundaries);
        pw.selectNewBehaviour();
        pw.showInactive();
        mainWindow.send('releasePony', pony.name);
    });
}

function launchDefaultStable() {
    DefaultStable.map( p => {
        let pony = ponyContainer.find(p);
        if (pony) { launchPony(pony); }
    });
}

function launchTouchBarPony() {
    if (DefaultTouchBarPony) {
        let pony = ponyContainer.find(DefaultTouchBarPony);
        if (pony) {
            return Promise.resolve(pony.clone)
                .then( p => p.loadPony() )
                .then( p => { return new TouchBarPony(p); });
        }
    }

    return null;
}

function main() {
    return Promise.resolve()
        .then( () => ponyContainer.loadPonies() )
        .then( createMainWindow )
        .then( (win) => { return screenBoundaries = getScreenBoundaries(win); })
        .then( launchTouchBarPony )
        .then( (tbPony) => { mainWindow.setTouchBar(tbPony); })
        .catch( err => console.log(err) );
}

function closeAll() {
    ponyWindows.map( p => {
        try {
            p.hidePony();
        } catch (err) { }
    });
    electron.app.quit();    
}

electron.app.on('ready', main);
electron.app.on('window-all-closed', () => { electron.app.quit(); });
electron.app.on('activate',  () => { if (mainWindow === null) createMainWindow(); });
electron.app.on('quit', () => { closeAll(); });

electron.ipcMain.on('loaded', (evt, msg) => {
    const ponies = ponyContainer.ponies.map( p => p.ponyData);    
    evt.sender.send('ponies', ponies);
    launchDefaultStable();
});

electron.ipcMain.on('togglePony', (evt, msg) => {
    //console.log('Toggling Pony %s', msg);
    let pony = ponyContainer.find(msg);
    if (pony.toggle()) {
        launchPony(pony);
    } else {
        let pw = ponyWindows.find( w => w.name==pony.name );
        ponyWindows = ponyWindows.filter( w => w.name!=pony.name );
        pw.hidePony();
    }
});
