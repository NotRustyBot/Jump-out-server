var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

let w = 1000;
let h = 1000;
let subres = 1;

let scale = 80;

let circle = 30;
let falloff = 100;
let shift = 0;

function distance(x1, y1, x2, y2) {
	var a = x1 - x2;
	var b = y1 - y2;

	return (c = Math.sqrt(a * a + b * b));
}

function voidCircle(x1, y1, r,p) {
	p = Math.min(p,1);
	let dMode = (p == 0);
	for (let y = Math.floor(y1-r); y < y1 + r; y += subres) {
		for (let x = Math.floor(x1-r); x < x1 + r; x += subres) {
			let dist = distance(x, y, x1, y1)
			if (dist < r && x > 0 && x < w && y > 0 && y < h) {
				if(dMode){
					p = Math.pow(dist/r,4);
				}
				gasMap[y / subres][x / subres] = gasMap[y / subres][x / subres]*p;
			}
		}
	}
}

let gasMap = [];
for (let y = 0; y < h; y += subres) {
	gasMap[y / subres] = [];
	for (let x = 0; x < w; x += subres) {
		let level = Math.abs(Math.floor((0.5 + perlin.get(x / scale, y / scale)) * 100)-50);
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
		if (level < 0) {
			level = 0;
		}

		gasMap[y / subres][x / subres] = level;
	}
}

for (let c = 0; c < 20; c++) {
	voidCircle(Math.random()*w, Math.random()*h, 30, 0);
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
		let drag = voidCircle(obj.x, obj.y, Math.max(Math.min(20,100/(1+t/10)),2), v);
		obj.x += obj.dx;
		obj.y += obj.dy;
		obj.dx = obj.dx * 0.995;
		obj.dy = obj.dy * 0.995;
	}
}

for (let y = 0; y < h / subres; y++) {
	for (let x = 0; x < w / subres; x++) {
		level = gasMap[y][x] * 2.55;
		ctx.fillStyle = "rgba("+level+","+level+","+level+","+1+")";
		ctx.fillRect(x * subres, y * subres, subres, subres);
	}
}
