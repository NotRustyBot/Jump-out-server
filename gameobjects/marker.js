const {Vector} = require("./vector");
const {Universe} = require("./universe");

/**
 * @param {Vector} position
 * @param {number} type
 * @param {number} playerId
 * @param {object} parameter
 */
function Marker(position, type, playerId, parameter) {
    this.position = position;
    this.parameter = parameter;
    this.type = type;
    this.broadcasted = false;
    this.remove = false;
    this.hasTimer = false;
    this.timer = 0;
    this.playerId = playerId;

    this.update = function (dt) {
        if (this.remove && this.broadcasted) {
            Universe.comms.markers.delete(this.id);
        }
        if (this.hasTimer) {
            this.timer -= dt;
            if (this.timer < 0) {
                this.broadcasted = false;
                this.remove = true;
            }
        }
    }
    this.id = Marker.nextId();
    Universe.comms.markers.set(this.id, this);
}
Marker.id = 0;
Marker.nextId = function () {
    this.id++;
    return this.id;
};

exports.Marker = Marker;