const { Area } = require("./area");
const { Shape } = require("./collision");
const { Vector } = require("./vector");


const maxInteractionRange = 600 + 60; //max resource size

exports.maxInteractionRange = maxInteractionRange;

function flag(source, flag) {
    return (source & flag) == flag;
}

flag.CollisionFlags = {
    player: 1,
    projectile: 2,
    pickup: 4,

    any: 0
}

exports.flag = flag;


function isAvalible(position, level, size) {
    let out = true;
    let localArea = Area.getLocalArea(position, level);

    if (localArea != undefined) {
        for (let i = 0; i < localArea.entities.length; i++) {
            const e = localArea.entities[i];
            let relativePos = position.result();
            relativePos.x -= e.position.x;
            relativePos.y -= e.position.y;
            let collisionShape = new Shape().circle(relativePos.x, relativePos.y, size);
            let res;
            if (!e.rotatedColliderValid) {
                e.rotateCollider();
            }

            e.rotatedCollider.forEach(s => {
                res = collisionShape.checkCollision(s);
                if (res.result) {
                    out = false;
                    return;
                }
            });
        }
    }

    /*
    let collisionShape = new Shape().circle(position.x, position.y, size);
    Player.players.forEach(p => {
        let s = new Shape().circle(p.ship.position.x, p.ship.position.y, p.ship.stats.size);
        res = collisionShape.checkCollision(s);
        if (res.result) {
            out = false;
            return;
        }
    });*/

    return out;
}

exports.isAvalible = isAvalible;

/**
 * 
 * @param {Vector} position 
 * @param {Vector} vector 
 */
function LocalRay(position, vector, level, flags, ignore){
    ignore = ignore || [];
    let nearby = Area.getLocalArea(position, level);
    if (!nearby) {
        return undefined;
    }

    /**
     * @type {CollisionResult[]}
     */
    let hits = [];
    nearby.entities.forEach(e => {

        if (!ignore.includes(e) && flag(e.collisionPurpose, flags)) {
            let relativePos = position.result();
            relativePos.x -= e.position.x;
            relativePos.y -= e.position.y;
            if (relativePos.inbound(Math.abs(vector.x) + Math.abs(vector.y) + e.bounds / 2)) {
                let collisionShape = new Shape().line(relativePos.x, relativePos.y, relativePos.x + vector.x, relativePos.y + vector.y);
                let res;
                if (!e.rotatedColliderValid) {
                    e.rotateCollider();
                }
                e.rotatedCollider.forEach(s => {
                    res = collisionShape.checkCollision(s);
                    if (res.result) {
                        res.entity = e;
                        res.relative = relativePos;
                        hits.push(res);
                    }
                });
            }
        }
    });

    if (hits.length > 0) {
        let closest = maxInteractionRange;
        let hit = hits[0];
        hits.forEach(h => {
            let dist = (h.relative.sub(h.position)).length();
            if (dist < closest) {
                hit = h;
                closest = dist;
            }
        });
        return {closest: hit, hits: hits};
    }
    return {closest: undefined, hits: undefined};
}

exports.LocalRay = LocalRay;