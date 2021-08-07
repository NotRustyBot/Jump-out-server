const {Vector} = require("./vector");


function Area(x, y) {
    /**
 * @type {import("./entity").Entity[]}
 */
    this.entities = [];
    if (y == undefined) {
        this.level = x;
    }
    this.coordinates = new Vector(x, y);
    this.position = new Vector(Area.size * x, Area.size * y);
}
Area.size = 5000;
/**
 * @type {Area[][]}
 */
Area.list = [];
/**
 * @type {Area[]}
 */
Area.levels = [];
/**
 * 
 * @param {import("./entity").Entity} entity 
 */
Area.checkIn = function (entity, level) {
    level = level || 0;

    if (level != 0) {
        Area.levels[level].entities.push(entity);
        return;
    }

    let position = entity.position;
    let x = Math.floor((position.x + entity.bounds) / Area.size);
    let y = Math.floor((position.y + entity.bounds) / Area.size);
    let area = Area.list[x][y];
    try {
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
    } catch (error) {
        console.log("entity out of bounds : \n" + error);
    }

};

/**
 * 
 * @param {import("./entity").Entity} entity 
 */
Area.checkOut = function (entity, level) {
    level = level || 0;

    if (level != 0) {
        let area = Area.levels[level];
        if (area.entities.includes(entity)) {
            area.entities.splice(area.entities.indexOf(entity), 1);
        }
        return;
    }

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
 * @param {import("./mobile").Mobile} mobile 
 */
Area.moveMe = function (mobile, dt) {
    let level = mobile.level || 0;
    let position = mobile.position;
    if (level != 0) {
        mobile.position = position.result().add(mobile.velocity.result().mult(dt));
        return;
    }

    let newPosition = position.result().add(mobile.velocity.result().mult(dt));
    let x = Math.floor((position.x + mobile.bounds) / Area.size);
    let y = Math.floor((position.y + mobile.bounds) / Area.size);
    let nx = Math.floor((newPosition.x + mobile.bounds) / Area.size);
    let ny = Math.floor((newPosition.y + mobile.bounds) / Area.size);

    if (x == nx && y == ny) {
        x = Math.floor((position.x - mobile.bounds) / Area.size);
        y = Math.floor((position.y + mobile.bounds) / Area.size);
        nx = Math.floor((newPosition.x - mobile.bounds) / Area.size);
        ny = Math.floor((newPosition.y + mobile.bounds) / Area.size);
        if (x == nx && y == ny) {
            x = Math.floor((position.x + mobile.bounds) / Area.size);
            y = Math.floor((position.y - mobile.bounds) / Area.size);
            nx = Math.floor((newPosition.x + mobile.bounds) / Area.size);
            ny = Math.floor((newPosition.y - mobile.bounds) / Area.size);
            if (x == nx && y == ny) {
                x = Math.floor((position.x - mobile.bounds) / Area.size);
                y = Math.floor((position.y - mobile.bounds) / Area.size);
                nx = Math.floor((newPosition.x - mobile.bounds) / Area.size);
                ny = Math.floor((newPosition.y - mobile.bounds) / Area.size);
                if (x == nx && y == ny) {
                    mobile.position = newPosition;
                    return;
                }
            }
        }
    }

    Area.checkOut(mobile);
    mobile.position = newPosition;
    Area.checkIn(mobile);

};

/**
 * 
 * @param {Vector} position 
 * @returns {Area}
 */
 Area.getLocalArea = function (position, level) {
    level = level || 0;

    if (level == 0) {
        let x = Math.floor(position.x / Area.size);
        let y = Math.floor(position.y / Area.size);

        if (Area.list[x] != undefined && Area.list[x][y] != undefined) {
            return Area.list[x][y];
        }
    } else {
        return Area.levels[level];
    }
}

exports.Area = Area;