const { Datagram, Datagrams, AutoView, serverHeaders, clientHeaders, SmartActionData, ActionId, ReplyData, init } = require("./datagram.js");
const fs = require('fs');
const { gasBuffer } = require("./worldgen.js");

exports.Datagram = Datagram;
exports.Datagrams = Datagrams;
exports.AutoView = AutoView;
exports.serverHeaders = serverHeaders;
exports.clientHeaders = clientHeaders;
exports.SmartActionData = SmartActionData;
exports.ActionId = ActionId;
exports.ReplyData  = ReplyData;

//#region věci
/**
 * 
 * @param {number} x 
 * @param {number} y 
 */
function Vector(x, y) {
    this.x = x;
    this.y = y;

    this.length = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };

    this.distance = function (vector) {
        let v = new Vector(
            Math.abs(this.x - vector.x),
            Math.abs(this.y - vector.y)
        );
        return v.length();
    };

    this.add = function (vector) {
        this.x = this.x + vector.x;
        this.y = this.y + vector.y;
        return this;
    };

    this.sub = function (vector) {
        this.x = this.x - vector.x;
        this.y = this.y - vector.y;
        return this;
    };

    this.mult = function (magnitude) {
        this.x = this.x * magnitude;
        this.y = this.y * magnitude;
        return this;
    };

    this.normalize = function (length) {
        length = length || 1;
        let total = this.length();
        this.x = (this.x / total) * length;
        this.y = (this.y / total) * length;
        return this;
    };

    this.toAngle = function () {
        return Math.atan2(this.y, this.x);
    };

    this.result = function () {
        return new Vector(this.x, this.y);
    };

    this.inbound = function (bound) {
        return this.x < bound && this.x > -bound && this.y < bound && this.y > -bound
    }
}
Vector.fromAngle = function (r) {
    return new Vector(Math.cos(r), Math.sin(r));
};
Vector.cross = function (v1, v2) {
    return v1.x * v2.y - v1.y * v2.x;
};
Vector.dot = function (v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
};
Vector.sub = function (v1, v2) {
    return new Vector(v1.x - v2.x, v1.y - v2.y);
};
Vector.zero = function () {
    return new Vector(0, 0);
};

exports.Vector = Vector;
init(Vector);

function Area(x, y) {
    this.coordinates = new Vector(x, y);
    this.position = new Vector(Area.size * x, Area.size * y);
    /**
     * @type {Entity[]}
     */
    this.entities = [];
}
Area.size = 5000;
/**
 * @type {Area[][]}
 */
Area.list = [];
/**
 * 
 * @param {Entity} entity 
 */
Area.checkIn = function (entity) {
    let position = entity.position;
    let x = Math.floor((position.x + entity.bounds) / Area.size);
    let y = Math.floor((position.y + entity.bounds) / Area.size);
    let area = Area.list[x][y];
    area.entities.push(entity);

    position = entity.position;
    x = Math.floor((position.x - entity.bounds) / Area.size);
    y = Math.floor((position.y + entity.bounds) / Area.size);
    area = Area.list[x][y];

    if (!area.entities.includes(entity)) {
        area.entities.push(entity);
    }

    position = entity.position;
    x = Math.floor((position.x + entity.bounds) / Area.size);
    y = Math.floor((position.y - entity.bounds) / Area.size);
    area = Area.list[x][y];

    if (!area.entities.includes(entity)) {
        area.entities.push(entity);
    }

    position = entity.position;
    x = Math.floor((position.x - entity.bounds) / Area.size);
    y = Math.floor((position.y - entity.bounds) / Area.size);
    area = Area.list[x][y];

    if (!area.entities.includes(entity)) {
        area.entities.push(entity);
    }
};

/**
 * 
 * @param {Entity} entity 
 */
