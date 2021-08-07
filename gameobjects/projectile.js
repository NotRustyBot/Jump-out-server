const {Vector} = require("./vector");
const {CollisionEvent, Shape} = require("./collision");
const {Area} = require("./area");
const {maxInteractionRange, flag} = require("./utility");



/**
 * @param {Vector} position
 * @param {number} level
 * @param {number} rotation
 * @param {Vector} velocity
 * @param {import("./ship").Ship|import("./entity").Entity} shooter
 * @param {number} type
 */
 function Projectile(position, level, rotation, velocity, shooter, type) {
    this.position = position.result();
    this.level = level;
    this.type = type;
    this.stats = Projectile.stats[type];
    this.rotation = rotation - this.stats.spread / 2 + Math.random() * this.stats.spread;
    this.time = this.stats.time;
    this.id = Projectile.nextId();
    this.shooter = shooter;

    this.velocity = Vector.fromAngle(this.rotation).normalize(this.stats.speed).add(velocity);

    if (this.stats.update) {
        this.update = this.stats.update;
    } else {
        this.update = function (dt) {
            if (this.time < 0) {
                Projectile.removed.push(this);
                Projectile.list.delete(this.id);
            } else {
                let nearby = Area.getLocalArea(this.position, this.level);
                if (!nearby) {
                    Projectile.removed.push(this);
                    Projectile.list.delete(this.id);
                    return;
                }

                /**
                 * @type {CollisionResult[]}
                 */
                let hits = [];
                nearby.entities.forEach(e => {

                    let vec = this.velocity.result().mult(dt);
                    if (e != this.shooter && flag(e.collisionPurpose, flag.CollisionFlags.projectile)) {
                        let relativePos = this.position.result();
                        relativePos.x -= e.position.x;
                        relativePos.y -= e.position.y;
                        if (relativePos.inbound(Math.abs(this.velocity.x) + Math.abs(this.velocity.y) + e.bounds / 2)) {
                            let collisionShape = new Shape().line(relativePos.x, relativePos.y, relativePos.x + vec.x, relativePos.y + vec.y);
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

                    if (hit.entity.damage) hit.entity.damage(this);

                    CollisionEvent.list.push(new CollisionEvent(this, hit.entity, hit, 1));
                    Projectile.removed.push(this);
                    Projectile.list.delete(this.id);
                }

                this.position.add(this.velocity.result().mult(dt));
                this.time -= dt;

            }
        }
    }

    Projectile.created.push(this);
    Projectile.list.set(this.id, this);
}

/**
 * @type {Map<number, Projectile>}
 */
Projectile.list = new Map();
Projectile.id = 0;
Projectile.nextId = function () {
    Projectile.id++;
    return Projectile.id;
}

/**
 * @type {import("./ship").Ship|Entity}
 */
Projectile.from = function (shooter, type) {
    return new Projectile(shooter.position, shooter.level, shooter.rotation, shooter.velocity, shooter, type);
}

Projectile.created = [];
Projectile.removed = [];

Projectile.stats = [
    { time: 0.5, speed: 9000, cooldown: 100, spread: 0.2, damage: 5 },
    { time: 1, speed: 4000, cooldown: 500, spread: 0.5, damage: 1 },
];

exports.Projectile = Projectile;