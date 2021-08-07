const {Area} = require("./area");
const {Vector} = require("./vector");

function Level(enterance) {
    this.enterance = enterance;
    this.level = Level.nextId();

    Area.levels[this.level] = new Area(this.level);

    Level.list.set(this.level, this);

    /**
     * @param {import("./ship").Ship} ship
     */
    this.enter = function (ship) {
        if (ship.position.result().sub(this.enterance).inbound(1000)) {
            Area.checkOut(ship, ship.level);
            ship.level = this.level;
            ship.position = new Vector(0, 0);
            Area.checkIn(ship, ship.level);
        }
    }

    /**
    * @param {import("./ship").Ship} ship
    */
    this.exit = function (ship) {
        if (ship.position.inbound(1000)) {
            Area.checkOut(ship, ship.level);
            ship.level = 0;
            ship.position = this.enterance.result();
            Area.checkIn(ship, ship.level);

        }
    }
}

/**
 * @type {Map<number,Level>}
 */
Level.list = new Map();
Level.id = 0;
Level.nextId = function () {
    Level.id++;
    return Level.id;
}

exports.Level = Level;