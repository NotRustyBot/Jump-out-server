const {Item, ItemDrop} = require("./inventory");
const {Universe} = require("./universe");

let Action = {};

/**
 * 
 * @param {import("./ship").Ship} ship 
 * @param {SmartAction} action
 */
Action.test = function (ship, action) {
    action.replyData = {};
    if (ship.inventory.removeItem(new Item(Items.ore, 1))) {
        ship.afterBurnerFuel += 10;
        ship.afterBurnerFuel = Math.min(ship.afterBurnerFuel, ship.stats.afterBurnerCapacity);
        action.replyData.id = 0;
        return 1;
    } else {
        action.replyData.id = 0;
        return 0.1;
    }
}

/**
 * 
 * @param {import("./ship").Ship} ship 
 * @param {SmartAction} action
 */
Action.buildTest = function (ship, action) {
    action.replyData = {};
    if (ship.inventory.countItem(Items.naviBeacon) >= 1 && construct(ship.position.result().add(Vector.fromAngle(ship.rotation).mult(500)), ship.level, Buildings.navBeacon)) {
        ship.inventory.removeItem(new Item(Items.naviBeacon, 1));
        action.replyData.id = 0;
        return 0.1;
    } else {
        action.replyData.id = 0;
        return 0.1;
    }
}
/**
 * 
 * @param {import("./ship").Ship} ship 
 * @param {SmartAction} action 
 */
Action.MineRock = function (ship, action) {
    let localArea = Area.getLocalArea(ship.position, ship.level);

    let closestDist = 600;
    let closest = undefined;
    if (localArea != undefined) {
        for (let i = 0; i < localArea.entities.length; i++) {
            const e = localArea.entities[i];
            const stats = Entity.properties[e.type] || {};
            if (closestDist > ship.position.distance(e.position) && stats.canMine) {
                closestDist = ship.position.distance(e.position);
                closest = e;
            }
        }
    }

    action.replyData = {};
    if (closest != undefined) {
        ship.inventory.addItem(new Item(Items.ore, 10));
        action.replyData.id = 0;
        Universe.unscan(closest);
        closest.delete();
    } else {
        action.replyData.id = 0;
    }

    return 1;
}

/**
 * 
 * @param {import("./ship").Ship} ship 
 * @param {SmartAction} action
 */
Action.DropItem = function (ship, action) {
    action.replyData = {};
    const slot = ship.inventory.slots[action.slot];
    if (slot.item.stack >= action.stack && action.stack > 0) {
        let dropPosition = action.position;
        if (ship.position.distance(dropPosition) > 1000) {
            let angle = ship.position.result().sub(dropPosition).toAngle();
            dropPosition = ship.position.result().add(Vector.fromAngle(angle).mult(1000))
        }

        dropPosition.x = Math.max(Math.min(dropPosition.x, Universe.size * Area.size - 130), 130);
        dropPosition.y = Math.max(Math.min(dropPosition.y, Universe.size * Area.size - 130), 130);

        let drop = new ItemDrop(dropPosition, new Item(slot.item.id, action.stack), ship.position, ship.level);
        slot.removeItem(new Item(slot.item.id, action.stack));
        ship.inventory.sort();
        drop.init();
        action.replyData.id = 0;
        return 0.1;
    } else {
        action.replyData.id = 0;
        return 0.1;
    }
}


/**
 * 
 * @param {import("./ship").Ship} ship 
 * @param {SmartAction} action 
 */
Action.SwapSlots = function (ship, action) {
    action.replyData = {};
    ship.inventory.swapSlots(ship.inventory.slots[action.slot1], ship.inventory.slots[action.slot2]);
    action.replyData.id = 0;
    return 0.1;
}

/**
 * 
 * @param {import("./ship").Ship} ship 
 * @param {SmartAction} action 
 */
Action.CreateMarker = function (ship, action) {
    action.replyData = {};
    let marker = new Marker(action.position, action.type, ship.id, action.parameter);
    marker.hasTimer = true;
    marker.timer = 10;
    action.replyData.id = 0;
    return 0.1;
}

/**
 * 
 * @param {import("./ship").Ship} ship 
 * @param {SmartAction} action 
 */
Action.Shoot = function (ship, action) {
    action.replyData = {};
    Projectile.from(ship, 0);

    action.replyData.id = 0;
    return Projectile.stats[0].cooldown / 1000;
}

/**
 * 
 * @param {import("./ship").Ship} ship 
 * @param {SmartAction} action 
 */
Action.LevelMove = function (ship, action) {
    action.replyData = {};
    if (ship.level == 0) {
        Level.list.forEach(l => {
            l.enter(ship);
        });
    } else {
        Level.list.forEach(l => {
            l.exit(ship);
        });
    }

    action.replyData.id = 0;
    return 0.5;
}

/**
 * 
 * @param {import("./ship").Ship} ship 
 * @param {SmartAction} action 
 */
 Action.Interact = function (ship, action) {
    action.replyData = {};
    Interactable.list[action.id].activate(ship, action.option)

    action.replyData.id = 0;
    return 0.5;
}


/**
 * 
 * @param {Player} player 
 */
 function SmartAction(player) {
    this.handle;
    this.id;
    this.player = player;
    this.replyData = undefined;
    player.actions.push(this);

    this.reply = function (id) {
        if (this.replyData == undefined) {
            return { handle: this.handle, id: id };
        } else {
            this.replyData.handle = this.handle;
            return this.replyData;
        }

    }
}

exports.SmartAction = SmartAction;
exports.Action = Action;