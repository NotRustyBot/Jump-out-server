const { Vector, ShipType, Shape, Ship, Player, Entity, CollisionEvent, Universe, Area, SmartAction, Datagram, Datagrams, AutoView, serverHeaders, clientHeaders, SmartActionData, ActionId, ReplyData, Item, ItemDrop, Inventory, Building, Mobile } = require("./gameobjects.js");
const { createCanvas } = require('canvas');
const fs = require('fs');

exports.Vector = Vector
exports.ShipType = ShipType
exports.Ship = Ship
exports.Player = Player
exports.Entity = Entity
exports.CollisionEvent = CollisionEvent
exports.Universe = Universe
exports.Area = Area
exports.SmartAction = SmartAction
exports.Datagram = Datagram
exports.Datagrams = Datagrams
exports.AutoView = AutoView
exports.serverHeaders = serverHeaders
exports.clientHeaders = clientHeaders
exports.SmartActionData = SmartActionData
exports.ActionId = ActionId
exports.ReplyData = ReplyData
exports.ItemDrop = ItemDrop
exports.Item = Item
exports.Inventory = Inventory

function randomSeedParkMiller(seed = 123456) {
	// doesn't repeat b4 JS dies.
	// https://gist.github.com/blixt/f17b47c62508be59987b
	seed = seed % 2147483647;
	return () => {
		seed = (seed * 16807) % 2147483647;
		return (seed - 1) / 2147483646;
	};
}

Math.random = randomSeedParkMiller();

("use strict"); //https://github.com/joeiddon/perlin
let perlin = {
	rand_vect: function () {
		let theta = Math.random() * 2 * Math.PI;
		return { x: Math.cos(theta), y: Math.sin(theta) };
	},
	dot_prod_grid: function (x, y, vx, vy) {
		let g_vect;
		let d_vect = { x: x - vx, y: y - vy };
		if (this.gradients[[vx, vy]]) {
			g_vect = this.gradients[[vx, vy]];
		} else {
			g_vect = this.rand_vect();
			this.gradients[[vx, vy]] = g_vect;
		}
		return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
	},
	smootherstep: function (x) {
		return 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
	},
	interp: function (x, a, b) {
		return a + this.smootherstep(x) * (b - a);
	},
	seed: function () {
		this.gradients = {};
	},
	memory: {},
	get: function (x, y) {
		if (this.memory.hasOwnProperty([x, y])) return this.memory[[x, y]];
		let xf = Math.floor(x);
		let yf = Math.floor(y);
		//interpolate
		let tl = this.dot_prod_grid(x, y, xf, yf);
		let tr = this.dot_prod_grid(x, y, xf + 1, yf);
		let bl = this.dot_prod_grid(x, y, xf, yf + 1);
		let br = this.dot_prod_grid(x, y, xf + 1, yf + 1);
		let xt = this.interp(x - xf, tl, tr);
		let xb = this.interp(x - xf, bl, br);
		let v = this.interp(y - yf, xt, xb);
		this.memory[[x, y]] = v;
		return v;
	},
};

perlin.seed();

let w = 1000;
let h = 1000;
let subres = 1;

let scale = 80;

let circle = 2;
let falloff = 20;
let shift = 0;
let mult = 4;

let gasBuffer = new ArrayBuffer(1000007);
let view = new AutoView(gasBuffer);
view.setUint8(serverHeaders.gasData);
view.setUint16(100);
view.setUint16(w);
view.setUint16(h);


let debugMap = true;
if (debugMap) {
	let obj = JSON.parse(fs.readFileSync("perlin_data.json"));
	perlin.memory = obj.memory;
	perlin.gradients = obj.gradients;
}

const canvas = createCanvas(w, w);
const context = canvas.getContext('2d');

context.fillStyle = '#000';
context.fillRect(0, 0, w, h);

function distance(x1, y1, x2, y2) {
	var a = x1 - x2;
	var b = y1 - y2;

	return (c = Math.sqrt(a * a + b * b));
}

