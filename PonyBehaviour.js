"use strict";

const Path=require('path');

const AllowedMoves = {
    None: "none",
		HorizontalOnly: "horizontal_only",
		VerticalOnly: "vertical_only",
    HorizontalVertical: "horizontal_vertical",
    DiagonalOnly: "diagonal_only",
    DiagonalHorizontal: "diagonal_horizontal",
    DiagonalVertical: "diagonal_vertical",
    All: "all",
    MouseOver: "mouseover",
    Sleep: "sleep"
};
Object.freeze(AllowedMoves);

const Facing = {
    Left: 0,
    Right: 1,
};
Object.freeze(Facing);

const BehaviourOptionPosition = {
	  Name: 1,
	  Probability: 2,
	  MaxDuration: 3,
	  MinDuration: 4,
	  Speed: 5,
	  RightImagePath: 6,
	  LeftImagePath: 7,
	  MovementType: 8,
	  LinkedBehaviour: 9,
	  SpeakingStart: 10,
	  SpeakingEnd: 11,
	  Skip: 12,
	  Xcoord: 13,
	  Ycoord: 14,
	  ObjectToFollow: 15
};
Object.freeze(BehaviourOptionPosition);

const emptyBehaviour = {
    name: "",
    probability: 0.0,
    maxDuration: 0.0,
    minDuration: 0.0,
    Speed: 0.0,
    leftImage: null,
    rightImage: null,
    movement: AllowedMoves.None,
    linkedBehaviour: {},
    follow: ""
};


class PonyBehaviour {
    constructor(cols, path) {
        this.behaviour = JSON.parse(JSON.stringify(emptyBehaviour));
        this.behaviour.name = cols[BehaviourOptionPosition.Name].trim();
        this.behaviour.probability = parseFloat(cols[BehaviourOptionPosition.Probability].trim());
        this.behaviour.maxDuration = parseFloat(cols[BehaviourOptionPosition.MaxDuration].trim());
        this.behaviour.minDuration = parseFloat(cols[BehaviourOptionPosition.MinDuration].trim());
        this.behaviour.speed = parseFloat(cols[BehaviourOptionPosition.Speed].trim());
        this.behaviour.leftImage = Path.join(path, cols[BehaviourOptionPosition.LeftImagePath].trim()); // TODO: Why is this broken into parts when there are spaces in path?
        this.behaviour.rightImage = Path.join(path, cols[BehaviourOptionPosition.RightImagePath].trim());
        this.behaviour.movement = Object.keys(AllowedMoves).find( m => {
            return AllowedMoves[m] == cols[BehaviourOptionPosition.MovementType].toLowerCase();
        }) || AllowedMoves.None;
        this.behaviour.linkedBehaviour = this.maybeParseLinkedBehaviour(cols);
        this.behaviour.follow = this.maybeParseFollow(cols);
        this.currentlyFacing = Facing.Right;
        this.currentMovement = {x: 0, y:0};
        this.allowedMoves = this.reduceAllowedMoves(this.behaviour.movement);
    }

    get data() { return this.behaviour; }
    get movement() { return this.currentMovement; }
    get facing() { return this.currentlyFacing; }
    get name () { return this.behaviour.name; }
    get linked () { return this.behaviour.linkedBehaviour; }
    get speed () { return this.behaviour.speed; } // pixels per 100ms

    get speakLines ()
    {
        if (this.behaviour.linkedBehaviour) {
            return {
                entry:this.behaviour.linkedBehaviour.speakingStart,
                exit:this.behaviour.linkedBehaviour.speakingEnd,
            };
        } else {
            return null;
        }
    }
    
    get image () {
        if (this.facing == Facing.Right) {
            return this.behaviour.rightImage;
        } else {
            return this.behaviour.leftImage;
        }
    }

    get onlyVerticalMovement() {
        // if still, return 0;
        // if (this.movement.x == 0 && this.movement.y == 0) { return 0; }

        // else, return movement in direction pony is facing
        if(this.currentlyFacing == Facing.Left) {
            return -1;
        } else {
            return 1;
        }            
    };
    
    setMovement(currentPosition, screenBounds) {
        if (this.maybeSetDestinationMovement(currentPosition, screenBounds)) {
            // all set
        } else {
            this.setRandomFacing();
            this.setRandomMovement();            
        }
        return this.currentMovement;        
    }
    
