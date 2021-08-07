const { Area } = require("./area");
const { Shape } = require("./collision");


const maxInteractionRange = 600 + 60; //max resource size

exports.maxInteractionRange = maxInteractionRange;

function flag(source, flag) {
    return (source & flag) == flag;
}

flag.CollisionFlags = {
    player: 1,
    projectile: 2,
    pickup: 4,
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