Area.checkOut = function (entity) {
    let position = entity.position;
    let x = Math.floor((position.x + entity.bounds) / Area.size);
    let y = Math.floor((position.y + entity.bounds) / Area.size);
    let area = Area.list[x][y];
    if (area.entities.includes(entity)) {
        area.entities.splice(area.entities.indexOf(entity),1);
    }

    position = entity.position;
    x = Math.floor((position.x - entity.bounds) / Area.size);
    y = Math.floor((position.y + entity.bounds) / Area.size);
    area = Area.list[x][y];

    if (area.entities.includes(entity)) {
        area.entities.splice(area.entities.indexOf(entity),1);
    }

    position = entity.position;
    x = Math.floor((position.x + entity.bounds) / Area.size);
    y = Math.floor((position.y - entity.bounds) / Area.size);
    area = Area.list[x][y];

    if (area.entities.includes(entity)) {
        area.entities.splice(area.entities.indexOf(entity),1);
    }

    position = entity.position;
    x = Math.floor((position.x - entity.bounds) / Area.size);
    y = Math.floor((position.y - entity.bounds) / Area.size);
    area = Area.list[x][y];

    if (area.entities.includes(entity)) {
        area.entities.splice(area.entities.indexOf(entity),1);
    }
};


/**
 * 
 * @param {Mobile} mobile 
 */
Area.moveMe = function (mobile) {
    let position = mobile.position;
    let newPosition = position.result().add(mobile.velocity);
    let x = Math.floor((position.x + mobile.bounds) / Area.size);
    let y = Math.floor((position.y + mobile.bounds) / Area.size);
    let nx = Math.floor((newPosition.x + mobile.bounds) / Area.size);
    let ny = Math.floor((newPosition.y + mobile.bounds) / Area.size);

    if (x == nx && y == ny) {
        mobile.position = newPosition;
        x = Math.floor((position.x - mobile.bounds) / Area.size);
        y = Math.floor((position.y + mobile.bounds) / Area.size);
        nx = Math.floor((newPosition.x - mobile.bounds) / Area.size);
        ny = Math.floor((newPosition.y + mobile.bounds) / Area.size);
        if (x == nx && y == ny) {
            mobile.position = newPosition;
            x = Math.floor((position.x + mobile.bounds) / Area.size);
            y = Math.floor((position.y - mobile.bounds) / Area.size);
            nx = Math.floor((newPosition.x + mobile.bounds) / Area.size);
            ny = Math.floor((newPosition.y - mobile.bounds) / Area.size);
            if (x == nx && y == ny) {
                mobile.position = newPosition;
                x = Math.floor((position.x - mobile.bounds) / Area.size);
                y = Math.floor((position.y - mobile.bounds) / Area.size);
                nx = Math.floor((newPosition.x - mobile.bounds) / Area.size);
                ny = Math.floor((newPosition.y - mobile.bounds) / Area.size);
                if (x == nx && y == ny) {
                    return;
                }
            }
        }
    }

    Area.checkOut(mobile);
    mobile.position = newPosition;
    Area.checkIn(mobile);

};

exports.Area = Area;

/**
 * 
 * @param {Vector} position 
 * @returns {Area}
 */
Area.getLocalArea = function (position) {
    let x = Math.floor(position.x / Area.size);
    let y = Math.floor(position.y / Area.size);

    if (Area.list[x] != undefined && Area.list[x][y] != undefined) {
        return Area.list[x][y];
    }
}

let Universe = {};
Universe.size = 80; // area v jedné ose

/**
 * 
 * @param {Vector} vector position to check
 */
Universe.getGas = function (vector) {
    let x = Math.floor(vector.x / Universe.scale);
    let y = Math.floor(vector.y / Universe.scale);
    if (isNaN(x) || isNaN(y)) {
        return 0;
    }
    return Math.min(Universe.gasMap[x][y], 100);
}

/**
 * 
 * @param {Vector} position 
 * @param {number} value 
 */
Universe.setGas = function(position, value){
    let x = Math.floor(position.x / Universe.scale);
    let y = Math.floor(position.y / Universe.scale);
    Universe.gasMap[x][y] = value;

    Universe.gasChange.push({position: new Vector(x,y), value: value});
    let view = new DataView(Universe.gasBuffer);
    view.setInt8(7+x*1000+y, value);
    
}

Universe.gasChange = [];

exports.Universe = Universe;

for (let x = 0; x < Universe.size; x++) {
    Area.list[x] = [];
    for (let y = 0; y < Universe.size; y++) {
        Area.list[x][y] = new Area(x, y);
    }
}

/**
 * 
 * @param {bool} result 
 * @param {Vector} position 
 * @param {Vector} overlap 
 */
