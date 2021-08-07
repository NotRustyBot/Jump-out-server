const {Entity} = require("./entity");


function Building(x, y, type, level) {
    Entity.call(this, x, y, type, level);
    this.control = function (dt) { }
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

/**
 * @type {Entity[],Building[]}
 */
 Building.navBeacons = [];

exports.Building = Building;