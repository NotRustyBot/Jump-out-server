function Interactable(position, level, bounds) {
    this.position = position;
    this.level = level;
    this.bounds = bounds;

    /**@param {import("./ship").Ship} ship */
    this.activate = function (ship, option) {

    }

    Interactable.list.push(this);
}

Interactable.list = [];

exports.Interactable = Interactable