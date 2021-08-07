const {Entity} = require("./entity");
const {Area} = require("./area");
const {Vector} = require("./vector");


function Mobile(x, y, type, level) {
    Entity.call(this, x, y, type, level);
    this.velocity = new Vector(0, 0);
    this.timer = 0;
    this.control = function (dt) { };
    this.update = function (dt) {
        this.rotatedColliderValid = false;
        this.bytesValid = false;
        this.timer++;
        this.timer = this.timer % 100;
        this.control(dt);
        Area.moveMe(this, dt);
        //this.position.add(this.velocity.result().mult(dt));

        this.rotation += this.rotationSpeed * dt;
        this.rotation = this.rotation % (Math.PI * 2);
    }
}

exports.Mobile = Mobile;