function CollisionResult(result, position, overlap) {
    this.result = result;
    if (result) {
        this.position = position;
        this.overlap = overlap;
    }
}

/**
 * 
 * @param {Ship} ship 
 * @param {Entity} entity 
 * @param {CollisionResult} result 
 */
function CollisionEvent(ship, entity, result) {
    this.shipId = ship.id;
    this.entityId = entity.id;
    this.position = result.position.result().add(ship.position);
}
CollisionEvent.list = [];

exports.CollisionEvent = CollisionEvent;

function Shape() {
    this.circle = function (x, y, r) {
        this.line = undefined;
        this.type = Shape.types.circle;
        this.x = x;
        this.y = y;
        this.r = r;

        this.checkCollision = function (shape) {
            if (shape.type == Shape.types.circle) {
                // vrátí vektor o ktery se staci posunout, aby se hrac dostal mimo prekazku

                let relativ = new Vector(
                    shape.x - this.x,
                    shape.y - this.y
                );
                let distance = relativ.length();
                if (distance < shape.r + this.r) {
                    let result = relativ.normalize(distance - shape.r - this.r);
                    return new CollisionResult(true, new Vector(this.x, this.y).sub((new Vector(result.x, result.y)).normalize(this.r)), result);
                } else {
                    return new CollisionResult(false);
                }
            } else if (shape.type == Shape.types.line) {
                // vrátí vektor o ktery se staci posunout, aby se hrac dostal mimo prekazku

                let cara = new Vector(shape.x2 - shape.x1, shape.y2 - shape.y1);
                let v = new Vector(this.x - shape.x1, this.y - shape.y1);
                let normCara = new Vector(cara.x, cara.y);
                normCara.normalize(1);
                a = Vector.dot(normCara, v);
                let C;
                if (a < 0) {
                    C = new Vector(shape.x1, shape.y1);
                } else if (a > cara.length()) {
                    C = new Vector(shape.x2, shape.y2);
                } else {
                    C = (normCara.mult(a)).add(new Vector(shape.x1, shape.y1));
                }
                C.sub(new Vector(this.x, this.y));
                let Clen = C.length();
                if (Clen > this.r) {
                    return new CollisionResult(false);
                } else {
                    let result = C.normalize(Clen - this.r);
                    return new CollisionResult(true, new Vector(this.x, this.y).sub((new Vector(result.x, result.y)).normalize(this.r)), result);
                }
            }
        };
        this.rotate = function (angle) {
            let sin = Math.sin(angle);
            let cos = Math.cos(angle);
            let x = this.x;
            let y = this.y;
            this.x = x * cos - y * sin;
            this.y = x * sin + y * cos;
        }
        this.copy = function () {
            return new Shape().circle(this.x, this.y, this.r);
        }
        return this;
    };

    this.line = function (x1, y1, x2, y2) {
        this.circle = undefined;
        this.type = Shape.types.line;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;

        this.checkCollision = function (shape) {
            if (shape.type == Shape.types.circle) {
                // vrátí bod lezici na kruznici nejblize pocatku primky

                let d = new Vector(this.x2 - this.x1, this.y2 - this.y1);
                let f = new Vector(this.x1 - shape.x, this.y1 - shape.y);

                let a = Vector.dot(d, d);
                let b = 2 * Vector.dot(d, f);
                let c = Vector.dot(f, f) - shape.r * shape.r;
                let discriminant = b * b - 4 * a * c;
                if (discriminant < 0) {
                    return new CollisionResult(false);
                }
                discriminant = Math.sqrt(discriminant);

                let t1 = (-b - discriminant) / (2 * a);
                let t2 = (-b + discriminant) / (2 * a);

                if (t1 < 0) {
                    t1 = 2;
                }
                if (t2 < 0) {
                    t2 = 2;
                }
                t1 = Math.min(t1, t2);
                if (t1 > 1) {
                    return new CollisionResult(false);
                } else {
                    return new CollisionResult(true, (new Vector(this.x1, this.y1)).add(d.mult(t1)));
                }

            } else if (shape.type == Shape.types.line) {
                // vrátí průsečík dvou úseček nebo false

                a = new Vector(this.x1, this.y1);
                a_ = new Vector(this.x2 - this.x1, this.y2 - this.y1);
                b = new Vector(shape.x1, shape.y1);
                b_ = new Vector(shape.x2 - shape.x1, shape.y2 - shape.y1);
                let a_crossb_ = Vector.cross(a_, b_);
                if (a_crossb_ == 0) { // dvě přímky jsou rovnoběžné
                    return new CollisionResult(false);
                }
                t = Vector.cross(Vector.sub(b, a), b_) / a_crossb_;
                u = Vector.cross(Vector.sub(b, a), a_) / a_crossb_;

                if (t < 0 || t > 1 || u < 0 || u > 1) {
                    return new CollisionResult(false);
                } else {
                    a.add(a_.mult(t));
                    return new CollisionResult(true, a, null);
                }
            }
        };
        this.rotate = function (angle) {
            let sin = Math.sin(angle);
            let cos = Math.cos(angle);
            let x1 = this.x1;
            let y1 = this.y1;
            let x2 = this.x2;
            let y2 = this.y2;
            this.x1 = x1 * cos - y1 * sin;
            this.y1 = x1 * sin + y1 * cos;
            this.x2 = x2 * cos - y2 * sin;
            this.y2 = x2 * sin + y2 * cos;
        }

        this.copy = function () {
            return new Shape().line(this.x1, this.y1, this.x2, this.y2);
        }

        return this;
    };
}
Shape.types = { circle: 1, line: 2 };
exports.Shape = Shape;


