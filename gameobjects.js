const { Datagram, Datagrams, AutoView, serverHeaders, clientHeaders, SmartActionData, ActionId, ReplyData, init } = require("./datagram.js");
const fs = require('fs');
const { gasBuffer } = require("./worldgen.js");

exports.Datagram = Datagram;
exports.Datagrams = Datagrams;
exports.AutoView = AutoView;
exports.serverHeaders = serverHeaders;
exports.clientHeaders = clientHeaders;
exports.SmartActionData = SmartActionData;
exports.ActionId = ActionId;
exports.ReplyData = ReplyData;

//#region věci
/**
 * 
 * @param {number} x 
 * @param {number} y 
 */
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

    this.toAngle = function () {
        return Math.atan2(this.y, this.x);
    };

    this.result = function () {
        return new Vector(this.x, this.y);
    };

    this.inbound = function (bound) {
        return this.x < bound && this.x > -bound && this.y < bound && this.y > -bound
    }
}
Vector.fromAngle = function (r) {
    return new Vector(Math.cos(r), Math.sin(r));
};
Vector.cross = function (v1, v2) {
    return v1.x * v2.y - v1.y * v2.x;
};
Vector.dot = function (v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
};
Vector.sub = function (v1, v2) {
    return new Vector(v1.x - v2.x, v1.y - v2.y);
};
Vector.zero = function () {
    return new Vector(0, 0);
};

exports.Vector = Vector;
init(Vector);

function Area(x, y) {
    this.coordinates = new Vector(x, y);
    this.position = new Vector(Area.size * x, Area.size * y);
    /**
     * @type {Entity[]}
     */
    this.entities = [];
}
Area.size = 5000;
/**
 * @type {Area[][]}
 */
Area.list = [];
/**
 * 
 * @param {Entity} entity 
 */
Area.checkIn = function (entity) {
    let position = entity.position;
    let x = Math.floor((position.x + entity.bounds) / Area.size);
    let y = Math.floor((position.y + entity.bounds) / Area.size);
    let area = Area.list[x][y];
    area.entities.push(entity);

    position = entity.position;
    x = Math.floor((position.x - entity.bounds) / Area.size);
    y = Math.floor((position.y + entity.bounds) / Area.size);
    area = Area.list[x][y];

    if (!area.entities.includes(entity)) {
        area.entities.push(entity);
    }

    position = entity.position;
    x = Math.floor((position.x + entity.bounds) / Area.size);
    y = Math.floor((position.y - entity.bounds) / Area.size);
    area = Area.list[x][y];

    if (!area.entities.includes(entity)) {
        area.entities.push(entity);
    }

    position = entity.position;
    x = Math.floor((position.x - entity.bounds) / Area.size);
    y = Math.floor((position.y - entity.bounds) / Area.size);
    area = Area.list[x][y];

    if (!area.entities.includes(entity)) {
        area.entities.push(entity);
    }
};

/**
 * 
 * @param {Entity} entity 
 */
Area.checkOut = function (entity) {
    let position = entity.position;
    let x = Math.floor((position.x + entity.bounds) / Area.size);
    let y = Math.floor((position.y + entity.bounds) / Area.size);
    let area = Area.list[x][y];
    if (area.entities.includes(entity)) {
        area.entities.splice(area.entities.indexOf(entity), 1);
    }

    position = entity.position;
    x = Math.floor((position.x - entity.bounds) / Area.size);
    y = Math.floor((position.y + entity.bounds) / Area.size);
    area = Area.list[x][y];

    if (area.entities.includes(entity)) {
        area.entities.splice(area.entities.indexOf(entity), 1);
    }

    position = entity.position;
    x = Math.floor((position.x + entity.bounds) / Area.size);
    y = Math.floor((position.y - entity.bounds) / Area.size);
    area = Area.list[x][y];

    if (area.entities.includes(entity)) {
        area.entities.splice(area.entities.indexOf(entity), 1);
    }

    position = entity.position;
    x = Math.floor((position.x - entity.bounds) / Area.size);
    y = Math.floor((position.y - entity.bounds) / Area.size);
    area = Area.list[x][y];

    if (area.entities.includes(entity)) {
        area.entities.splice(area.entities.indexOf(entity), 1);
    }
};


/**
 * 
 * @param {Mobile} mobile 
 */