    setRandomFacing() {
        let f = Facing.Left;
        if (0.5 > Math.random()) { f = Facing.Right; };
        this.currentlyFacing = f;
        return f;
    }

    setRandomMovement() {
        let newMovementDirection = this.allowedMoves[Math.floor(Math.random()*this.allowedMoves.size)];
        let newMovement = {x:0, y:0};
        newMovement.y = (Math.random()>0.5)?1:-1;
        if(this.currentlyFacing == Facing.Left) {
            newMovement.x = -1;
        } else {
            newMovement.x = 1;
        }

        if (newMovementDirection == AllowedMoves.VerticalOnly) { newMovement.x = 0; }
        if (newMovementDirection == AllowedMoves.HorizontalOnly) { newMovement.y = 0; }

        this.currentMovement = newMovement;
        return newMovement;
    }

    maybeSetDestinationMovement(position, screenBounds) {
        if (this.behaviour.linkedBehaviour &&
            (this.behaviour.linkedBehaviour.xcoord != 0 ||
             this.behaviour.linkedBehaviour.ycoord != 0)) {
            let destinationPos = {x:Math.floor(screenBounds.x*this.behaviour.linkedBehaviour.xcoord),
                                  y:Math.floor(screenBounds.y*this.behaviour.linkedBehaviour.ycoord)};
            let delta = {x:position.x - destinationPos.x,
                         y:position.y - destinationPos.y};
            let newMovement = {x:delta.x/Math.abs(delta.x),
                               y:delta.y/Math.abs(delta.y)};

            if (delta.x < 0) { this.currentlyFacing = Facing.left; };            
            this.currentMovement = newMovement;
            return newMovement;
        } else {
            return null;
        }
    }

    reduceAllowedMoves(moves) {
        let m = [];
        if ([AllowedMoves.None, AllowedMoves.MouseOver].includes(moves)) { return []; };
        if ([AllowedMoves.HorizontalOnly, AllowedMoves.VerticalHorizontal, AllowedMoves.DiagonalHorizontal, AllowedMoves.All].includes(moves)) { m.push(AllowedMoves.HorizontalOnly); };
        if ([AllowedMoves.VerticalOnly, AllowedMoves.VerticalHorizontal, AllowedMoves.DiagonalVertical, AllowedMoves.All].includes(moves)) { m.push(AllowedMoves.VerticalOnly); };
        if ([AllowedMoves.DiagonalOnly, AllowedMoves.DiagonalHorizontal, AllowedMoves.DiagonalVertical, AllowedMoves.All].includes(moves)) { m.push(AllowedMoves.DiagonalOnly); };
        return m;
    }
    
    maybeParseLinkedBehaviour(cols) {
        if (cols.length<=BehaviourOptionPosition.LinkedBehaviour) {
            return null;
        } else {
            if ('' === cols[BehaviourOptionPosition.LinkedBehaviour].trim()) { return null; }
            // console.log('Linked Behaviour %s from %s', cols[BehaviourOptionPosition.LinkedBehaviour].trim(), cols);            
            try {
                return {
                    name: cols[BehaviourOptionPosition.LinkedBehaviour].trim(),
                    speakingStart: cols[BehaviourOptionPosition.SpeakingStart].trim(), // Speaking is considered a "linked behaviour".
                    speakingEnd: cols[BehaviourOptionPosition.SpeakingEnd].trim(),
                    skip: cols[BehaviourOptionPosition.Skip].trim().toLowerCase()=='true',
                    xcoord: parseInt(cols[BehaviourOptionPosition.Xcoord].trim()), // Destination x and y, if we're supposed to be going places
                    ycoord: parseInt(cols[BehaviourOptionPosition.Ycoord].trim()) // 'x_coordinate (in % of screen width), 0 for not used 'y_coordinate (in % of screen height), 0 for not used

                };
            } catch (err) {
                // console.log("Malformed linked behaviour. Ignoring..."); // TODO be more explicit about what lines are being ignored.
                return null;
            };
        }
    }

    maybeParseFollow(cols) {
        if (cols.length<=BehaviourOptionPosition.ObjectToFollow) {
            return "";
        } else {
            try {
                return cols[BehaviourOptionPosition.ObjectToFollow].trim();
            } catch (err) {
                console.log("Malformed follow behaviour. Ignoring..."); // TODO be more explicit about what lines are being ignored.
                return "";                
            }
        }
    }
}

module.exports=PonyBehaviour;
