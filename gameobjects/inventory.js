const {Area} = require("./area");
const {Entity} = require("./entity");
const {Vector} = require("./vector");
const {ItemInfo, Items} = require("./items");
const {Shape} = require("./collision");


function Item(id, stack) {
    this.id = id;
    this.stack = stack;
    this.stats = ItemInfo[id];

    this.clone = function () {
        return new Item(this.id, this.stack);
    }
}

exports.Item = Item;

/**
 * @param {number} capacity
 * @param {number} filter
 */
function Slot(capacity, filter) {
    this.filter = filter == undefined ? -1 : filter;
    this.capacity = capacity == undefined ? -1 : capacity;
    /**
     * @type {Inventory}
     */
    this.inventory;
    /**
     * @type {Item}
     */
    this.item = new Item(0, 0);

    /**
     * 
     * @param {Item} item 
     */
    this.addItem = function (item) {
        if (this.item.id == 0 || this.item.id == item.id) {
            let taken = 0;
            if (this.filter == -1) {
                if (item.stats.stackable) {
                    taken = Math.min(this.inventory.capacity - this.inventory.used, item.stack);
                } else {
                    if (this.item.stack != 0) {
                        return 0; // unstackable
                    }
                    taken = Math.min(this.inventory.capacity - this.inventory.used, 1);
                }
                this.inventory.used += taken;
            } else if (this.filter == item.stats.tag) {
                taken = Math.min(this.capacity - this.item.stack, item.stack);
            } else {
                return 0; // filter mismatch
            }

            if (taken > 0) {
                this.item.id = item.id;
                this.item.stats = ItemInfo[this.item.id];
                this.item.stack += taken;

                Inventory.changes.push({ shipId: this.inventory.owner, slot: this.inventory.slots.indexOf(this), item: this.item.id, stack: taken });
            }
            return taken; // == 0) inventory full
        } else {
            return 0; // item mismatch
        }
    }

    /**
     * 
     * @param {Item} item 
     */
    this.removeItem = function (item) {
        let taken = 0;
        if (this.item.id == item.id) {
            taken = Math.min(this.item.stack, item.stack);
            this.item.stack -= taken;
            if (this.item.stack == 0) {
                this.item.id = 0;
            }

            if (this.filter == -1) {
                this.inventory.used -= taken;
            }

            if (taken > 0) {
                Inventory.changes.push({ shipId: this.inventory.owner, slot: this.inventory.slots.indexOf(this), item: item.id, stack: -taken });
            }


        }
        return taken;
    }
}

