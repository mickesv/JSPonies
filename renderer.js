'use strict';

const { ipcRenderer } = require('electron');

const releasePony= (pname) => {
    let pony = document.getElementById(`${pname}-image`);
    if (pony.style.filter != '') {
        pony.style.filter = '';
    } else {
        pony.style.filter="brightness(30%)";
    }
};

const togglePony = (event) => {
    console.log('Pony to toggle: %s', event.target.id);
    ipcRenderer.send('togglePony', event.target.id);
    releasePony(event.target.id);
};

ipcRenderer.on('ponies', (event, ponies) => {
    console.log('received Ponies %s', ponies);
    console.log(ponies);
    const ponySpace = document.getElementById('Ponies');
    const formattedPonies = ponies.reduce( (html, pony) => {
        html += `<div class="Pony" id="${pony.name}">\n`;
        html += `<div class=PonyName>${pony.name}</div>\n`;
        html += `<div><img src="${pony.staticImage}" class=PonyImage id="${pony.name}-image"></div>\n`;
        html += '</div>\n';
        return html;
    }, '');
    ponySpace.innerHTML = formattedPonies;
    ponySpace.querySelectorAll('.Pony').forEach(item => item.addEventListener('click', togglePony));
});

ipcRenderer.on('releasePony', (evt, pname) => {
    releasePony(pname);
});

console.log('loaded renderer.js');
ipcRenderer.send('loaded', 'MainWindow loaded. Send me PONIES!');
