const {Ship, ShipType} = require("./ship");
const {Universe} = require("./universe");
const {Area} = require("./area");




function Player(connection) {
    this.nick = "nick";
    /**
     * @type {Ship}
     */
    this.ship;
    this.shipType = Player.defaultShipType;
    this.connection = connection;
    this.id = Player.nextId;
    Player.nextId++;
    this.open = false;
    this.initialised = false;
    /**
     * @type {import("./action").SmartAction[]}
     */
    this.actions = [];
    this.replies = [];
    this.debug = "";
    this.send = function (data) {
        if (this.connection.readyState == 1) this.connection.send(data);
    };
    this.init = function () {
        this.ship = new Ship(this);
        this.ship.init(ShipType.types[this.shipType]);
    };
    /**
     * @returns {Entity[]}
     */
    this.proximity = function () {
        return Universe.entitiesInRange(this.ship.position, Area.size * 2, this.ship.level);
    };

    this.exit = function () {
        Area.checkOut(this.ship, this.ship.level);
        Player.players.delete(this.id);
    }
    Player.players.set(this.id, this);
}

Player.defaultShipType = 0; //#REM

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