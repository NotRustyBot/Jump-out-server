const {Area} = require("./area");
const {Vector} = require("./vector");
const {Entity} = require("./entity");


let Universe = {};
Universe.size = 80; // area v jedné ose

/**
 * 
 * @param {Vector} vector position to check
 */
Universe.getGas = function (vector, level) {
    if (level) {
        return 0;
    }
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

Universe.unscan = function (e) {
    if (e.velocity != undefined) {
        Universe.scanned.mobile.set(e.id, { id: e.id, position: e.position, type: 0 });
    } else {
        Universe.scanned.objects.set(e.id, { id: e.id, position: e.position, type: 0 });
    }
    Universe.scanned.allObjects.delete(e.id);
}

Universe.scanned = {
    /**@type {Entity} */
    static: [],
    /**@type {import("./mobile").Mobile} */
    mobile: [],
    objects: new Map(),
    allObjects: new Map(),
    gas: [],
    seen: []
};

Universe.scanUpdate = [];
const minimapScale = 2;
/**
 * 
 * @param {Vector} position 
 * @param {number} range 
 */
Universe.scan = function (position, range, speed, level) {
    let nearby = Universe.entitiesInRange(position, range, level);
    nearby.forEach(e => {
        if (!e.noScan && (!(Universe.scanned.static.includes(e) || Universe.scanned.mobile.includes(e)) && position.distance(e.position) <= range)) {
            let obj;
            if (e.velocity != undefined) {
                Universe.scanned.mobile.push(e);
                obj = { id: e.id, position: e.position, type: 2 };
                Universe.scanned.objects.set(e.id, obj);
            } else {
                Universe.scanned.static.push(e);
                obj = { id: e.id, position: e.position, type: 1 };
                Universe.scanned.objects.set(e.id, obj);
            }
            Universe.scanned.allObjects.set(e.id, obj);
        }
    });

    if (level > 0) {
        return;
    }

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
 * @returns {import("./mobile").Mobile[]}
 */

Universe.entitiesInRange = function (position, range, level) {
    level = level || 0;
    let proximity = [];
    if (level == 0) {
        let areaRange = Math.ceil(range / 2 / Area.size) + 1;
        for (let y = -areaRange; y <= areaRange; y++) {
            for (let x = -areaRange; x <= areaRange; x++) {
                let adjusted = position.result();
                adjusted.x += x * Area.size;
                adjusted.y += y * Area.size;
                let area = Area.getLocalArea(adjusted);
                if (area != undefined) proximity.push(area);
            }
        }
    } else {
        let area = Area.getLocalArea(position, level);
        proximity.push(area);
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

Universe.comms = {};
/**
 * @type {Map<number,import("./marker").Marker>}
 */
Universe.comms.markers = new Map();

for (let x = 0; x < Universe.size; x++) {
    Area.list[x] = [];
    for (let y = 0; y < Universe.size; y++) {
        Area.list[x][y] = new Area(x, y);
    }
}

exports.Universe = Universe;