function voidCircle(x1, y1, r, p) {
	let dMode = (p == 0);
	p = Math.min(p, 1);
	for (let y = Math.floor(y1 - r); y < y1 + r; y += subres) {
		for (let x = Math.floor(x1 - r); x < x1 + r; x += subres) {
			let dist = distance(x, y, x1, y1);
			if (dist < r && x > 10 && x < w - 10 && y > 10 && y < h - 10) {
				if (dMode) {
					p = Math.pow(dist / r, 4);
				}
				gasMap[x / subres][y / subres] = Math.floor(gasMap[x / subres][y / subres] * p);
			}
		}
	}
}

let gasMap = [];
for (let x = 0; x < w; x += subres) {
	gasMap[x / subres] = [];
	for (let y = 0; y < w; y += subres) {
		let level = Math.abs(perlin.get(x / scale, y / scale));
		let level2 = (perlin.get((x + 9999 * subres) / scale, y / scale) + 1) / 2;

		level *= level2;
		level = 100 * level;

		level = Math.min(level * mult, 100)

		let dist = distance(x, y, w / 2, h / 2);
		if (dist < circle) {
			level = 0;
		} else if (dist < falloff) {
			let close = 1 - (dist - circle) / (falloff - circle);
			level = level - close * 100;
		}

		if (x < 10 || x > w - 10 || y < 10 || y > h - 10) {
			level = 100;
		}

		level = level - shift;
		
		if (level < 0) {
			level = 0;
		}

		gasMap[x / subres][y / subres] = Math.floor(level);
	}
}

for (let c = 0; c < 20; c++) {
	voidCircle(Math.random() * w, Math.random() * h, 30, 0);
}

for (let c = 0; c < 20; c++) {
	let obj = {
		x: 200,
		y: 800,
		dx: Math.random() * 2,
		dy: Math.random() * 1 - 0.5,
	};
	for (let t = 0; t < 1000; t++) {
		let v = 1 + (Math.abs(obj.dx) + Math.abs(obj.dy)) / 10;
		v = 1 / v;
		voidCircle(obj.x, obj.y, Math.max(Math.min(20, 100 / (1 + t / 10)), 2), 0.98);
		obj.x += obj.dx;
		obj.y += obj.dy;
		obj.dx = obj.dx * 0.995;
		obj.dy = obj.dy * 0.995;
	}
}

let SpawnRules = {
	asteroids: {
		count: 5000,
		area: 2500,
		oreChance: 0.5,
		oreMaxCount: 3,
		rareChance: 0,
		gasThreshold: 30,
		gasRareThreshold: 80,
		rotationSpeed: 0.1,
		clusterSize: 50,
	},
};

Universe.init = function () {
	Universe.scale = Universe.size * Area.size / gasMap.length;
	Universe.gasBuffer = gasBuffer;
	let view = new DataView(gasBuffer);
	view.setUint16(1, Universe.scale);
	Universe.gasMap = gasMap;
	let mid = new Vector(Universe.size * Area.size / 2, Universe.size * Area.size / 2);

	for (let i = 0; i < SpawnRules.asteroids.count;) {
		let clusterPos = new Vector(Math.random() * (Area.size * (Universe.size - 2)) + Area.size, Math.random() * (Area.size * (Universe.size - 2)) + Area.size);
		let clusterSize = Math.floor(Math.min(SpawnRules.asteroids.count - i, Math.random() * SpawnRules.asteroids.clusterSize / 2 + SpawnRules.asteroids.clusterSize / 2 + 1));
		for (let b = 0; b < clusterSize; b++) {
			let offset = new Vector(Math.random() * SpawnRules.asteroids.area + SpawnRules.asteroids.area / 2, Math.random() * SpawnRules.asteroids.area + SpawnRules.asteroids.area / 2);
			let pos = clusterPos.result().add(offset);
			let asteroid = new Entity(pos.x, pos.y, 1);
			//asteroid.collider.push(new Shape().circle(0, 0, 200));
			asteroid.colliderFromFile("hitboxes/asteroid.json");

			//asteroid.calculateBounds();
			asteroid.collisionPurpose = Entity.CollisionFlags.player + Entity.CollisionFlags.projectile;
			let area = Area.getLocalArea(pos);
			let colliding = false;
			area.entities.forEach(e => {
				let relativeCoords = pos.result().sub(e.position);
				if (relativeCoords.inbound(e.bounds + asteroid.bounds)) {
					colliding = true;
					clusterSize--;
					return;
				}
			});

			if (colliding) continue;
			if (Universe.getGas(pos) <= SpawnRules.asteroids.gasThreshold) {
				asteroid.rotationSpeed = Math.random() * SpawnRules.asteroids.rotationSpeed * 2 - SpawnRules.asteroids.rotationSpeed;
				asteroid.init();
			} else if (Universe.getGas(pos) <= SpawnRules.asteroids.gasRareThreshold) {
				asteroid.rotationSpeed = 2;
				asteroid.init();
			}
		}
		i += clusterSize;
	}
	Entity.remove = [];
	let e1 = new Entity(mid.x + 1000, mid.y, 1);
	e1.colliderFromFile("hitboxes/asteroid.json");
	e1.calculateBounds();
	e1.init();
	e1.collisionPurpose = Entity.CollisionFlags.player;

	let e2 = new Entity(mid.x - 1000, mid.y, 1);
	//e2.colliderFromFile("hitboxes/plane.json");
	e2.collider.push(new Shape().circle(0, 0, 200));
	e2.calculateBounds();
	e2.init();
	e2.collisionPurpose = Entity.CollisionFlags.player;
}
Universe.init();

