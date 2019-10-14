"use strict";

const Path=require('path');

const EffectOptionPosition = {
    Name: 1,
    Behaviour: 2,
    RightImagePath: 3,
    LeftImagePath: 4,
    Duration: 5,
    Delay: 6,
    LocationRight: 7,
    CenterRight: 8,
    LocationLeft: 9,
    CenterLeft: 10,
    FollowPony: 11
};
Object.freeze(EffectOptionPosition);

const Directions = {
    Top: "top",
		Bottom: "bottom",
		Left: "left",
		Right: "right",
		BottomRight: "bottom_right",
		BottomLeft: "bottom_left",
		TopRight: "top_right",
		TopLeft: "top_left",
		Center: "center",
		Random: "any",
		RandomNotCenter: "any_not_center"
};
Object.freeze(Directions);

const emptyEffect = {
    name: "",
    behaviour: "",
    rightImage: null,
    leftImage: null,
    duration: 0.0,
    delay: 0.0,
    locationRight: Directions.Center,
    centerRight: Directions.Center,
    locationLeft: Directions.Center,
    centerLeft: Directions.Center,
    followPony: false,
};


class PonyEffect {
    constructor(cols, path) {
        this.effect = JSON.parse(JSON.stringify(emptyEffect));
        this.effect.name = cols[EffectOptionPosition.Name].trim();
        this.effect.behaviour = cols[EffectOptionPosition.Behaviour].trim();
        this.effect.locationRight = this.parseDirection(cols[EffectOptionPosition.LocationRight].trim());
        this.effect.centerRight = this.parseDirection(cols[EffectOptionPosition.CenterRight].trim());
        this.effect.locationLeft = this.parseDirection(cols[EffectOptionPosition.LocationLeft].trim());
        this.effect.centerLeft = this.parseDirection(cols[EffectOptionPosition.CenterLeft].trim());

        this.effect.rightImage = Path.join(path, cols[EffectOptionPosition.RightImagePath].trim());
        this.effect.leftImage = Path.join(path, cols[EffectOptionPosition.LeftImagePath].trim());
    }

    parseDirection(dir) {
        return Object.keys(Directions).find( e => Directions[e] == dir );
    }
}

module.exports=PonyEffect;
