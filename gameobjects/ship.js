const { maxInteractionRange, flag, Universe } = require("./universe");
const { Action } = require("./action");
const { Vector } = require("./vector");
const { Area } = require("./area");
const { Entity } = require("./entity");
const { Inventory } = require("./inventory");
const { Shape, CollisionEvent } = require("./collision");
const { Building, Buildings } = require("./building");


/**
 * 
 * @param {import("./player").Player} player
 */
function Ship(player) {
    /**
     * @type {ShipType}
     */
    this.stats;
    this.position = new Vector(Universe.size * Area.size / 2, Universe.size * Area.size / 2);
    this.level = 0;
    this.velocity = new Vector(0, 0);
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.control = new Vector(0, 0);
    this.afterBurnerActive = 0;
    this.afterBurnerUsed = 0;
    this.afterBurnerFuel = 600;
    this.debuff = 0;
    /** @type {number} */
    this.hull = 100;
    this.action = 0;
    this.cooldowns = [];
    this.inventory;

    this.collider = [];
    this.collisionPurpose = flag.CollisionFlags.projectile;
    this.bounds = 0;
    this.rotatedColliderValid = false;
    this.noScan = true;
    this.noUpdate = true;

    /**
     * @type {Inventory}
     */
    this.inventory;
    /**
    * @type {Player}
    */
    this.player = player;

    /**
     * 
     * @param {ShipType} type 
     */
    this.init = function (type) {
        this.stats = type;
        this.collider.push(new Shape().circle(0, 0, this.stats.size));
        this.calculateBounds();
        Area.checkIn(this);
        for (let i = 0; i < type.actionPool.length; i++) {
            this.cooldowns[i] = 0;
        }

        this.inventory = new Inventory(this.stats.cargoCapacity, this.player.id, this.stats.inventory);
        Universe.scan(this.position, this.stats.radarRange, this.stats.radarRange, 0);
    };

    this.update = function (dt) {
        let stats = this.stats;
        let afterBurnerUsed = false;
        let gas = 0;

        if (this.level == 0) gas = Universe.getGas(this.position);

        if (this.debuff != gas) {
            if (this.debuff > gas) {
                this.debuff -= dt * 5;
                if (this.debuff < gas) {
                    this.debuff = gas;
                }
            } else {
                this.debuff += dt * 5;
                if (this.debuff > gas) {
                    this.debuff = gas;
                }
            }
        }

        let debuffMult = 1 - this.debuff / 110;

        if (this.afterBurnerFuel <= 0) {
            this.afterBurnerActive = 0;
        }


        if (this.control.x != 0) {
            // rotationace
            this.rotation += this.rotationSpeed * dt;
            this.rotationSpeed = (stats.rotationSpeed +
                this.afterBurnerActive * stats.afterBurnerRotationBonus) *
                this.control.x;
            afterBurnerUsed = true;
        } else if (this.rotationSpeed != 0) {
            this.rotation += this.rotationSpeed * dt;
            this.rotationSpeed = 0;
        }

        if (this.control.y != 0) {
            // zrychlení / brždění
            let pointing = Vector.fromAngle(this.rotation).mult(
                this.control.y
            );
            if (this.control.y > 0) {
                pointing.normalize(
                    stats.acceleration +
                    this.afterBurnerActive *
                    stats.afterBurnerAccelerationBonus
                );
            } else {
                pointing.normalize(
                    stats.reverseAccelreation +
                    this.afterBurnerActive *
                    stats.afterBurnerAccelerationBonus
                );
            }
            afterBurnerUsed = true;
            pointing.mult(dt);
            this.velocity.add(pointing);
        } else {
            if (this.velocity.length() < Ship.minSpeed) {
                this.velocity = Vector.zero();
            }
        }
        this.velocity.mult(1 - stats.drag * dt);

        let navBoost = 0;
        for (let i = 0; i < Building.navBeacons.length; i++) {
            const beacon = Building.navBeacons[i];
            if (beacon.level != this.level) {
                continue;
            }
            let diff = beacon.position.result().sub(this.position);

            if (diff.length() > Buildings.navBeacon._range) continue;

            let angle = Math.atan2(diff.y, diff.x);
            angle = Math.atan2(Math.sin(angle - this.rotation), Math.cos(angle - this.rotation))
            this.player.debug += "   Angle: " + angle.toFixed(2) + "\n";
            if (Math.abs(angle) < Buildings.navBeacon._angle / 2) {
                navBoost = Buildings.navBeacon._speedBonus;
                break;
            }
        }

        let absoluteLimit = stats.speed + stats.afterBurnerSpeedBonus + navBoost;
        if (this.velocity.length() > absoluteLimit) {
            this.velocity.normalize(absoluteLimit);
        }

        let targetSpeed = stats.speed * debuffMult + stats.afterBurnerSpeedBonus * this.afterBurnerActive * debuffMult + navBoost;
        let speed = this.velocity.length();
        if (speed > targetSpeed) {
            this.velocity.normalize(speed - stats.acceleration * dt - this.afterBurnerActive * stats.afterBurnerAccelerationBonus * dt);
            if (this.velocity.length() < targetSpeed) this.velocity.normalize(targetSpeed);
        }

        
        for (let i = 0; i < this.inventory.slots.length; i++) {
            this.player.debug += "      " + i + ": [" + this.inventory.slots[i].filter + "] " + this.inventory.slots[i].item.id + " x" + this.inventory.slots[i].item.stack + " / " + this.inventory.slots[i].capacity + "\n";
        }

        this.player.debug += "  Cargo: " + this.inventory.used + "/" + this.inventory.capacity;

        Area.moveMe(this, dt);
        this.afterBurnerUsed = 0;
        if (
            this.afterBurnerActive == 1 &&
            (afterBurnerUsed || this.velocity.length() > stats.speed * debuffMult)
        ) {
            this.afterBurnerFuel -= dt;
            this.afterBurnerFuel = Math.max(0, this.afterBurnerFuel);
            this.afterBurnerUsed = 1;
        }

        if (this.level == 0) {
            if (this.position.x < 0) {
                this.position.x = 0;
            }
            if (this.position.y < 0) {
                this.position.y = 0;
            }
            if (this.position.x > Universe.size * Area.size) {
                this.position.x = Universe.size * Area.size - 1;
            }
            if (this.position.y > Universe.size * Area.size) {
                this.position.y = Universe.size * Area.size - 1;
            }
        }

        this.handleAction(dt);
        this.checkCollision(dt);
        Universe.scan(this.position, this.stats.radarRange, speed, this.level);
    };
    /**
     * @param {Projectile} projectile
     */
    this.damage = function (projectile) {
        if (true) {
            this.hull -= projectile.stats.damage;
        }
    }

    this.handleAction = function (dt) {
        for (let i = 0; i < this.cooldowns.length; i++) {
            if (this.cooldowns[i] > 0) {
                this.cooldowns[i] -= dt;
            } else {
                this.cooldowns[i] = 0;
            }
        }

        let toHandle = this.player.actions;
        let replies = this.player.replies;

        for (let i = 0; i < toHandle.length; i++) {
            const a = toHandle[i];
            if (this.stats.actionPool[a.actionId] != undefined) {
                if (this.cooldowns[a.actionId] == 0) {
                    this.cooldowns[a.actionId] = this.stats.actionPool[a.actionId](this, a);
                    replies.push(a.reply());
                } else {
                    let reply = a.reply(2);
                    reply.time = this.cooldowns[a.actionId];
                    replies.push(reply);
                }
            } else {
                let reply = a.reply(1);
                replies.push(reply);
            }
        }
        this.player.actions = [];
    }

    this.checkCollision = function (dt) {
        let size = this.stats.size;
        let localArea = Area.getLocalArea(this.position, this.level);

        if (localArea != undefined) {
            for (let i = 0; i < localArea.entities.length; i++) {
                const e = localArea.entities[i];
                if (e == this) continue;
                if (!flag(e.collisionPurpose, flag.CollisionFlags.player)) {
                    if (flag(e.collisionPurpose, flag.CollisionFlags.pickup)) {
                        let relativePos = this.position.result();
                        relativePos.x -= e.position.x;
                        relativePos.y -= e.position.y;
                        let collisionShape = new Shape().circle(relativePos.x, relativePos.y, size);
                        let res;
                        e.rotatedCollider.forEach(s => {
                            res = collisionShape.checkCollision(s);
                            if (res.result) {
                                let left = this.inventory.addItem(e.item);
                                if (left > 0) {
                                    e.item.stack = left;
                                } else {
                                    Universe.unscan(e);
                                    e.delete();
                                }
                            }
                        });
                    }
                    continue;
                }
                let relativePos = this.position.result();
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
                        this.position.add(res.overlap);
                        res.overlap.normalize();
                        res.overlap.mult(-Math.min(Vector.dot(res.overlap, this.velocity), 0) * 2);
                        this.velocity.add(res.overlap);
                        this.velocity.mult(0.8);
                        relativePos = this.position.result();
                        relativePos.x -= e.position.x;
                        relativePos.y -= e.position.y;
                        collisionShape.x = relativePos.x;
                        collisionShape.y = relativePos.y;
                        CollisionEvent.list.push(new CollisionEvent(this, e, res, 0));
                    }
                });
            }
        }
    }

    this.calculateBounds = function () {
        this.collider.forEach(s => {
            let dist = 0;
            if (s.type == 2) {
                dist = Math.max(new Vector(s.x1, s.y1).length(), new Vector(s.x2, s.y2).length());
            } else {
                dist = new Vector(s.x, s.y).length() + s.r;
            }
            this.bounds = Math.max(dist, this.bounds);
        });

        this.bounds += maxInteractionRange;
    }

    this.rotateCollider = function () {
        this.rotatedCollider = [];
        this.collider.forEach(s => {
            let r = s.copy();
            r.rotate(this.rotation);
            this.rotatedCollider.push(r);
        });
        this.rotatedColliderValid = true;
    }
}

