const {Vector} = require("./vector");

/**
 * 
 * @param {boolean} result 
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
 * @param {import("./ship").Ship|import("./entity").Entity|import("./projectile").Projectile} first 
 * @param {import("./entity").Entity} second 
 * @param {CollisionResult} result 
 */
function CollisionEvent(first, second, result, mode) {
    this.firstId = first.id;
    this.secondId = second.id;
    this.type = mode;
    this.level = first.level;
    //let temp = result.position.mult(0.5);

    //this.position = first.position.result().sub(result.position);
    this.position = second.position.result().add(result.position);
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

                let r = shape.r;
                let a = Vector.dot(d, d);
                let b = 2 * Vector.dot(d, f);
                let c = Vector.dot(f, f) - r * r;
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