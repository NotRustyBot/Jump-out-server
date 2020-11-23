const { Datagram, Datagrams, AutoView, serverHeaders, clientHeaders } = require("./datagram.js");
const { Vector, ShipType, Ship, Player, Entity, CollisionEvent, Universe, Area, Shape} = require("./gameobjects.js");
const { createCanvas } = require('canvas');
const fs = require('fs');

function randomSeedParkMiller(seed = 123456) {
	// doesn't repeat b4 JS dies.
	// https://gist.github.com/blixt/f17b47c62508be59987b
	seed = seed % 2147483647;
	return () => {
		seed = (seed * 16807) % 2147483647;
		return (seed - 1) / 2147483646;
	};
}

Math.random = randomSeedParkMiller(Math.random());

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

let circle = 5;
let falloff = 20;
let shift = 0;
let mult = 4;

let gasBuffer = new ArrayBuffer(1000007);
let view = new AutoView(gasBuffer);
view.setUint8(serverHeaders.gasData);
view.setUint16(100);
view.setUint16(w);
view.setUint16(h);

const canvas = createCanvas(w, w);
const context = canvas.getContext('2d');

context.fillStyle = '#000';
context.fillRect(0, 0, w, h);

function distance(x1, y1, x2, y2) {
	var a = x1 - x2;
	var b = y1 - y2;

	return (c = Math.sqrt(a * a + b * b));
}

function voidCircle(x1, y1, r,p) {
	let dMode = (p == 0);
	p = Math.min(p,1);
	for (let y = Math.floor(y1-r); y < y1 + r; y += subres) {
		for (let x = Math.floor(x1-r); x < x1 + r; x += subres) {
			let dist = distance(x, y, x1, y1);
			if (dist < r && x > 10 && x < w-10 && y > 10 && y < h-10) {
				if(dMode){
					p = Math.pow(dist/r,4);
				}
				gasMap[y / subres][x / subres] = Math.floor(gasMap[y / subres][x / subres]*p);
			}
		}
	}
}

let gasMap = [];
for (let y = 0; y < h; y += subres) {
	gasMap[y / subres] = [];
	for (let x = 0; x < w; x += subres) {
		let level = Math.abs(perlin.get(x / scale, y / scale));
		let level2 = (perlin.get((x+9999*subres) / scale, y / scale)+1)/2;

		level *= level2;
		level = 100*level;

		let dist = distance(x, y, w / 2, h / 2);
		if (dist < circle) {
			level = 0;
		} else if (dist < falloff) {
			let close = 1 - (dist - circle) / (falloff - circle);
			level = level - Math.pow(close, 3) * 100;
		}

		if(x < 10 || x > w-10|| y< 10 || y > h-10){
			level = 100;
		}

		level = level - shift;
		level = Math.min(level * mult, 100)
		if (level < 0) {
			level = 0;
		}

		gasMap[y / subres][x / subres] = Math.floor(level);
	}
}

for (let c = 0; c < 20; c++) {
	voidCircle(Math.random()*w, Math.random()*h, 30,0 );
}

for (let c = 0; c < 20; c++) {
	let obj = {
		x: 200,
		y: 800,
		dx: Math.random() * 2,
		dy: Math.random() * 1 - 0.5,
	};
	for (let t = 0; t < 1000; t++) {
		let v = 1+(Math.abs(obj.dx) + Math.abs(obj.dy))/10;
		v = 1/v;
		voidCircle(obj.x, obj.y, Math.max(Math.min(20,100/(1+t/10)),2), 0.98);
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
		let clusterSize = Math.floor(Math.min(SpawnRules.asteroids.count-i, Math.random()*SpawnRules.asteroids.clusterSize/2+SpawnRules.asteroids.clusterSize/2+1));
		for (let b = 0; b < clusterSize;b++){
			let offset = new Vector(Math.random() * SpawnRules.asteroids.area + SpawnRules.asteroids.area/2,Math.random() * SpawnRules.asteroids.area + SpawnRules.asteroids.area/2);
			let pos = clusterPos.result().add(offset);
			let asteroid = new Entity(pos.x, pos.y, 1);
			asteroid.collider.push(new Shape().circle(0, 0, 125));
			asteroid.calculateBounds();
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
			} else if(Universe.getGas(pos) <= SpawnRules.asteroids.gasRareThreshold){
				asteroid.rotationSpeed = 20;
				asteroid.init();
			}
		}
		i += clusterSize;
    }
    //new Resource(e1, new Vector(-300, 0), 60, 0);

    let e2 = new Entity(mid.x - 1000, mid.y, 2);
    e2.colliderFromFile("hitboxes/plane.json");
    e2.calculateBounds();
    e2.init();
}
Universe.init();

for (let y = 0; y < h; y += subres) {
	for (let x = 0; x < w; x += subres) {
		let level = gasMap[y][x];
		context.fillStyle = "rgba("+level+","+level+","+level+","+1+")";
		context.fillRect(x * subres, y * subres, subres, subres);
		view.setUint8(level);
	}
}

for (let i = 0; i < Entity.list.length; i++) {
	const e = Entity.list[i];
	context.fillStyle = "rgba(255,0,0,1)";
	context.fillRect(Math.floor(e.position.x /400), Math.floor(e.position.y /400), 1, 1);
}

const buffer = canvas.toBuffer('image/png')
fs.writeFileSync('./minimap.png', buffer)

exports.gasMap = gasMap;
exports.gasBuffer = gasBuffer;
