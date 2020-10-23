//#region věci
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
}
Vector.zero = function () {
    return new Vector(0, 0);
};
Vector.fromAngle = function (r) {
    return new Vector(Math.cos(r), Math.sin(r));
};

exports.Vector = Vector;

let Universe = {
    size: 30, // area v jedné ose
};

function Area(x, y) {
    this.coordinates = new Vector(x, y);
    this.position = new Vector(Area.size * x, Area.size * y);
    this.entities = [];
}
Area.size = 2500;
Area.list = [];
Area.checkIn = function (entity) {
    let position = entity.position;
    let x = Math.floor(position.x / Area.size);
    let y = Math.floor(position.y / Area.size);
    let area = Area.list[x][y];
    area.entities.push(entity);
};

for (let x = 0; x < Universe.size; x++) {
    Area.list[x] = [];
    for (let y = 0; y < Universe.size; y++) {
        Area.list[x][y] = new Area(x, y);
    }
}

function CollisionResult(result, x, y) {
    this.result = result;
    if (result) {
        this.position = new Vector(x, y);
    }
}

function Shape() {
    this.circle = function (x, y, r) {
        this.line = undefined;
        this.type = Shape.types.circle;
        this.x = x;
        this.y = y;
        this.r = r;

        this.checkCollision = function (shape) {
            if (shape.type == Shape.types.circle) {
                let distance = new Vector(
                    this.x - shape.x,
                    this.y - shape.y
                ).length();
                if (distance < shape.r + this.r) {
                    return new CollisionResult(
                        true,
                        distance.x / 2,
                        distance.y / 2
                    );
                } else {
                    return new CollisionResult(false);
                }
            } else if (shape.type == Shape.types.line) {
                let dx = shape.x2 - shape.x1;
                let dy = shape.y2 - shape.y1;

                let A = dx * dx + dy * dy;
                let B =
                    2 * (dx * (shape.x1 - this.x) + dy * (shape.y1 - this.y));
                let C =
                    (shape.x1 - this.x) * (shape.x1 - this.x) +
                    (shape.y1 - this.y) * (shape.y1 - this.y) -
                    this.r * this.r;
                let det = B * B - 4 * A * C;

                if (A <= 0.0001 || det <= 0) {
                    return new CollisionResult(false);
                } else {
                    let t = -B / (2 * A);
                    return new CollisionResult(
                        true,
                        shape.x1 + t * dx,
                        shape.y1 + t * dy
                    );
                }
            }
        };
        this.rotate = function(angle){
            let sin = Math.sin(angle);
            let cos = Math.cos(angle);
            this.x  = this.x * cos - this.y * sin;
            this.y  = this.x * sin + this.y * cos;
        }
        this.copy = function(){
            return new Shape().line(this.x,this.y,this.r);
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
                let dx = this.x2 - this.x1;
                let dy = this.y2 - this.y1;

                let A = dx * dx + dy * dy;
                let B =
                    2 * (dx * (this.x1 - shape.x) + dy * (this.y1 - shape.y));
                let C =
                    (this.x1 - shape.x) * (this.x1 - shape.x) +
                    (this.y1 - this.y) * (this.y1 - this.y) -
                    shape.r * shape.r;
                let det = B * B - 4 * A * C;

                if (A <= 0.0001 || det <= 0) {
                    return new CollisionResult(false);
                } else {
                    let t = -B / (2 * A);
                    return new CollisionResult(
                        true,
                        this.x1 + t * dx,
                        this.y1 + t * dy
                    );
                }
            } else if (shape.type == Shape.types.line) {
                let x1 = this.x1;
                let y1 = this.y1;
                let x2 = this.x2;
                let y2 = this.y2;

                let u1 = shape.x1;
                let v1 = shape.y1;
                let u2 = shape.x2;
                let v2 = shape.y2;

                let x =
                    (-1 *
                        ((x1 - x2) * (u1 * v2 - u2 * v1) -
                            (u2 - u1) * (x2 * y1 - x1 * y2))) /
                    ((v1 - v2) * (x1 - x2) - (u2 - u1) * (y2 - y1));
                let y =
                    (-1 *
                        (u1 * v2 * y1 -
                            u1 * v2 * y2 -
                            u2 * v1 * y1 +
                            u2 * v1 * y2 -
                            v1 * x1 * y2 +
                            v1 * x2 * y1 +
                            v2 * x1 * y2 -
                            v2 * x2 * y1)) /
                    (-1 * u1 * y1 +
                        u1 * y2 +
                        u2 * y1 -
                        u2 * y2 +
                        v1 * x1 -
                        v1 * x2 -
                        v2 * x1 +
                        v2 * x2);
                if (isNaN(x) || isNaN(y)) {
                    return new CollisionResult(false);
                } else {
                    return new CollisionResult(true, x, y);
                }
            }
        };
        this.rotate = function(angle){
            let sin = Math.sin(angle);
            let cos = Math.cos(angle);
            this.x1  = this.x1 * cos - this.y1 * sin;
            this.y1  = this.x1 * sin + this.y1 * cos;
            this.x2  = this.x2 * cos - this.y2 * sin;
            this.y2  = this.x2 * sin + this.y2 * cos;
        }

        this.copy = function(){
            return new Shape().line(this.x1,this.y1,this.x2,this.y2);
        }

        return this;
    };
}
Shape.types = { circle: 1, line: 2 };

