'use strict';

const fs = require('fs').promises;
const Path = require('path');
const {ForEach} = require('./promiseUtils.js');
const PonyBehaviour = require('./PonyBehaviour');
const PonySpeak = require('./PonySpeak');
const PonyEffect = require('./PonyEffect');

const emptyPony = {
    name: "",
    staticImage: null,
    behaviour: [],
    speak: [],
    effect: [],
    visibility: false
};


class Pony {
    constructor(filename) {
        this.ponyData = JSON.parse(JSON.stringify(emptyPony)); // deep copy.
        this.filename = filename;
        this.currentBehaviour = null;
    }

    get clone() { return new Pony(this.filename); }
    get name () { return this.ponyData.name; }    
    get data () { return this.ponyData; }
    get staticImage () { return this.ponyData.staticImage; }
    get isVisible () { return this.data.visibility; }
    get behaviour () { return this.currentBehaviour; }

    get currentImage() {
        if (this.currentBehaviour) {
            return this.currentBehaviour.image;
        } else {
            return null;
        }
    };
    
    toggle(desired) {
        this.data.visibility = desired || !this.data.visibility;        
        return this.data.visibility;
    }

    getRandomSpeak() {
        let rand = Math.floor(Math.random() * this.data.speak.length);
        return this.data.speak[rand].text;
    };

    getSpeak(speakName) {
        if (speakName) {
            let speak=this.data.speak.find( l => l.name.toLowerCase() == speakName.toLowerCase());
            if (speak) { return speak.text; }
        }
        return null;
    };
    
    getBehaviourByName(name) { return this.data.behaviour.find( b => b.name==name); };            

    getRandomBehaviour() {
        const CUTOFF=200;
        let loop = 0;
        while(loop++<CUTOFF) {
            let dice = Math.random();
            let nextIndex = Math.floor(Math.random()*this.data.behaviour.length);
            let next = this.data.behaviour[nextIndex];
            if (dice <= next.data.probability && !next.data.skip) return next;
        }
        return this.data.behaviour[0];
    }

    getLinkedBehaviour(startBehaviour) {
        if (startBehaviour &&
            startBehaviour.linked) {
            return this.getBehaviourByName(startBehaviour.linked.name);
        } else {
            return null;
        }
    }
    
    selectNextBehaviour (currentPosition, screenBounds, desired) {
        let linked = this.getLinkedBehaviour(this.currentBehaviour);        
        let nextBehaviour = desired || linked || this.getRandomBehaviour();
        this.currentBehaviour = nextBehaviour;
        let movement = this.currentBehaviour.setMovement(currentPosition, screenBounds);
        // TODO Cancel any interaction
        
        let duration = (Math.floor(Math.random()
                                   * (this.currentBehaviour.data.maxDuration-this.currentBehaviour.data.minDuration))
                        + this.currentBehaviour.data.minDuration) * 1000;
        return duration;
    }
    

    loadPony() {
        return this.readPonyInit(this.filename)
            .then ( () => {
                if (this.ponyData.behaviour.length > 0) {
                    this.ponyData.staticImage=this.ponyData.behaviour[0].data.rightImage;
                }
            })
            .then( () => { return this; });
    }

    readPonyInit(filename) {
        this.path=Path.dirname(filename);
        return fs.readFile(filename)
            .then( res => res.toString().split('\n') )
            .then( ForEach(this.parseLine(this)) ) 
            .catch( err => { console.log(err); });
    };

    parseLine = (that) => (line) => {
        line = line.trim();
        if(line.length == 0 ||
           line.startsWith("'")) return;
        
        let cols = line.match(/("[^"]*")|[^,]+/g) || [];
        cols=cols.map (c => c.replace(/\"/g,"") );
           
        if (cols.length > 0) {
            if (cols[0].includes("Name")) { that.ponyData.name=cols[1].trim(); }
            else if (cols[0].includes("Behavior")) { that.ponyData.behaviour.push(new PonyBehaviour(cols, that.path)); }
            else if (cols[0].includes("Speak")) { that.ponyData.speak.push(new PonySpeak(cols, that.path)); }
            else if (cols[0].includes("Effect")) { that.ponyData.effect.push(new PonyEffect(cols, that.path)); }
            else if (cols[0].includes("Categories")) { /* TODO */ }
            else { console.log("Weird statement #%s#", line); };
        };
    };
}

module.exports=Pony;
