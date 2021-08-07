const {Entity} = require("./entity");
const {isAvalible, flag} = require("./utility");
const {Shape} = require("./collision");



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


let Buildings = {
    test: {
        size: 300,
        type: 101,
        control: function (dt) {
            if (this.reach == undefined) this.reach = 0;

            if (this.timer == undefined || this.timer > 0.1) {
                if (this.reach < 5000) {
                    this.reach += 10;
                    let angle = 0;
                    for (let i = 0; i < 100; i++) {
                        angle += Math.PI * 2 / 100;
                        let pos = new Vector(Math.cos(angle) * this.reach, Math.sin(angle) * this.reach);
                        pos.add(this.position);
                        Universe.setGas(pos, Math.max(Universe.getGas(pos) - 1, 0));
                    }
                }
                this.timer = 0;
            }
            this.timer += dt;
        }
    },
    navBeacon: {
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

exports.Buildings = Buildings;

/**
 * 
 * @param {Ship} ship 
 * @param {*} building 
 */
 function construct(position, level, building) {
    if (isAvalible(position, level, building.size)) {
        let build = new Building(position.x, position.y, building.type, level);
        build.collider.push(new Shape().circle(0, 0, building.size));
        build.collisionPurpose = flag.CollisionFlags.player + flag.CollisionFlags.projectile;
        build.calculateBounds();
        build.setup = building.setup || build.setup;
        build.setup();
        build.control = building.control || build.control;
        Entity.create.push(build);
        return true;
    }
    return false;
}

exports.construct = construct;