function Inventory(capacity, owner, layout) {
    /**
     * @type {Slot[]}
     */
    this.slots = [];
    this.capacity = capacity;
    this.used = 0;
    this.owner = owner;
    if (owner == undefined) this.owner = -1;

    /**
     * 
     * @param {Item} item 
     */
    this.addItem = function (item) {
        let request = item.stack;
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            if (slot.item.id != item.id) continue;
            let taken = slot.addItem(item);
            item.stack -= taken;
            if (item.stack == 0) break;
        }
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            let taken = slot.addItem(item);
            item.stack -= taken;
            if (item.stack == 0) break;
        }
        this.sort();
        return item.stack;
    }

    /**
     * 
     * @param {Item} item 
     */
    this.countItem = function (itemID) {
        let count = 0;
        for (let i = this.slots.length - 1; i >= 0; i--) {
            const slot = this.slots[i];
            if (slot.item.id == itemID) {
                count += slot.item.stack;
            }
        }

        return count;
    }

    /**
     * 
     * @param {Item} item 
     */
    this.removeItem = function (item) {
        let request = item.stack;
        for (let i = this.slots.length - 1; i >= 0; i--) {
            const slot = this.slots[i];
            if (slot.item.id == item.id) {
                request -= slot.item.stack;
            }
            if (request <= 0) break;
        }

        if (request <= 0) {
            request = item.stack;
            for (let i = this.slots.length - 1; i >= 0; i--) {
                const slot = this.slots[i];
                let taken = slot.removeItem(item);
                item.stack -= taken;
                if (item.stack == 0) break;
            }
            this.sort();
            return true;
        } else {
            return false;
        }
    }

    /**
     * 
     * @param {Slot} slot1 
     * @param {Slot} slot2 
     */
    this.swapSlots = function (slot1, slot2) {
        if (slot1.item.id == slot2.item.id) return; // what
        if (slot1.filter != -1 && slot2.item.stack == 0 ||
            slot2.filter != -1 && slot2.item.stack == 0) {
            return; // cant swap these slots! >:[
        }

        if (slot1.filter == -1 && slot2.filter == -1) {
            let temp = slot1.item.clone();
            if (slot1.item.id != 0) slot1.removeItem(slot1.item.clone());
            if (slot2.item.id != 0) slot1.addItem(slot2.item.clone());
            if (slot2.item.id != 0) slot2.removeItem(slot2.item.clone());
            if (temp.id != 0) slot2.addItem(temp);
        } else if (slot1.filter == -1 && slot1.item.stats.tag == slot2.filter) {
            let temp = slot2.item.clone();
            this.removeItem(slot2.item.clone());
            slot2.addItem(slot1.item.clone());
            let overflow = this.addItem(temp);
            if (overflow > 0) {
                let pos = Player.players.get(this.owner).ship.position;
                let level = Player.players.get(this.owner).level;
                let drop = new ItemDrop(pos, temp, pos, level);
                drop.init();
            }
        } else if (slot2.filter == -1 && slot2.item.stats.tag == slot1.filter) {
            let temp = slot1.item.clone();
            this.removeItem(slot1.item.clone());
            slot1.addItem(slot2.item.clone());
            let overflow = this.addItem(temp);
            if (overflow > 0) {
                let pos = Player.players.get(this.owner).ship.position;
                let level = Player.players.get(this.owner).level;
                let drop = new ItemDrop(pos, temp, pos, level);
                drop.init();
            }
        }

        this.sort();
    }

    this.sort = function () {
        for (let i = 0; i < this.slots.length - 1; i++) {
            const slot1 = this.slots[i];
            for (let j = i + 1; j < this.slots.length; j++) {
                const slot2 = this.slots[j];
                if (slot2.item.stack == 0) continue;

                if (slot1.item.id == slot2.item.id) {
                    if (slot1.filter == -1 || slot1.capacity > slot1.item.stack) {
                        let temp = slot2.item.clone();
                        temp.stack = slot1.addItem(temp);
                        slot2.removeItem(temp);
                    }
                } if (slot1.filter == slot2.item.stats.tag) {
                    let temp = slot2.item.clone();
                    temp.stack = slot1.addItem(temp);
                    slot2.removeItem(temp);
                }
            }
        }
    }

    /**
     * 
     * @param {Slot} slot 
     */
    this.addSlot = function (slot) {
        slot.inventory = this;
        this.slots.push(slot);
    }

    for (let i = 0; i < layout.length; i++) {
        const e = layout[i];
        if (e.unique) {
            this.addSlot(new Slot(e.capacity, e.filter));
        } else {
            this.addSlot(new Slot());
        }
    }
}

Inventory.changes = [];
exports.Inventory = Inventory;


/**
 * 
 * @param {Vector} position
 * @param {Item} item 
 * @param {Vector} source 
 */
 function ItemDrop(position, item, source, level) {
    if (item.stack <= 0) return;
    Entity.call(this, position.x, position.y, -1, level);
    this.item = item;
    this.bounds = 125;
    this.collisionPurpose = Entity.CollisionFlags.pickup;
    this.rotatedCollider.push(new Shape().circle(0, 0, 125));
    this.rotatedColliderValid = true;
    this.noScan = true;
    this.noUpdate = true;

    if (source == undefined) {
        this.source = position;
    } else {
        this.source = source;
    }

    this.update = function () { };

    this.init = function () {
        this.id = Entity.next_id;
        Entity.next_id++;
        Entity.list.push(this);
        Area.checkIn(this, this.level);
        ItemDrop.create.push(this);
    }

    this.delete = function () {
        Area.checkOut(this, this.level);
        Entity.list.splice(Entity.list.indexOf(this), 1);
        ItemDrop.remove.push(this);
    }
}

ItemDrop.create = [];
ItemDrop.remove = [];
exports.ItemDrop = ItemDrop;