Area.moveMe = function (mobile) {
    let position = mobile.position;
    let newPosition = position.result().add(mobile.velocity);
    let x = Math.floor((position.x + mobile.bounds) / Area.size);
    let y = Math.floor((position.y + mobile.bounds) / Area.size);
    let nx = Math.floor((newPosition.x + mobile.bounds) / Area.size);
    let ny = Math.floor((newPosition.y + mobile.bounds) / Area.size);

    if (x == nx && y == ny) {
        mobile.position = newPosition;
        x = Math.floor((position.x - mobile.bounds) / Area.size);
        y = Math.floor((position.y + mobile.bounds) / Area.size);
        nx = Math.floor((newPosition.x - mobile.bounds) / Area.size);
        ny = Math.floor((newPosition.y + mobile.bounds) / Area.size);
        if (x == nx && y == ny) {
            mobile.position = newPosition;
            x = Math.floor((position.x + mobile.bounds) / Area.size);
            y = Math.floor((position.y - mobile.bounds) / Area.size);
            nx = Math.floor((newPosition.x + mobile.bounds) / Area.size);
            ny = Math.floor((newPosition.y - mobile.bounds) / Area.size);
            if (x == nx && y == ny) {
                mobile.position = newPosition;
                x = Math.floor((position.x - mobile.bounds) / Area.size);
                y = Math.floor((position.y - mobile.bounds) / Area.size);
                nx = Math.floor((newPosition.x - mobile.bounds) / Area.size);
                ny = Math.floor((newPosition.y - mobile.bounds) / Area.size);
                if (x == nx && y == ny) {
                    return;
                }
            }
        }
    }

    Area.checkOut(mobile);
    mobile.position = newPosition;
    Area.checkIn(mobile);

};

exports.Area = Area;

/**
 * 
 * @param {Vector} position 
 * @returns {Area}
 */
Area.getLocalArea = function (position) {
    let x = Math.floor(position.x / Area.size);
    let y = Math.floor(position.y / Area.size);

    if (Area.list[x] != undefined && Area.list[x][y] != undefined) {
        return Area.list[x][y];
    }
}

let Universe = {};
Universe.size = 80; // area v jedné ose

/**
 * 
 * @param {Vector} vector position to check
 */
Universe.getGas = function (vector) {
    let x = Math.floor(vector.x / Universe.scale);
    let y = Math.floor(vector.y / Universe.scale);
    if (isNaN(x) || isNaN(y)) {
        return 0;
    }
    return Math.min(Universe.gasMap[x][y], 100);
}

/**
 * 
 * @param {Vector} position 
 * @param {number} value 
 */
Universe.setGas = function (position, value) {
    let x = Math.floor(position.x / Universe.scale);
    let y = Math.floor(position.y / Universe.scale);
    Universe.gasMap[x][y] = value;

    Universe.gasChange.push({ position: new Vector(x, y), value: value });
    let view = new DataView(Universe.gasBuffer);
    view.setInt8(7 + x * Universe.size * Area.size + y, value);

}

Universe.gasChange = [];

Universe.scanned = {
    objects: [],
    gas: [],
    seen: []
};

Universe.scanUpdate = [];

/**
 * 
 * @param {Vector} position 
 * @param {number} range 
 */


const minimapScale = 2;
Universe.scan = function (position, range, speed) {
    let nearby = Universe.entitiesInRange(position, range);

    nearby.forEach(e => {
        if (!Universe.scanned.objects.includes(e)) {
            Universe.scanned.objects.push(e);
        }
    });

    const gasRange = Math.floor(range / Universe.scale / minimapScale);
    const px = Math.floor(position.x / Universe.scale / minimapScale);
    const py = Math.floor(position.y / Universe.scale / minimapScale);

    const angInc = 1 / gasRange;

    const backtrack = Math.ceil(speed / Universe.scale);
    const step = backtrack > 1 ? 0.5 : 1;

    const minimapSize = Universe.size * Area.size / Universe.scale / minimapScale;

    for (let a = 0; a < Math.PI * 2; a += angInc) {
        for (let range = 0; range < backtrack; range += step) {
            let x = Math.max(Math.min(Math.floor(Math.cos(a) * (gasRange - range) + px), minimapSize - minimapScale), 0);
            let y = Math.max(Math.min(Math.floor(Math.sin(a) * (gasRange - range) + py), minimapSize - minimapScale), 0);

            if (Universe.scanned.seen[x * minimapSize + y] == undefined || Universe.scanned.seen[x * minimapSize + y] != Universe.gasMap[x * minimapScale][y * minimapScale]) {
                Universe.scanned.seen[x * minimapSize + y] = Universe.gasMap[x * minimapScale][y * minimapScale];
                Universe.scanned.gas.push({ x: x, y: y, gas: Universe.gasMap[x * minimapScale][y * minimapScale] });
                Universe.scanUpdate.push({ x: x, y: y, gas: Universe.gasMap[x * minimapScale][y * minimapScale] });
            }
        }
    }
}

