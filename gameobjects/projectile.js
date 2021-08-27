const {Vector} = require("./vector");
const {CollisionEvent, Shape} = require("./collision");
const {Area} = require("./area");
const {maxInteractionRange, flag, Raycast} = require("./universe");



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
                let result = Raycast(this.position, this.velocity.result().mult(dt), this.level, flag.CollisionFlags.projectile, [shooter]);
                if (result == undefined) {
                    Projectile.removed.push(this);
                    Projectile.list.delete(this.id);
                    return;
                }
                if(result.closest){
                    let hit = result.closest;
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