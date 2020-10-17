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

let Universe = {
    size: 30, // area v jedné ose
}

function Area(x,y) {
    this.coordinates = new Vector(x,y);
    this.position = new Vector(Area.size*x,Area.size*y);
    this.objects = [];
}
Area.size = 2500;
Area.list = [];

for (let x = 0; x < Universe.size; x++) {
    Area.list[x] = []; 
    for (let y = 0; y < Universe.size; y++) {
        Area.list[x][y] = new Area(x,y);
    }
}



function ShipType() {
    this.name = "ShipTypeName";
    this.speed = 5;
    this.acceleration = 1;
    this.reverseAccelreation = 0.5;
    this.rotationSpeed = 1;
    this.afterBurnerBonus = 3;
    this.afterBurnerCapacity = 60;
}

ShipType.init = function () {
    ShipType.types = [];
    let debugShip = new ShipType();
    debugShip.name = "Debug";
    debugShip.speed = 150;
    debugShip.acceleration = 5;
    debugShip.reverseAccelreation = 3;
    debugShip.rotationSpeed = 1;
    debugShip.afterBurnerSpeedBonus = 1.5;
    debugShip.afterBurnerAgilityBonus = 1.5;
    debugShip.afterBurnerCapacity = 60;
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

    this.init = function (type) {
        this.stats = type;
    };

    this.update = function (dt) {
        let stats = this.stats;
        console.log(stats);

        if (this.control.x != 0) {
            // rotationace
            this.rotation += (stats.rotationSpeed + this.afterBurnerActive * stats.afterBurnerAgilityBonus) * this.control.x * dt;
        }

        if (this.control.y != 0) {
            // zrychlení / brždění
            let pointing = Vector.fromAngle(this.rotation).mult(this.control.y);
            pointing.mult(dt);
            if (this.control.y > 0) {
                pointing.normalize(stats.accel + this.afterBurnerActive * stats.afterBurnerAgilityBonus);
            } else {
                pointing.normalize(stats.revAccel + this.afterBurnerActive * stats.afterBurnerAgilityBonus);
            }
            this.velocity.add(pointing);
        }

        if (this.velocity.length() >= stats.speed + this.afterBurnerActive * stats.afterBurnerSpeedBonus) {
            
            this.velocity.normalize(stats.speed + this.afterBurnerActive * stats.afterBurnerSpeedBonus);
        }

        this.position.add(this.velocity.result().mult(dt));
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
        this.ship = new Ship();
        this.ship.init(ShipType.types["Debug"]);
    };
    Player.players[this.id] = this;
}
Player.players = [];

exports.Player = Player;

//#endregion