/**
 * 
 * @param {Vector} position 
 * @param {number} range 
 * @returns {Entity[]}
 */

Universe.entitiesInRange = function (position, range) {
    let proximity = [];
    for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {
            let adjusted = position.result();
            adjusted.x += x * Area.size;
            adjusted.y += y * Area.size;
            let area = Area.getLocalArea(adjusted);
            if (area != undefined) proximity.push(area);
        }
    }

    let nearby = [];
    proximity.forEach(a => {
        a.entities.forEach(e => {
            if (!nearby.includes(e)) {
                if (e.position.distance(position) <= range) {
                    nearby.push(e);
                }
            }
        });
    });
    return nearby;
}

exports.Universe = Universe;

for (let x = 0; x < Universe.size; x++) {
    Area.list[x] = [];
    for (let y = 0; y < Universe.size; y++) {
        Area.list[x][y] = new Area(x, y);
    }
}

/**
 * 
 * @param {bool} result 
 * @param {Vector} position 
 * @param {Vector} overlap 
 */
function CollisionResult(result, position, overlap) {
    this.result = result;
    if (result) {
        this.position = position;
        this.overlap = overlap;
    }
}

/**
 * 
 * @param {Ship} ship 
 * @param {Entity} entity 
 * @param {CollisionResult} result 
 */
function CollisionEvent(ship, entity, result) {
    this.shipId = ship.id;
    this.entityId = entity.id;
    let temp = result.position.mult(0.5)
    this.position = ship.position.result().sub(temp);
}
CollisionEvent.list = [];

exports.CollisionEvent = CollisionEvent;

function Shape() {
    this.circle = function (x, y, r) {
        this.line = undefined;
        this.type = Shape.types.circle;
        this.x = x;
        this.y = y;
        this.r = r;

        this.checkCollision = function (shape) {
            if (shape.type == Shape.types.circle) {
                // vrátí vektor o ktery se staci posunout, aby se hrac dostal mimo prekazku

                let relativ = new Vector(
                    shape.x - this.x,
                    shape.y - this.y
                );
                let distance = relativ.length();
                if (distance < shape.r + this.r) {
                    let result = relativ.normalize(distance - shape.r - this.r);
                    return new CollisionResult(true, new Vector(this.x, this.y).sub((new Vector(result.x, result.y)).normalize(this.r)), result);
                } else {
                    return new CollisionResult(false);
                }
            } else if (shape.type == Shape.types.line) {
                // vrátí vektor o ktery se staci posunout, aby se hrac dostal mimo prekazku

                let cara = new Vector(shape.x2 - shape.x1, shape.y2 - shape.y1);
                let v = new Vector(this.x - shape.x1, this.y - shape.y1);
                let normCara = new Vector(cara.x, cara.y);
                normCara.normalize(1);
                a = Vector.dot(normCara, v);
                let C;
                if (a < 0) {
                    C = new Vector(shape.x1, shape.y1);
                } else if (a > cara.length()) {
                    C = new Vector(shape.x2, shape.y2);
                } else {
                    C = (normCara.mult(a)).add(new Vector(shape.x1, shape.y1));
                }
                C.sub(new Vector(this.x, this.y));
                let Clen = C.length();
                if (Clen > this.r) {
                    return new CollisionResult(false);
                } else {
                    let result = C.normalize(Clen - this.r);
                    return new CollisionResult(true, new Vector(this.x, this.y).sub((new Vector(result.x, result.y)).normalize(this.r)), result);
                }
            }
        };
        this.rotate = function (angle) {
            let sin = Math.sin(angle);
            let cos = Math.cos(angle);
            let x = this.x;
            let y = this.y;
            this.x = x * cos - y * sin;
            this.y = x * sin + y * cos;
        }
        this.copy = function () {
            return new Shape().circle(this.x, this.y, this.r);
        }
        return this;
    };

    this.line = function (x1, y1, x2, y2) {
        this.circle = undefined;
        this.type = Shape.types.line;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;

        this.checkCollision = function (shape) {
            if (shape.type == Shape.types.circle) {
                // vrátí bod lezici na kruznici nejblize pocatku primky

                let d = new Vector(this.x2 - this.x1, this.y2 - this.y1);
                let f = new Vector(this.x1 - shape.x, this.y1 - shape.y);

                let a = Vector.dot(d, d);
                let b = 2 * Vector.dot(d, f);
                let c = Vector.dot(f, f) - shape.r * shape.r;
                let discriminant = b * b - 4 * a * c;
                if (discriminant < 0) {
                    return new CollisionResult(false);
                }
                discriminant = Math.sqrt(discriminant);

                let t1 = (-b - discriminant) / (2 * a);
                let t2 = (-b + discriminant) / (2 * a);

                if (t1 < 0) {
                    t1 = 2;
                }
                if (t2 < 0) {
                    t2 = 2;
                }
                t1 = Math.min(t1, t2);
                if (t1 > 1) {
                    return new CollisionResult(false);
                } else {
                    return new CollisionResult(true, (new Vector(this.x1, this.y1)).add(d.mult(t1)));
                }

            } else if (shape.type == Shape.types.line) {
                // vrátí průsečík dvou úseček nebo false

                a = new Vector(this.x1, this.y1);
                a_ = new Vector(this.x2 - this.x1, this.y2 - this.y1);
                b = new Vector(shape.x1, shape.y1);
                b_ = new Vector(shape.x2 - shape.x1, shape.y2 - shape.y1);
                let a_crossb_ = Vector.cross(a_, b_);
                if (a_crossb_ == 0) { // dvě přímky jsou rovnoběžné
                    return new CollisionResult(false);
                }
                t = Vector.cross(Vector.sub(b, a), b_) / a_crossb_;
                u = Vector.cross(Vector.sub(b, a), a_) / a_crossb_;

                if (t < 0 || t > 1 || u < 0 || u > 1) {
                    return new CollisionResult(false);
                } else {
                    a.add(a_.mult(t));
                    return new CollisionResult(true, a, null);
                }
            }
        };
        this.rotate = function (angle) {
            let sin = Math.sin(angle);
            let cos = Math.cos(angle);
            let x1 = this.x1;
            let y1 = this.y1;
            let x2 = this.x2;
            let y2 = this.y2;
            this.x1 = x1 * cos - y1 * sin;
            this.y1 = x1 * sin + y1 * cos;
            this.x2 = x2 * cos - y2 * sin;
            this.y2 = x2 * sin + y2 * cos;
        }

        this.copy = function () {
            return new Shape().line(this.x1, this.y1, this.x2, this.y2);
        }

        return this;
    };
}
Shape.types = { circle: 1, line: 2 };
exports.Shape = Shape;