/**
 * 
 * @param {number} x 
 * @param {number} y 
 * @param {number} type 
 */
function Entity(x, y, type) {
    this.position = new Vector(x, y);
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.collisionPurpose = 0;
    this.type = type;
    this.rotatedCollider = [];
    this.rotatedColliderValid = false;
    this.bytes;
    this.bytesValid = false;
    /**
     * @type {Shape[]}
     */
    this.collider = [];
    this.bounds = 0;

    this.init = function () {
        this.id = Entity.next_id;
        Entity.next_id++;
        Entity.list.push(this);
        Area.checkIn(this);
    }

    this.delete = function () {
        Entity.remove.push(this.id);
        Area.checkOut(this);
        Entity.list.splice(Entity.list.indexOf(this), 1);
    }

    /**
     * 
     * @param {AutoView} inView 
     */
    this.serialize = function(inView){
        inView.serialize(this, Datagrams.EntitySetup);
        return;
        if (this.bytesValid) {
            bytes.copy(inView.view.buffer, inView.index, 0,bytes.length);
            inView.index += bytes.length;
        }else{
            let index = inView.index;
            inView.serialize(this, Datagrams.EntitySetup);
            bytes = inView.view.buffer.slice(index);
        }
    }

    this.update = function (dt) {
        this.bytesValid = false;
        this.rotatedColliderValid = false;
        this.rotation += this.rotationSpeed * dt;
        this.rotation = this.rotation % (Math.PI * 2);

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

    this.colliderFromFile = function (file) {
        this.collider = [];
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
}

Entity.list = [];
Entity.next_id = 0;
Entity.create = [];
Entity.remove = [];



Entity.CollisionFlags = {
    player: 1,
    projectile: 2,
    pickup: 4,
}

exports.Entity = Entity;


const maxInteractionRange = 600 + 60; //max resource size

function Mobile(x, y, type) {
    Entity.call(this, x, y, type);
    this.velocity = new Vector(0, 0);
    this.timer = 0;
    this.control = function (dt) { };
    this.update = function (dt) {
        this.rotatedColliderValid = false;
        this.timer++;
        this.timer = this.timer % 100;
        this.control(dt);
        Area.moveMe(this);
        this.position.add(this.velocity.result().mult(dt));

        this.rotation += this.rotationSpeed * dt;
        this.rotation = this.rotation % (Math.PI * 2);
    }
}

function Building(x, y, type) {
    Entity.call(this, x, y, type);
    this.control = function (dt) {}
    this.update = function (dt) {
        this.rotatedColliderValid = false;
        this.control(dt);

        this.rotation += this.rotationSpeed * dt;
        this.rotation = this.rotation % (Math.PI * 2);
    }
    this.setup = function () { 
        this.init();
    }
}



process.env.HOLOUBCI = process.env.HOLOUBCI || 0;
for (let index = 0; index < parseInt(process.env.HOLOUBCI); index++) {
    let m1 = new Mobile(Universe.size * Area.size / 2 + 2000, Universe.size * Area.size / 2, 3);
    m1.collider.push(new Shape().circle(0, 0, 125));
    m1.calculateBounds();
    m1.collisionPurpose = Entity.CollisionFlags.projectile;
    m1.init();
    m1.control = function (dt) {
        if (this.startPos == undefined) {
            this.startPos = this.position.result();
        }

        let closest = 1500;
        let target = undefined;
        Player.players.forEach(p => {
            let dist = p.ship.position.distance(this.position);
            if (dist < closest) {
                target = p.ship;
                closest = dist;
            }
        });
        if (target != undefined) {
            if (closest < 200) {
                this.velocity = Vector.zero();
            } else {
                this.velocity = target.position.result().sub(this.position);
                this.velocity.normalize(dt * 600);
            }
        } else {
            if (Vector.sub(this.startPos, this.position).length() > 3000) {
                this.velocity = Vector.sub(this.startPos, this.position);
                this.velocity.normalize(dt * 300);
            } else if (Math.random() < 0.01) {
                this.velocity = new Vector(Math.random(), Math.random());
                this.velocity.normalize(dt * 300);
            }
        }
        this.rotation = this.velocity.toAngle();
    }
}



let Action = {};

/**
 * 
 * @param {Ship} ship 
 */
Action.test = function (ship, action) {
    action.replyData = {};
    if(ship.cargo[cargoType.rock] >= 10){
        ship.afterBurnerFuel += 10;
        ship.cargo[cargoType.rock] -= 10; 
        ship.afterBurnerFuel = Math.min(ship.afterBurnerFuel, ship.stats.afterBurnerCapacity);
        action.replyData.id = 0;
        return 1;
    }else{
        action.replyData.id = 0;
        return 0.1;
    }
}

Action.buildTest = function (ship, action) {
    action.replyData = {};
    if(ship.cargo[cargoType.rock] >= 10  && construct(ship, Buildings.navBeacon)){
        ship.cargo[cargoType.rock] -= 10; 
        action.replyData.id = 0;
        return 10;
    }else{
        action.replyData.id = 0;
        return 0.1;
    }
}


/**
 * 
 * @param {Ship} ship 
 * @param {SmartAction} action 
 */
Action.MineRock = function (ship, action) {
    let localArea = Area.getLocalArea(ship.position);

    let closestDist = 500;
    let closest = undefined;
    if (localArea != undefined) {
        for (let i = 0; i < localArea.entities.length; i++) {
            const e = localArea.entities[i];
            if (closestDist > ship.position.distance(e.position)) {
                closestDist = ship.position.distance(e.position);
                closest = e;
            }
        }
    }

    action.replyData = {};
    if(closest != undefined){
        ship.addCargo(cargoType.rock, 30);
        action.replyData.id = 0;
        closest.delete();
    }else{
        action.replyData.id = 0;
    }

    return 1;
}

let Buildings = {
    test: {
        size: 300,
        type: 101,
        control: function(dt){
            if(this.reach == undefined) this.reach = 0;

            if(this.timer == undefined || this.timer > 0.1){
                if(this.reach < 5000){
                    this.reach += 10;
                    let angle = 0;
                    for (let i = 0; i < 100; i++) {
                        angle += Math.PI*2/100;
                        let pos = new Vector(Math.cos(angle)*this.reach, Math.sin(angle)*this.reach);
                        pos.add(this.position);
                        Universe.setGas(pos, Math.max(Universe.getGas(pos) - 1, 0));
                    }
                }
                this.timer = 0;
            }
            this.timer += dt;
        }
    },
    navBeacon:{
        size: 50,
        type: 102,
        _speedBonus: 500,
        _range: 5000,
        _angle: 1,
        setup: function () {
            this.init();
            Building.navBeacons.push(this);
            this.collisionPurpose = 0;
        }
    }
}

/**
 * @type {Entity[],Building[]}
 */
Building.navBeacons = [];

/**
 * 
 * @param {Ship} ship 
 * @param {*} building 
 */
function construct(ship, building) {
    let position = ship.position.result();
    position.add(Vector.fromAngle(ship.rotation).mult(500));
    if (isAvalible(position, building.size)) {
        let build = new Building(position.x, position.y, building.type);
        build.collider.push(new Shape().circle(0, 0, building.size));
        build.collisionPurpose = Entity.CollisionFlags.player + Entity.CollisionFlags.projectile;
        build.calculateBounds();
        build.setup = building.setup || build.setup;
        build.setup();
        build.control = building.control || build.control;
        Entity.create.push(build);
        return true;
    }
    return false;
}

function isAvalible(position, size) {
    let out = true;
    let localArea = Area.getLocalArea(position);

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

    let collisionShape = new Shape().circle(position.x, position.y, size);
    Player.players.forEach(p => {
        let s = new Shape().circle(p.ship.position.x, p.ship.position.y, 60);
        res = collisionShape.checkCollision(s);
        if (res.result) {
            out = false;
            return;
        }
    });

    return out;
}

/**
 * 
 * @param {Player} player 
 */
function SmartAction(player){
    this.handle;
    this.id;
    this.player = player;
    this.replyData = undefined;
    player.actions.push(this);

    this.reply = function(id){
        if(this.replyData == undefined){
            return {handle: this.handle, id: id};
        }else{
            this.replyData.handle = this.handle;
            return this.replyData;
        }

    }
}

exports.SmartAction = SmartAction;

let cargoType = {rock: 0, crystals: 1, scrap: 2, count: 3 };

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
}

ShipType.init = function () {
    ShipType.types = [];
    let debugShip = new ShipType();
    debugShip.name = "Debug";
    debugShip.size = 125;
    debugShip.speed = 1000;
    debugShip.acceleration = 600;
    debugShip.reverseAccelreation = 300;
    debugShip.rotationSpeed = 3;
    debugShip.afterBurnerSpeedBonus = 1000;
    debugShip.afterBurnerRotationBonus = 1;
    debugShip.afterBurnerAccelerationBonus = 800;
    debugShip.afterBurnerCapacity = 60;
    debugShip.cargoCapacity = 100;
    debugShip.drag = 500;
    debugShip.actionPool = [Action.buildTest, Action.MineRock];

    debugShip.drag = debugShip.drag / 1000;
    ShipType.types["Debug"] = debugShip;
};
ShipType.init();

exports.ShipType = ShipType;

/**
 * 
 * @param {number} id 
 */
function Ship(id) {
    /**
     * @type {ShipType}
     */
    this.stats;
    this.position = new Vector(Universe.size * Area.size / 2, Universe.size * Area.size / 2);
    this.velocity = new Vector(0, 0);
    this.rotation = 0;
    this.control = new Vector(0, 0);
    this.afterBurnerActive = 0;
    this.afterBurnerUsed = 0;
    this.afterBurnerFuel = 60;
    this.debuff = 0;
    this.action = 0;
    this.cooldowns = [];
    this.cargo = [];
    /**
    * @type {number} id of the player who owns this ship
    */
    this.id = id;

    /**
     * 
     * @param {ShipType} type 
     */
    this.init = function (type) {
        this.stats = type;
        for (let i = 0; i < type.actionPool.length; i++) {
            this.cooldowns[i] = 0;
        }
        for (let i = 0; i < cargoType.count; i++) {
            this.cargo[i] = 0;
        }
    };

    this.update = function (dt) {
        let stats = this.stats;
        let afterBurnerUsed = false;
        let gas = Universe.getGas(this.position);

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
            this.rotation +=
                (stats.rotationSpeed +
                    this.afterBurnerActive * stats.afterBurnerRotationBonus) *
                this.control.x *
                dt;
            afterBurnerUsed = true;
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
            let diff = beacon.position.result().sub(this.position);

            if(diff.length() >  Buildings.navBeacon._range) continue;

            let angle = Math.atan2(diff.y, diff.x);
            angle = Math.atan2(Math.sin(angle-this.rotation), Math.cos(angle-this.rotation))
            Player.players.get(this.id).debug += "   Angle: " + angle.toFixed(2) + "\n";
            if (Math.abs(angle) < Buildings.navBeacon._angle/2) {
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

        Player.players.get(this.id).debug += "  Speed: " + this.velocity.length().toFixed(2) + "/" + targetSpeed.toFixed(2) + "\n";
        for (let i = 0; i < this.cargo.length; i++) {
            Player.players.get(this.id).debug += "      " + i+": " + this.cargo[i] + "\n";
        }

        Player.players.get(this.id).debug += "  Cargo: " + this.cargoUsed() +"/"+ stats.cargoCapacity;


        this.position.add(this.velocity.result().mult(dt));
        this.afterBurnerUsed = 0;
        if (
            this.afterBurnerActive == 1 &&
            (afterBurnerUsed || this.velocity.length() > stats.speed * debuffMult)
        ) {
            this.afterBurnerFuel -= dt;
            this.afterBurnerFuel = Math.max(0, this.afterBurnerFuel);
            this.afterBurnerUsed = 1;
        }
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
        this.handleAction(dt);
        this.checkCollision(dt);
    };

    this.handleAction = function (dt) {
        for (let i = 0; i < this.cooldowns.length; i++) {
            if (this.cooldowns[i] > 0) {
                this.cooldowns[i] -= dt;
            } else {
                this.cooldowns[i] = 0;
            }
        }

        let toHandle = Player.players.get(this.id).actions;
        let replies = Player.players.get(this.id).replies;
        for (let i = 0; i < toHandle.length; i++) {
            const a = toHandle[i];
            if (this.stats.actionPool[a.actionId] != undefined) {
                if (this.cooldowns[a.actionId] == 0) {
                    this.cooldowns[a.actionId] = this.stats.actionPool[a.actionId](this,a);
                    replies.push(a.reply());
                }else{
                    let reply = a.reply(2);
                    reply.time = this.cooldowns[a.actionId];
                    replies.push(reply);
                }
            }else{
                let reply = a.reply(1);
                replies.push(reply);
            }
        }
        Player.players.get(this.id).actions = [];
    }

    this.addCargo = function(type, count) {
        let used = this.cargoUsed();
        if (used + count <= this.stats.cargoCapacity) {
            this.cargo[type] += count;
            return 0;
        }else{
            let space = this.stats.cargoCapacity - used;
            this.cargo[type] += space;
            return count - space;
        }
    }

    this.cargoUsed = function() {
        let used = 0;
        this.cargo.forEach(c => {
            used += c;
        });
        return used;
    }

    this.checkCollision = function (dt) {
        let size = this.stats.size;
        let localArea = Area.getLocalArea(this.position);

        if (localArea != undefined) {
            for (let i = 0; i < localArea.entities.length; i++) {
                const e = localArea.entities[i];
                if ((e.collisionPurpose & Entity.CollisionFlags.player) != Entity.CollisionFlags.player) continue;
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
                        CollisionEvent.list.push(new CollisionEvent(this, e, res));
                    }
                });
            }
        }
    }
}

