"use strict";


class PonySpeak {
    constructor(cols, path) {
        if (cols.length <= 2) {
            this.name = "unnamed";
            this.text = cols[1].trim();
        } else {
            this.name = cols[1].trim();
            this.text = cols[2].trim();
        }
    }
}

module.exports=PonySpeak;
