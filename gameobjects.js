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

function ShipType() {
    this.name = "ShipTypeName";
    this.speed = 5;
    this.accel = 1;
    this.revAccel = 0.5;
    this.rotSpeed = 1;
    this.afterBonus = 3;
    this.afterCapacity = 60;
}

ShipType.init = function () {
    ShipType.types = [];
    let debugShip = new ShipType();
    debugShip.name = "Debug";
    debugShip.speed = 150;
    debugShip.accel = 5;
    debugShip.revAccel = 3;
    debugShip.rotSpeed = 1;
    debugShip.afterBonus = 3;
    debugShip.afterCapacity = 60;
    ShipType.types["Debug"] = debugShip;
};
ShipType.init();

exports.ShipType = ShipType;

function Ship() {
    this.stats;
    this.pos = new Vector(0, 0);
    this.velocity = new Vector(0, 0);
    this.rot = 0;
    this.control = new Vector(0, 0);

    this.setup = function (type) {
        this.stats = type;
    };

    this.update = function (dt) {
        let stats = this.stats;

        if (this.control.x != 0) {
            // rotace
            this.rot += stats.rotSpeed * this.control.x * dt;
        }

        if (this.control.y != 0) {
            // zrychlení / brždění
            let pointing = Vector.fromAngle(this.rot).mult(this.control.y);
            pointing.mult(dt);
            if (this.control.y > 0) {
                pointing.normalize(stats.accel);
            } else {
                pointing.normalize(stats.revAccel);
            }
            this.velocity.add(pointing);
        }

        if (this.velocity.length() >= stats.speed) {
            this.velocity.normalize(stats.speed);
        }

        this.pos.add(this.velocity.result().mult(dt));
    };
}

exports.Ship = Ship;

function Player(connection) {
    this.nick = "nick";
    this.ship;
    this.connection = connection;
    this.id = Player.players.length;
    this.send = function (data) {
        this.connection.send(data);
    };
    this.init = function () {
        this.ship = new Ship(ShipType.types["Debug"]);
    };
    Player.players[this.id] = this;
}
Player.players = [];

exports.Player = Player;

//#endregion