let toSave = {
	memory: perlin.memory,
	gradients: perlin.gradients
};
if (!debugMap) {
	let str = JSON.stringify(toSave);
	fs.writeFileSync("perlin_data.json", str);
}

for (let x = 0; x < w; x += subres) {
	for (let y = 0; y < h; y += subres) {

		let level = gasMap[x][y];
		context.fillStyle = "rgba(" + level + "," + level + "," + level + "," + 1 + ")";
		context.fillRect(x * subres, y * subres, subres, subres);
		view.setUint8(level);
	}
}


for (let i = 0; i < Entity.list.length; i++) {
	const e = Entity.list[i];
	context.fillStyle = "rgba(255,0,0,1)";
	context.fillRect(Math.floor(e.position.x / 400), Math.floor(e.position.y / 400), 1, 1);
}

const buffer = canvas.toBuffer('image/png')
fs.writeFileSync('./minimap.png', buffer)

exports.gasMap = gasMap;
exports.gasBuffer = gasBuffer;

let i = new ItemDrop(Universe.size * Area.size / 2, Universe.size * Area.size / 2 + 500, new Item(5, 1));
i.init();


process.env.HOLOUBCI = process.env.HOLOUBCI || 0;
for (let index = 0; index < parseInt(process.env.HOLOUBCI); index++) {
    let m1 = new Mobile(Universe.size * Area.size / 2 + 2000, Universe.size * Area.size / 2, 3);
    m1.collider.push(new Shape().circle(0, 0, 125));
    m1.calculateBounds();
    m1.collisionPurpose = Entity.CollisionFlags.projectile;
    m1.init();
    m1.control = function (dt) {
        if (this.startPos == undefined) {
            this.startPos = this.position.result();
        }

        let closest = 1500;
        let target = undefined;
        Player.players.forEach(p => {
            let dist = p.ship.position.distance(this.position);
            if (dist < closest) {
                target = p.ship;
                closest = dist;
            }
        });
        if (target != undefined) {
            if (closest < 500) {
                this.velocity = Vector.zero();
            } else {
                this.velocity = target.position.result().sub(this.position);
                this.velocity.normalize(dt * 600);
            }
        } else {
            if (Vector.sub(this.startPos, this.position).length() > 3000) {
                this.velocity = Vector.sub(this.startPos, this.position);
                this.velocity.normalize(dt * 300);
            } else if (Math.random() < 0.01) {
                this.velocity = new Vector(Math.random(), Math.random());
                this.velocity.normalize(dt * 300);
            }
        }
        this.rotation = this.velocity.toAngle();
    }
}

