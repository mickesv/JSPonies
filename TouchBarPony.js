'use strict';

const { TouchBar, nativeImage } = require('electron');
const { TouchBarLabel, TouchBarButton } = TouchBar;

const { GifUtil, GifFrame } = require('gifwrap');
const Jimp = require('jimp');

const MAXPOSITION=75;
const STARTPOSITION=Math.floor(MAXPOSITION/2);
const MOVEMENT_TICK=200;

class TouchBarPony extends TouchBar {
    constructor(pony) {
        let leftSpacer = new TouchBarLabel({textColor:'#000000'});
        let button = new TouchBarButton({
            label: '',
            backgroundColor: '#000000',
        });
        super({items:[leftSpacer, button]});        
        
        this.pony = pony;
        this.xpos = STARTPOSITION;
        this.leftSpacer = leftSpacer;
        this.ponyButton = button;
        this.setPosition(this.xpos);
        this.setImage(this.pony.staticImage);
        console.log('%s is grazing on the TouchBar', pony.name);
        this.selectNewBehaviour();
    }

    clearTimers() {
        if (this.animationTimer) { clearTimeout(this.animationTimer); }
        if (this.behaviourTimer) { clearTimeout(this.behaviourTimer); }
        if (this.movementTimer) { clearTimeout(this.movementTimer); }        
    };
    
    selectNewBehaviour() {
        this.clearTimers();
        let duration = Math.floor(this.pony.selectNextBehaviour({x:this.xpos, y:0}, {x:MAXPOSITION, y:0})/2);
        this.behaviourTimer=setTimeout(this.selectNewBehaviour.bind(this), duration);
        this.setImage(this.pony.behaviour.image);
        this.movePony();
    }

    setPosition(xpos) {
        this.leftSpacer.label = '.'.repeat(xpos);
    }
    
    movePony() {
        this.movementTimer=setTimeout(this.movePony.bind(this), MOVEMENT_TICK);
        let speed = this.pony.behaviour.speed;        
        this.xpos += this.pony.behaviour.onlyVerticalMovement;
        this.xpos = Math.max(0,Math.min(this.xpos, MAXPOSITION));
        this.setPosition(this.xpos);
    }
    

    setImage(imageName) {
        if (this.animationTimer) { clearTimeout(this.animationTimer); }
        
        this.image = GifUtil.read(imageName);
        return Promise.resolve(this.image)
            .then(source => {
                this.currentFullImage = source;
                this.maxFrames = source.frames.length;
                this.currentFrame = -1;
                this.updateImage();
            });
    }

    getCurrentFrameData(frameCount) {
        this.currentFrameImg = this.currentFullImage.frames[frameCount];
        this.delay = this.currentFrameImg.delayCentisecs*10;
    }

    updateImage() {
        this.currentFrame = ++this.currentFrame % this.maxFrames;
        this.getCurrentFrameData(this.currentFrame);
        this.updateButton();
        this.animationTimer = setTimeout(this.updateImage.bind(this), this.delay);
    };    

    updateButton() {
        let jimpshare = GifUtil.shareAsJimp(Jimp,this.currentFrameImg);
        return Promise.resolve(jimpshare) 
            .then( img => img.getBufferAsync(Jimp.MIME_PNG) )
            .then( buf => { return nativeImage.createFromBuffer(buf); })
            .then( natImg => { this.ponyButton.icon=natImg; })
            .catch( err => {
                console.log(err);
            });        
    }
}

module.exports = TouchBarPony;
