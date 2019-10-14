'use strict';
const Path = require('path');
const fs = require('fs').promises;
const {ForEach} = require('./promiseUtils');
const Pony = require('./Pony');

class PonyContainer {    
    constructor() {
        this.ponylist=[];
//        this.loadPonies();
    }
    get ponies() { return this.ponylist; }

    find(ponyName) { return this.ponies.find( p => p.name == ponyName); }    

    loadPonies() {
        let dir = Path.join(__dirname, 'pony-data');
        return fs.readdir(dir)
            .then( ForEach( this.loadPony(this) ) )
            .catch( (err) => { console.log(err); });
    }

    loadPony = (that) => (ponydir) => {
        return Promise.resolve(ponydir)
            .then( dir => {
                let ponyfile = Path.join(__dirname, 'pony-data', dir, 'Pony.ini');
                return new Pony(ponyfile);
            })
            .then( p => p.loadPony() )
            .then( p => {
                that.ponylist.push(p);
                return p;
            });
    }
}


module.exports = PonyContainer;