function Item(id, stack) {
    this.id = id;
    this.stack = stack;
    this.stats = ItemInfo[id];

    this.clone = function() {
        return new Item(this.id, this.stack);
    }
}

exports.Item = Item;

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
            this.item.id = item.id;
            this.item.stats = ItemInfo[item.id];
            this.item.stack += taken;

            if (taken > 0) {
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
            let taken = slot.addItem(item);
            item.stack -= taken;
            if (item.stack == 0) break;
        }
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
        if (slot1.filter == -1 && slot2.filter == -1) {
            let temp = slot1.item.clone();
            slot1.removeItem(slot1.item.clone());
            slot1.addItem(slot2.item.clone());
            slot2.removeItem(slot2.item.clone());
            slot2.addItem(temp);
        }else if(slot1.filter == -1 && slot1.item.stats.tag == slot2.filter){
            let temp = slot2.item.clone();
            this.removeItem(slot2.item.clone());
            slot2.addItem(slot1.item.clone());
            let overflow = this.addItem(temp);
            if (overflow > 0) {
                let pos = Player.players.get(this.owner).ship.position;
                let drop = new ItemDrop(pos, temp, pos);
                drop.init();
            }
        }else if(slot2.filter == -1 && slot2.item.stats.tag == slot1.filter){
            let temp = slot1.item.clone();
            this.removeItem(slot1.item.clone());
            slot1.addItem(slot2.item.clone());
            let overflow = this.addItem(temp);
            if (overflow > 0) {
                let pos = Player.players.get(this.owner).ship.position;
                let drop = new ItemDrop(pos, temp, pos);
                drop.init();
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
 * @param {number} x 
 * @param {number} y 
 * @param {number} type 
 */
function Entity(x, y, type) {
    this.position = new Vector(x, y);
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.collisionPurpose = 0;
    this.type = type;
    this.rotatedCollider = [];
    this.rotatedColliderValid = false;
    /**
     * @type {Uint8Array}
     */
    this.bytes;
    this.bytesValid = false;
    /**
     * @type {Shape[]}
     */
    this.collider = [];
    this.bounds = 0;

    this.init = function () {
        this.id = Entity.next_id;
        Entity.next_id++;
        Entity.list.push(this);
        Area.checkIn(this);
    }

    this.delete = function () {
        Entity.remove.push(this.id);
        Area.checkOut(this);
        Entity.list.splice(Entity.list.indexOf(this), 1);
    }

    /**
     * 
     * @param {AutoView} inView 
     */
    this.serialize = function (inView) {

        if (this.bytesValid) {
            let index = inView.index;
            let array = new Uint8Array(inView.view.buffer);
            array.set(this.bytes, index);
            inView.index += this.bytes.length;
        } else {
            let index = inView.index;
            inView.serialize(this, Datagrams.EntitySetup);
            this.bytes = new Uint8Array(inView.view.buffer.slice(index, index + Datagrams.EntitySetup.size));
            this.bytesValid = true;
        }
    }

    this.update = function (dt) {
        this.bytesValid = false;
        this.rotatedColliderValid = false;
        this.rotation += this.rotationSpeed * dt;
        this.rotation = this.rotation % (Math.PI * 2);

    }
    this.rotateCollider = function () {
        this.rotatedCollider = [];
        this.collider.forEach(s => {
            let r = s.copy();
            r.rotate(this.rotation);
            this.rotatedCollider.push(r);
        });
        this.rotatedColliderValid = true;
    }

    this.calculateBounds = function () {
        this.collider.forEach(s => {
            let dist = 0;
            if (s.type == 2) {
                dist = Math.max(new Vector(s.x1, s.y1).length(), new Vector(s.x2, s.y2).length());
            } else {
                dist = new Vector(s.x, s.y).length() + s.r;
            }
            this.bounds = Math.max(dist, this.bounds);
        });

        this.bounds += maxInteractionRange;
    }

    this.colliderFromFile = function (file) {
        this.collider = [];
        let str = fs.readFileSync(file, "utf8");
        let shapes = JSON.parse(str);
        shapes.forEach(s => {
            let shape;
            let dist = 0;
            if (s.type == 2) {
                shape = new Shape().line(s.x1, s.y1, s.x2, s.y2);
                dist = Math.max(new Vector(s.x1, s.y1).length(), new Vector(s.x2, s.y2).length());
            } else {
                shape = new Shape().circle(s.x, s.y, s.r);
                dist = new Vector(s.x, s.y).length() + s.r;
            }
            this.bounds = Math.max(dist, this.bounds);
            this.collider.push(shape);
        });
        this.bounds += maxInteractionRange;
    }
}

Entity.list = [];
Entity.next_id = 0;
Entity.create = [];
Entity.remove = [];



Entity.CollisionFlags = {
    player: 1,
    projectile: 2,
    pickup: 4,
}

exports.Entity = Entity;


const maxInteractionRange = 600 + 60; //max resource size

function Mobile(x, y, type) {
    Entity.call(this, x, y, type);
    this.velocity = new Vector(0, 0);
    this.timer = 0;
    this.control = function (dt) { };
    this.update = function (dt) {
        this.rotatedColliderValid = false;
        this.bytesValid = false;
        this.timer++;
        this.timer = this.timer % 100;
        this.control(dt);
        Area.moveMe(this);
        this.position.add(this.velocity.result().mult(dt));

        this.rotation += this.rotationSpeed * dt;
        this.rotation = this.rotation % (Math.PI * 2);
    }
}

exports.Mobile = Mobile;

function Building(x, y, type) {
    Entity.call(this, x, y, type);
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
exports.Building = Building;

/**
 * 
 * @param {Vector} position
 * @param {Item} item 
 * @param {Vector} source 
 */
function ItemDrop(position, item, source) {
    if (item.stack <= 0) return;
    Entity.call(this, position.x, position.y, -1);
    this.item = item;
    this.bounds = 125;
    this.collisionPurpose = Entity.CollisionFlags.pickup;
    this.rotatedCollider.push(new Shape().circle(0, 0, 125));
    this.rotatedColliderValid = true;

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
        Area.checkIn(this);
        ItemDrop.create.push(this);
    }

    this.delete = function () {
        Area.checkOut(this);
        Entity.list.splice(Entity.list.indexOf(this), 1);
        ItemDrop.remove.push(this);
    }
}

ItemDrop.create = [];
ItemDrop.remove = [];
exports.ItemDrop = ItemDrop;

let Action = {};

/**
 * 
 * @param {Ship} ship 
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
 * @param {Ship} ship 
 * @param {SmartAction} action
 */
Action.buildTest = function (ship, action) {
    action.replyData = {};
    if (/*ship.inventory.countItem(Items.ore) >= 3 && */construct(ship, Buildings.navBeacon)) {
        //ship.inventory.removeItem(new Item(Items.ore, 3));
        action.replyData.id = 0;
        return 0.1;
    } else {
        action.replyData.id = 0;
        return 0.1;
    }
}

/**
 * 
 * @param {Ship} ship 
 * @param {SmartAction} action 
 */
Action.MineRock = function (ship, action) {
    let localArea = Area.getLocalArea(ship.position);

    let closestDist = 500;
    let closest = undefined;
    if (localArea != undefined) {
        for (let i = 0; i < localArea.entities.length; i++) {
            const e = localArea.entities[i];
            if (closestDist > ship.position.distance(e.position) && e.type == 1) {
                closestDist = ship.position.distance(e.position);
                closest = e;
            }
        }
    }

    action.replyData = {};
    if (closest != undefined) {
        ship.inventory.addItem(new Item(Items.ore, 10));
        action.replyData.id = 0;
        closest.delete();
    } else {
        action.replyData.id = 0;
    }

    return 1;
}

/**
 * 
 * @param {Ship} ship 
 * @param {SmartAction} action
 */
 Action.DropItem = function (ship, action) {
    action.replyData = {};
    const slot = ship.inventory.slots[action.slot];
    if (slot.item.stack >= action.stack && action.stack > 0) {
        let drop = new ItemDrop(action.position, new Item(slot.item.id, action.stack), ship.position);
        slot.removeItem(new Item(slot.item.id, action.stack));
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
 * @param {Ship} ship 
 * @param {SmartAction} action 
 */
 Action.SwapSlots = function (ship, action) {
    action.replyData = {};
    ship.inventory.swapSlots(action.slot1, action.slot2);
    action.replyData.id = 0;
    return 0.1;
}

/**
 * @type {Entity[],Building[]}
 */
Building.navBeacons = [];

/**
 * 
 * @param {Ship} ship 
 * @param {*} building 
 */
function construct(ship, building) {
    let position = ship.position.result();
    position.add(Vector.fromAngle(ship.rotation).mult(500));
    if (isAvalible(position, building.size)) {
        let build = new Building(position.x, position.y, building.type);
        build.collider.push(new Shape().circle(0, 0, building.size));
        build.collisionPurpose = Entity.CollisionFlags.player + Entity.CollisionFlags.projectile;
        build.calculateBounds();
        build.setup = building.setup || build.setup;
        build.setup();
        build.control = building.control || build.control;
        Entity.create.push(build);
        return true;
    }
    return false;
}

function isAvalible(position, size) {
    let out = true;
    let localArea = Area.getLocalArea(position);

    if (localArea != undefined) {
        for (let i = 0; i < localArea.entities.length; i++) {
            const e = localArea.entities[i];
            let relativePos = position.result();
            relativePos.x -= e.position.x;
            relativePos.y -= e.position.y;
            let collisionShape = new Shape().circle(relativePos.x, relativePos.y, size);
            let res;
            if (!e.rotatedColliderValid) {
                e.rotateCollider();
            }

            e.rotatedCollider.forEach(s => {
                res = collisionShape.checkCollision(s);
                if (res.result) {
                    out = false;
                    return;
                }
            });
        }
    }

    let collisionShape = new Shape().circle(position.x, position.y, size);
    Player.players.forEach(p => {
        let s = new Shape().circle(p.ship.position.x, p.ship.position.y, 60);
        res = collisionShape.checkCollision(s);
        if (res.result) {
            out = false;
            return;
        }
    });

    return out;
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

/**
 * 
 * @param {number} id 
 */
function Ship(id) {
    /**
     * @type {ShipType}
     */
    this.stats;
    this.position = new Vector(Universe.size * Area.size / 2, Universe.size * Area.size / 2);
    this.velocity = new Vector(0, 0);
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.control = new Vector(0, 0);
    this.afterBurnerActive = 0;
    this.afterBurnerUsed = 0;
    this.afterBurnerFuel = 600;
    this.debuff = 0;
    this.action = 0;
    this.cooldowns = [];
    this.inventory;

    /**
     * @type {Inventory}
     */
    this.inventory;
    /**
    * @type {number} id of the player who owns this ship
    */
    this.id = id;

    /**
     * 
     * @param {ShipType} type 
     */
    this.init = function (type) {
        this.stats = type;
        for (let i = 0; i < type.actionPool.length; i++) {
            this.cooldowns[i] = 0;
        }

        this.inventory = new Inventory(this.stats.cargoCapacity, this.id, this.stats.inventory);
        Universe.scan(this.position, this.stats.radarRange, this.stats.radarRange);
    };

    this.update = function (dt) {
        let stats = this.stats;
        let afterBurnerUsed = false;
        let gas = Universe.getGas(this.position);

        if (this.debuff != gas) {
            if (this.debuff > gas) {
                this.debuff -= dt * 5;
                if (this.debuff < gas) {
                    this.debuff = gas;
                }
            } else {
                this.debuff += dt * 5;
                if (this.debuff > gas) {
                    this.debuff = gas;
                }
            }
        }

        let debuffMult = 1 - this.debuff / 110;

        if (this.afterBurnerFuel <= 0) {
            this.afterBurnerActive = 0;
        }


        if (this.control.x != 0) {
            // rotationace
            this.rotation += this.rotationSpeed * dt;
            this.rotationSpeed = (stats.rotationSpeed +
                this.afterBurnerActive * stats.afterBurnerRotationBonus) *
                this.control.x;
            afterBurnerUsed = true;
        } else if (this.rotationSpeed != 0) {
            this.rotation += this.rotationSpeed * dt;
            this.rotationSpeed = 0;
        }

        if (this.control.y != 0) {
            // zrychlení / brždění
            let pointing = Vector.fromAngle(this.rotation).mult(
                this.control.y
            );
            if (this.control.y > 0) {
                pointing.normalize(
                    stats.acceleration +
                    this.afterBurnerActive *
                    stats.afterBurnerAccelerationBonus
                );
            } else {
                pointing.normalize(
                    stats.reverseAccelreation +
                    this.afterBurnerActive *
                    stats.afterBurnerAccelerationBonus
                );
            }
            afterBurnerUsed = true;
            pointing.mult(dt);
            this.velocity.add(pointing);
        } else {
            if (this.velocity.length() < Ship.minSpeed) {
                this.velocity = Vector.zero();
            }
        }
        this.velocity.mult(1 - stats.drag * dt);

        let navBoost = 0;
        for (let i = 0; i < Building.navBeacons.length; i++) {
            const beacon = Building.navBeacons[i];
            let diff = beacon.position.result().sub(this.position);

            if (diff.length() > Buildings.navBeacon._range) continue;

            let angle = Math.atan2(diff.y, diff.x);
            angle = Math.atan2(Math.sin(angle - this.rotation), Math.cos(angle - this.rotation))
            Player.players.get(this.id).debug += "   Angle: " + angle.toFixed(2) + "\n";
            if (Math.abs(angle) < Buildings.navBeacon._angle / 2) {
                navBoost = Buildings.navBeacon._speedBonus;
                break;
            }
        }

        let absoluteLimit = stats.speed + stats.afterBurnerSpeedBonus + navBoost;
        if (this.velocity.length() > absoluteLimit) {
            this.velocity.normalize(absoluteLimit);
        }

        let targetSpeed = stats.speed * debuffMult + stats.afterBurnerSpeedBonus * this.afterBurnerActive * debuffMult + navBoost;
        let speed = this.velocity.length();
        if (speed > targetSpeed) {
            this.velocity.normalize(speed - stats.acceleration * dt - this.afterBurnerActive * stats.afterBurnerAccelerationBonus * dt);
            if (this.velocity.length() < targetSpeed) this.velocity.normalize(targetSpeed);
        }

        Player.players.get(this.id).debug += "  Speed: " + this.velocity.length().toFixed(2) + "/" + targetSpeed.toFixed(2) + "\n";
        for (let i = 0; i < this.inventory.slots.length; i++) {
            Player.players.get(this.id).debug += "      " + i + ": [" + this.inventory.slots[i].filter + "] " + this.inventory.slots[i].item.id + " x" + this.inventory.slots[i].item.stack + " / " + this.inventory.slots[i].capacity + "\n";
        }

        Player.players.get(this.id).debug += "  Cargo: " + this.inventory.used + "/" + this.inventory.capacity;

        this.position.add(this.velocity.result().mult(dt));
        this.afterBurnerUsed = 0;
        if (
            this.afterBurnerActive == 1 &&
            (afterBurnerUsed || this.velocity.length() > stats.speed * debuffMult)
        ) {
            this.afterBurnerFuel -= dt;
            this.afterBurnerFuel = Math.max(0, this.afterBurnerFuel);
            this.afterBurnerUsed = 1;
        }
        if (this.position.x < 0) {
            this.position.x = 0;
        }
        if (this.position.y < 0) {
            this.position.y = 0;
        }
        if (this.position.x > Universe.size * Area.size) {
            this.position.x = Universe.size * Area.size - 1;
        }
        if (this.position.y > Universe.size * Area.size) {
            this.position.y = Universe.size * Area.size - 1;
        }
        this.handleAction(dt);
        this.checkCollision(dt);
        Universe.scan(this.position, this.stats.radarRange, speed);
    };

    this.handleAction = function (dt) {
        for (let i = 0; i < this.cooldowns.length; i++) {
            if (this.cooldowns[i] > 0) {
                this.cooldowns[i] -= dt;
            } else {
                this.cooldowns[i] = 0;
            }
        }

        let toHandle = Player.players.get(this.id).actions;
        let replies = Player.players.get(this.id).replies;

        for (let i = 0; i < toHandle.length; i++) {
            const a = toHandle[i];
            if (this.stats.actionPool[a.actionId] != undefined) {
                if (this.cooldowns[a.actionId] == 0) {
                    this.cooldowns[a.actionId] = this.stats.actionPool[a.actionId](this, a);
                    replies.push(a.reply());
                } else {
                    let reply = a.reply(2);
                    reply.time = this.cooldowns[a.actionId];
                    replies.push(reply);
                }
            } else {
                let reply = a.reply(1);
                replies.push(reply);
            }
        }
        Player.players.get(this.id).actions = [];
    }

    this.checkCollision = function (dt) {
        let size = this.stats.size;
        let localArea = Area.getLocalArea(this.position);

        if (localArea != undefined) {
            for (let i = 0; i < localArea.entities.length; i++) {
                const e = localArea.entities[i];
                if ((e.collisionPurpose & Entity.CollisionFlags.player) != Entity.CollisionFlags.player) {
                    if ((e.collisionPurpose & Entity.CollisionFlags.pickup) == Entity.CollisionFlags.pickup) {
                        let relativePos = this.position.result();
                        relativePos.x -= e.position.x;
                        relativePos.y -= e.position.y;
                        let collisionShape = new Shape().circle(relativePos.x, relativePos.y, size);
                        let res;
                        e.rotatedCollider.forEach(s => {
                            res = collisionShape.checkCollision(s);
                            if (res.result) {
                                let left = this.inventory.addItem(e.item);
                                if (left > 0) {
                                    e.item.stack = left;
                                } else {
                                    e.delete();
                                }
                            }
                        });
                    }
                    continue;
                }
                let relativePos = this.position.result();
                relativePos.x -= e.position.x;
                relativePos.y -= e.position.y;
                let collisionShape = new Shape().circle(relativePos.x, relativePos.y, size);
                let res;
                if (!e.rotatedColliderValid) {
                    e.rotateCollider();
                }

                e.rotatedCollider.forEach(s => {
                    res = collisionShape.checkCollision(s);
                    if (res.result) {
                        this.position.add(res.overlap);
                        res.overlap.normalize();
                        res.overlap.mult(-Math.min(Vector.dot(res.overlap, this.velocity), 0) * 2);
                        this.velocity.add(res.overlap);
                        this.velocity.mult(0.8);
                        relativePos = this.position.result();
                        relativePos.x -= e.position.x;
                        relativePos.y -= e.position.y;
                        collisionShape.x = relativePos.x;
                        collisionShape.y = relativePos.y;
                        CollisionEvent.list.push(new CollisionEvent(this, e, res));
                    }
                });
            }
        }
    }
}

Ship.minSpeed = 0.2;
exports.Ship = Ship;

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
     * @type {SmartAction[]}
     */
    this.actions = [];
    this.replies = [];
    this.debug = "";
    this.send = function (data) {
        if (this.connection.readyState == 1) this.connection.send(data);
    };
    this.init = function () {
        this.ship = new Ship(this.id);
        this.ship.init(ShipType.types[this.shipType]);
    };
    /**
     * @returns {Entity[]}
     */
    this.proximity = function () {
        let proximity = [];
        let coords = this.ship.position.result();

        for (let y = -1; y <= 1; y++) {
            for (let x = -1; x <= 1; x++) {
                let adjusted = coords.result();
                adjusted.x += x * Area.size;
                adjusted.y += y * Area.size;
                let area = Area.getLocalArea(adjusted);
                if (area != undefined) proximity.push(area);
            }
        }

        let nearby = [];
        proximity.forEach(a => {
            a.entities.forEach(e => {
                if (!nearby.includes(e)) {
                    nearby.push(e);
                }
            });
        });

        return nearby;
    };
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

//#endregion

const Items = require("./items.js").defineItems();
const ShipType = require("./shipTypes.js").defineShips(Action);
const ItemInfo = require("./items.js").defineItemInfo();
const Buildings = require("./buildings.js").defineBuildings(Building, Universe, Vector, Ship, Entity);