Ship.minSpeed = 0.2;
exports.Ship = Ship;

function Player(connection) {
    this.nick = "nick";
    /**
     * @type {Ship}
     */
    this.ship;
    this.connection = connection;
    this.id = Player.nextId;
    Player.nextId++;
    this.open = false;
    this.initialised = false;
    /**
     * @type {SmartAction[]}
     */
    this.actions = [];
    this.replies = [];
    this.debug = "";
    this.send = function (data) {
        if (this.connection.readyState == 1) this.connection.send(data);
    };
    this.init = function () {
        this.ship = new Ship(this.id);
        this.ship.init(ShipType.types["Debug"]);
    };
    /**
     * @returns {Entity[]}
     */
    this.proximity = function () {
        let proximity = [];
        let coords = this.ship.position.result();

        for (let y = -1; y <= 1; y++) {
            for (let x = -1; x <= 1; x++) {
                let adjusted = coords.result();
                adjusted.x += x * Area.size;
                adjusted.y += y * Area.size;
                let area = Area.getLocalArea(adjusted);
                if (area != undefined) proximity.push(area);
            }
        }

        let nearby = [];
        proximity.forEach(a => {
            a.entities.forEach(e => {
                nearby.push(e);
            });
        });

        return nearby;
    };
    Player.players.set(this.id, this);
}
/**
 * @type {Map<number,Player>}
 */
Player.players = new Map();
Player.nextId = 0;
/**
 * @type {Player[]}
 */
Player.newPlayers = [];
/**
 * @type {Player[]}
 */
Player.leftPlayers = [];

exports.Player = Player;

//#endregion