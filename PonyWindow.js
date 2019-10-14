'use strict';

const { BrowserWindow } = require('electron');
const { PonyWindowConfig, PonySpeakProbability } = require('./Config');

const MOVEMENT_TICK=100;

const defaultProps = {
    width: 200,
    height: 200,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    webPreferences: {
        nodeIntegration: true,        
    },
};

const SpeakTime = {
    entry: 0,
    exit: 1,
};
Object.freeze(SpeakTime);


class PonyWindow extends BrowserWindow {
    constructor( pony ) {
        let winProps = {...defaultProps, ...PonyWindowConfig};
        winProps.webPreferences = {
            ...winProps.webPreferences,
            additionalArguments: [pony.name, pony.staticImage],
        };        
        super(winProps);

//        this.webContents.openDevTools();       
        this.pony = pony;
        this.loadFile('pony.html');

        this.bounds = null;
    }

    get name () { return this.pony.name; }

    clearTimers() {
        if (this.currentTimer) { clearTimeout(this.currentTimer); }
        if (this.moveTimer) { clearTimeout(this.moveTimer); }        
    }
    
    hidePony() {
        this.clearTimers();
        this.hide();
    }
    
    teleport (bounds) {
        this.clearTimers();
        this.bounds = this.bounds || bounds || {x:1024, y:768};
        let b = bounds || this.bounds;
        
        let x = Math.floor(Math.random() * b.x);
        let y = Math.floor(Math.random() * b.y);
        this.setPosition(x,y);
    };
    
    selectNewBehaviour() {
        this.clearTimers();
        this.speak(SpeakTime.exit);

        let duration = this.pony.selectNextBehaviour(this.getBounds(), this.bounds);
        this.currentTimer=setTimeout(this.selectNewBehaviour.bind(this), duration);
        // console.log('new behaviour for %s is %s for %d ms', this.pony.name, this.pony.behaviour.name, duration);

        this.image=this.pony.behaviour.image;
        this.send('image', this.image);
        this.speak(SpeakTime.entry);
        this.movePony();
    }

    movePony() {
        this.moveTimer=setTimeout(this.movePony.bind(this), MOVEMENT_TICK);

        let pos = this.getBounds();        
        let speed = this.pony.behaviour.speed;
        let movement = {
            x:Math.floor(this.pony.behaviour.movement.x*speed),
            y:Math.floor(this.pony.behaviour.movement.y*speed),
        };

        pos.x += movement.x;
        pos.y += movement.y;
        pos.x = Math.max(0,Math.min(pos.x, this.bounds.x-pos.width));
        pos.y = Math.max(0,Math.min(pos.y, this.bounds.y-pos.height));

        this.setBounds(pos);
        this.maybeSpeak();
    }

    maybeSpeak() {
        if (Math.random() < PonySpeakProbability) {
            let line = this.pony.getRandomSpeak();
            if (line) { this.send('speak', line); }
        }
    }
    
    speak(speakTime) {        // TODO: May need to change this if speak can happen randomly
        if (this.pony.currentBehaviour &&
            this.pony.currentBehaviour.speakLines) {
            let line = '';
            if (SpeakTime.entry == speakTime) {
                line = this.pony.getSpeak(this.pony.currentBehaviour.speakLines.entry);
            } else {
                line = this.pony.getSpeak(this.pony.currentBehaviour.speakLines.exit);
            }

            if (line) { this.send('speak', line); }            
        }
    }
}

module.exports= PonyWindow;
