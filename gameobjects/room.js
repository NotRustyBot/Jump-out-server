const {Area} = require("./area");
const {Vector} = require("./vector");
const {Mobile} = require("./mobile");
const {Interactable} = require("./interactable");
const {Shape} = require("./collision");
const {Entity} = require("./entity");
const {ItemDrop, Item} = require("./inventory");
const {Player} = require("./player");
const {Projectile} = require("./projectile");
const {maxInteractionRange, flag, LocalRay} = require("./utility");



const fs = require("fs");

function Room(position, level, rotation, type) {
    this.position = position;
    this.level = level;
    this.rotation = rotation;
    this.type = type;
    this.stats = Room.stats[this.type];
    this.noScan = true;
    this.noUpdate = true;

    this.collisionPurpose = flag.CollisionFlags.player + flag.CollisionFlags.projectile;
    this.rotatedCollider = [];
    this.rotatedColliderValid = false;

    this.init = function () {
        this.colliderFromFile("hitboxes/rooms/" + this.stats.hitbox);
        this.rotateCollider();
        Area.checkIn(this, this.level);
        if (this.stats.setup) {
            this.stats.setup(this);
        }

    };

    this.colliderFromFile = function (file) {
        this.collider = [];
        this.bounds = 0;
        let str = fs.readFileSync(file, "utf8");
        let shapes = JSON.parse(str);
        shapes.forEach(s => {
            let shape;
            let dist = 0;
            if (s.type == 2) {
                shape = new Shape().line(s.x1, s.y1, s.x2, s.y2);
                dist = Math.max(new Vector(s.x1, s.y1).length(), new Vector(s.x2, s.y2).length());
            } else {
                shape = new Shape().circle(s.x, s.y, s.r);
                dist = new Vector(s.x, s.y).length() + s.r;
            }
            this.bounds = Math.max(dist, this.bounds);
            this.collider.push(shape);
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

    /**
     * @param {Vector} vector
     */
    this.toGlobal = function (vector) {
        let angle = vector.toAngle();
        let global = Vector.fromAngle(angle + this.rotation).normalize(vector.length());
        global.add(this.position);
        return global;
    }
}

Room.list = [];

Room.stats = [
    { hitbox: "room-0u.json", },
    {
        hitbox: "room-0i.json", setup:/**@param {Room} room */ function (room) {
            let pos = room.toGlobal(new Vector(2000, -2000));
            let guard = new Mobile(pos.x, pos.y, 20, room.level);
            guard.collider.push(new Shape().circle(0, 0, 125));
            guard.calculateBounds();
            guard.collisionPurpose = flag.CollisionFlags.projectile;
            guard.hull = 100;
            guard.damage = function(projectile){
                guard.hull -= projectile.stats.damage;
                if (guard.hull <= 0) {
                    guard.delete();
                }
            }
            guard.init();
            guard.control = function (dt) {
                if (!this.ready) {
                    this.startPos = this.position.result();
                    this.cooldown = 0;
                    this.projectileType = 1;
                    this.ready = true;
                }

                let closest = 5000;
                let target = undefined;
                Player.players.forEach(p => {
                    let dist = p.ship.position.distance(this.position);
                    let relative = this.position.result().sub(p.ship.position);
                    if (dist < 5000) {
                        let result = LocalRay(this.position, relative);
                        if (result != undefined) {
                            if(result.hits.includes(p.ship)){
                                target = p.ship;
                            }
                        }
                    }
                });
                if (target != undefined) {
                    this.cooldown -= dt;
                    if (this.cooldown < 0) {
                        this.cooldown = Projectile.stats[this.projectileType].cooldown / 1000;
                        for (let index = 0; index < 5; index++) {
                            Projectile.from(this, this.projectileType);
                        }
                    }
                    this.rotation = target.position.result().sub(this.position).toAngle();
                }
            }
        }
    },
    { hitbox: "room-0t.json", },
    { hitbox: "room-0x.json", },
    {
        hitbox: "room-0main.json",setup:/**@param {Room} room */ function (room) {
            let pos = room.toGlobal(new Vector(0, 0));
            let item = new ItemDrop(pos, new Item(5, 10), pos, room.level);
            item.init();
        }
    },
];

Room.arrange = function (entry, level, angle) {
    let rooms = [
        [0, 0, 0, 0, 0],
        [0, 1, 3, 5, 0],
        [0, 0, 2, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0],
    ];

    let rotation = [
        [0, 0, 0, 0, 0],
        [0, 3, 0, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 2, 0, 0],
        [0, 0, 0, 0, 0],
    ];

    let traps = [
        [0, 0, 0, 0, 0],
        [0, 2, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0],
    ];

    let enterRoom = new Vector(2, 3);

    let hardcode = {
        /** @param {Room} room */
        1:  function (room) {
            let controlPos = room.toGlobal(new Vector(-1000, -2500));
            let doorControl = new Interactable(controlPos, room.level, 500);
            let doorPos = room.toGlobal(new Vector(0, 3050));
            let door = new Entity(doorPos.x, doorPos.y, 6, room.level);
            door.colliderFromFile("hitboxes/rooms/door.json");
            door.rotation = room.rotation;
            door.collisionPurpose = flag.CollisionFlags.player + flag.CollisionFlags.projectile;
            door.init();
            door.noScan = true;
            door.move = 1;
            door.enabled = false;
            door.update = function (dt) {
                this.bytesValid = false;
                this.rotatedColliderValid = false;
                this.rotation += this.rotationSpeed * dt;
                this.rotation = this.rotation % (Math.PI * 2);
                if (this.enabled) {
                    if (this.move > 0) {
                        this.move -= dt;
                        this.position.add(this.velocity.result().mult(dt));
                    }else{
                        this.velocity = 0;
                    }
                }
            }
            doorControl.activate = function(ship, option){
                if (door.enabled) return;
                door.enabled = true;
                let doorOpenPos = room.toGlobal(new Vector(-1000, 3050));
                door.velocity = doorOpenPos.sub(door.position);
            }
        },
        2: function (room) {
            let controlPos = room.toGlobal(new Vector(0, -2500));
            let restartServer = new Interactable(controlPos, room.level, 500);
            restartServer.activate = function(ship, option){
                throw 'restarting';
            }
        }
    };

    for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
            if (rooms[y][x] != 0) {
                let roomPosition = new Vector((x - enterRoom.x) * 6000, (y - enterRoom.y) * 6000);
                let roomAngle = roomPosition.toAngle();
                roomAngle += angle;
                roomPosition = Vector.fromAngle(roomAngle).normalize(roomPosition.length());
                let room = new Room(roomPosition, level, rotation[y][x] * Math.PI / 2 + angle, rooms[y][x] - 1);
                if (traps[y][x] != 0) {
                    hardcode[traps[y][x]](room);
                }
                Room.list.push(room);
                room.init();
            }
        }
    }
}

exports.Room = Room