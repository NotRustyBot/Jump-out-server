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
    this.entities = [];
}
Area.size = 2500;
Area.list = [];
Area.checkIn = function(entity){
    let position = entity.position;
    let x = Math.floor(position.x/Area.size);
    let y = Math.floor(position.y/Area.size);
    let area = Area.list[x][y];
    area.entity.push(entity);
}

for (let x = 0; x < Universe.size; x++) {
    Area.list[x] = []; 
    for (let y = 0; y < Universe.size; y++) {
        Area.list[x][y] = new Area(x,y);
    }
}

function Shape(){
    this.circle = function(x,y,r){
        this.type = Shape.types.circle;
        this.x = x;
        this.y = y;
        this.r = r;

        this.checkCollision = function(shape){
            if (shape.type == Shape.types.circle) {
                let distance = new Vector(this.x-shape.x,this.y-shape.y).length();
                return distance < shape.r + this.r
            }else if(shape.type == Shape.types.line){
                let dx = shape.x2 - shape.x1;
                let dy = shape.y2 - shape.y1;

                let A = dx * dx + dy * dy;
                let B = 2*(dx*(shape.x1 - this.x) + dy * (shape.y1 - this.y));
                let C = (shape.x1 - this.x) * (shape.x1 - this.x) +
                    (shape.y1 - this.y) * (shape.y1 - this.y) - this.r * this.r;
                let det = B*B - 4 * A * C;

                if ((A <= 0.0001) || (det <= 0)) {
                    return false;
                }else{
                    return true;
                }
            }
        }
        return this;
    }

    this.line = function(x1,y1,x2,y2){
        this.type = Shape.types.line;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        return this;
    }
}
Shape.types = {circle: 1, line: 2};


function Entity(x,y){
    this.position = new Vector(x,y);
    this.rotation = 0;
    this.id = Entity.list.length;
    Entity.list.push(this);
    Area.checkIn(this);
}
Entity.list = [];

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
    debugShip.speed = 150;
    debugShip.acceleration = 5;
    debugShip.reverseAccelreation = 3;
    debugShip.rotationSpeed = 0.2;
    debugShip.afterBurnerSpeedBonus = 1.5;
    debugShip.afterBurnerAgilityBonus = 1.5;
    debugShip.afterBurnerCapacity = 60;
    debugShip.drag = 0.9;
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
        //console.log(stats);

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
        }else{
            this.velocity.mult(stats.drag); // odpor
            if (this.velocity.length() < Ship.minSpeed) {
                this.velocity = Vector.zero();
            }
        }

        if (this.velocity.length() >= stats.speed + this.afterBurnerActive * stats.afterBurnerSpeedBonus) {
            
            this.velocity.normalize(stats.speed + this.afterBurnerActive * stats.afterBurnerSpeedBonus);
        }

        this.position.add(this.velocity.result().mult(dt));
    };
}
Ship.minSpeed = 0.5;
exports.Ship = Ship;

function Player(connection) {
    this.nick = "nick";
    this.ship;
    this.connection = connection;
    this.id = Player.players.length;
    this.open = false;
    this.send = function (data) {
        if(this.connection.readyState == 1)this.connection.send(data);
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