Ship.minSpeed = 0.2;
exports.Ship = Ship;

function ShipType() {
    this.name;
    this.speed;
    this.acceleration;
    this.reverseAccelreation;
    this.rotationSpeed;
    this.afterBurnerBonus;
    this.afterBurnerCapacity;
    this.cargoCapacity;
    this.drag;
    this.actionPool = [];
    this.size;
    this.trails;
}

ShipType.types = [];
ShipType.initTypes = function () {

    let fuelShip = new ShipType();
    fuelShip.name = "fuel";
    fuelShip.size = 200;
    fuelShip.speed = 1000;
    fuelShip.acceleration = 100;
    fuelShip.reverseAccelreation = 50;
    fuelShip.rotationSpeed = 1;
    fuelShip.afterBurnerSpeedBonus = 1000;
    fuelShip.afterBurnerRotationBonus = 1;
    fuelShip.afterBurnerAccelerationBonus = 100;
    fuelShip.afterBurnerCapacity = 600;
    fuelShip.cargoCapacity = 30;
    fuelShip.inventory = [{ unique: true, capacity: 15, filter: 0 }, { unique: true, capacity: 15, filter: 1 }, { unique: true, capacity: 15, filter: 2 }, { unique: true, capacity: 50, filter: 3 }, { unique: false }, { unique: false }, { unique: false }, { unique: false }, { unique: false }, { unique: false }, { unique: false }, { unique: false }, { unique: false }],
        fuelShip.drag = 0.05;
    fuelShip.actionPool = [Action.buildTest, Action.MineRock, Action.DropItem, Action.SwapSlots, Action.CreateMarker];
    fuelShip.radarRange = 14000;
    fuelShip.trails = [
        {
            x: -180,
            y: -72,
            useTrail: true
        },
        {
            x: -180,
            y: 72,
            useTrail: true
        },
        {
            x: -127,
            y: -124,
            useTrail: true
        },
        {
            x: -127,
            y: 124,
            useTrail: true
        },
        {
            x: 55,
            y: -112,
            useTrail: false
        },
        {
            x: 55,
            y: 112,
            useTrail: false
        },

    ];
    fuelShip.spriteSize = 1.9;
    ShipType.types[100] = fuelShip;

    let debugShip = new ShipType();
    debugShip.name = "debug";
    debugShip.size = 125;
    debugShip.speed = 1000;
    debugShip.acceleration = 600;
    debugShip.reverseAccelreation = 300;
    debugShip.rotationSpeed = 3;
    debugShip.afterBurnerSpeedBonus = 1000;
    debugShip.afterBurnerRotationBonus = 1;
    debugShip.afterBurnerAccelerationBonus = 800;
    debugShip.afterBurnerCapacity = 600;
    debugShip.cargoCapacity = 30;
    debugShip.inventory = [{ unique: true, capacity: 15, filter: 1 }, { unique: false }, { unique: false }],
        debugShip.drag = 0.5;
    debugShip.actionPool = [Action.buildTest, Action.MineRock, Action.DropItem, Action.SwapSlots, Action.CreateMarker, Action.Shoot, Action.LevelMove, Action.Interact];
    debugShip.radarRange = 14000;
    debugShip.trails = [
        {
            x: -90,
            y: 0,
            useTrail: true
        },
    ];
    debugShip.spriteSize = 1;
    ShipType.types[0] = debugShip;

    let hackerShip = new ShipType();
    hackerShip.name = "hacker";
    hackerShip.size = 180;
    hackerShip.speed = 1000;
    hackerShip.acceleration = 600;
    hackerShip.reverseAccelreation = 300;
    hackerShip.rotationSpeed = 3;
    hackerShip.afterBurnerSpeedBonus = 1000;
    hackerShip.afterBurnerRotationBonus = 1;
    hackerShip.afterBurnerAccelerationBonus = 800;
    hackerShip.afterBurnerCapacity = 600;
    hackerShip.cargoCapacity = 30;
    hackerShip.inventory = [{ unique: true, capacity: 15, filter: 0 }, { unique: true, capacity: 3, filter: 1 }, { unique: false }, { unique: false }],
        hackerShip.drag = 0.5;
    hackerShip.actionPool = [Action.buildTest, Action.MineRock, Action.DropItem, Action.SwapSlots, Action.CreateMarker];
    hackerShip.radarRange = 14000;
    hackerShip.trails = [
        {
            x: -120,
            y: -20,
            useTrail: true
        },
        {
            x: -120,
            y: 20,
            useTrail: true
        },
    ];
    hackerShip.spriteSize = 1.6;
    ShipType.types[1] = hackerShip;

}

exports.ShipType = ShipType;