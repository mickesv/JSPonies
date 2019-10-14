'use strict';

const { ipcRenderer } = require('electron');
const { SpeakDuration } = require('./Config');

function setImage(imagePath) {    
    let pi = document.getElementById('Pony');
    pi.innerHTML = `<img src="${imagePath}" class=PonyImage>`;
}

function setInitialImage() {
    let imagePath = window.process.argv.slice(-1)[0];
    setImage(imagePath);

    let title = document.getElementById('Title');
    title.innerText= window.process.argv.slice(-2)[0];
}

function clearSpeak() {
    let speechBubble = document.getElementById('Speak');
    speechBubble.innerText='';
    speechBubble.style.visibility='hidden';
}

setInitialImage();
console.log('loaded ponyRenderer.js');


ipcRenderer.on('image', (evt,img) => {
    setImage(img);    
});

ipcRenderer.on('speak', (evt,txt) => {
    console.log(txt);
    let speechBubble = document.getElementById('Speak');
    speechBubble.innerText=txt;
    speechBubble.style.visibility='visible';
    speechBubble.style.opacity=1;
    setTimeout(clearSpeak, SpeakDuration);
});