function Entity(x, y, type) {
    this.position = new Vector(x, y);
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.type = type;
    this.rotatedCollider = [];
    this.rotatedColliderValid = false;
    this.collider = [];
    this.id = Entity.list.length;
    Entity.list.push(this);
    Area.checkIn(this);
    this.update = function (dt) {
        this.rotatedColliderValid = false;
        this.rotation += this.rotationSpeed * dt;
    };
    this.rotateCollider = function(){
        rotatedCollider = [];
        this.collider.forEach(s => {
            let r = s.copy();
            r.rotate(this.rotation);
            this.rotatedCollider.push(r);
        });
        this.rotatedColliderValid = true;
    }
}
Entity.list = [];

let e1 = new Entity(300, 0, 1);
e1.collider.push(new Shape().circle(0, 0, 50));
e1.rotationSpeed = 0.5;

exports.Entity = Entity;

function ShipType() {
    this.name;
    this.speed;
    this.acceleration;
    this.reverseAccelreation;
    this.rotationSpeed;
    this.afterBurnerBonus;
    this.afterBurnerCapacity;
    this.drag;
}

ShipType.init = function () {
    ShipType.types = [];
    let debugShip = new ShipType();
    debugShip.name = "Debug";
    debugShip.speed = 600;
    debugShip.acceleration = 600;
    debugShip.reverseAccelreation = 300;
    debugShip.rotationSpeed = 3;
    debugShip.afterBurnerSpeedBonus = 600;
    debugShip.afterBurnerRotationBonus = 3;
    debugShip.afterBurnerAccelerationBonus = 300;
    debugShip.afterBurnerCapacity = 60;
    debugShip.drag = 1;

    debugShip.drag = (100000 - debugShip.drag) / 100000;
    ShipType.types["Debug"] = debugShip;
};
ShipType.init();

exports.ShipType = ShipType;

function Ship() {
    this.stats;
    this.position = new Vector(0, 0);
    this.velocity = new Vector(0, 0);
    this.rotation = 0;
    this.control = new Vector(0, 0);
    this.afterBurnerActive = 0;
    this.afterBurnerFuel = 60;

    this.init = function (type) {
        this.stats = type;
    };

    this.update = function (dt) {
        let stats = this.stats;
        let afterBurnerUsed = false;
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

        let topSpeed =
            stats.speed + this.afterBurnerActive * stats.afterBurnerSpeedBonus;
        if (this.velocity.length() >= topSpeed) {
            if (this.control.y >= 0) {
                this.velocity.mult(1 - stats.drag * dt); // odpor
                if (this.velocity.length() < Ship.minSpeed) {
                    this.velocity = Vector.zero();
                }
            } else {
                let pointing = Vector.fromAngle(this.rotation).mult(
                    this.control.y
                );
                pointing.normalize(
                    stats.reverseAccelreation +
                    this.afterBurnerActive *
                    stats.afterBurnerAccelerationBonus
                );
                afterBurnerUsed = true;
                pointing.mult(dt);
                this.velocity.add(pointing);
            }
        } else {
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
                this.velocity.mult(1 - stats.drag * dt); // odpor
                if (this.velocity.length() < Ship.minSpeed) {
                    this.velocity = Vector.zero();
                }
            }
        }

        this.position.add(this.velocity.result().mult(dt));

        if (
            this.afterBurnerActive == 1 &&
            (afterBurnerUsed || this.velocity.length() > stats.speed)
        ) {
            this.afterBurnerFuel -= dt;
            this.afterBurnerFuel = Math.max(0, this.afterBurnerFuel);
        }

        this.checkCollision();
    };

    this.checkCollision = function(){
        for (let i = 0; i < Entity.list.length; i++) {
            const e = Entity.list[i];
            let relativePos = this.position.result();
            relativePos.x -= e.position.x;
            relativePos.y -= e.position.y;
            let collisionShape = new Shape().circle(relativePos.x,relativePos.y, 30); //size ??
            let res;
            if(!e.rotatedColliderValid){
                e.rotateCollider();
            }
            e.rotatedCollider.forEach(s => {
                res = collisionShape.checkCollision(s);
                if(res.result) return;
            });
            if(res.result){
                /*let shift = relativePos;
                shift.add(res.position.mult(-1));
                this.position.add(shift);*/
                this.velocity.mult(-1);
                this.position.add(this.velocity.result().mult(dt));
            }
        }
    }
}
Ship.minSpeed = 0.2;
exports.Ship = Ship;

function Player(connection) {
    this.nick = "nick";
    this.ship;
    this.connection = connection;
    this.id = Player.nextId;
    Player.nextId++;
    this.open = false;
    this.initialised = false;
    this.send = function (data) {
        if (this.connection.readyState == 1) this.connection.send(data);
    };
    this.init = function () {
        this.ship = new Ship();
        this.ship.init(ShipType.types["Debug"]);
    };
    Player.players.set(this.id, this);
}
Player.players = new Map();
Player.nextId = 0;
Player.newPlayers = [];
Player.leftPlayers = [];

exports.Player = Player;

//#endregion
