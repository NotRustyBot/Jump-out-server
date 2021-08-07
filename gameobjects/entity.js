const {Vector} = require("./vector");
const {Area} = require("./area");
const {maxInteractionRange} = require("./utility");
const {Shape} = require("./collision");
const {Datagrams} = require("../datagram");
const fs = require('fs');


/**
 * 
 * @param {number} x 
 * @param {number} y 
 * @param {number} type 
 */
 function Entity(x, y, type, level) {
    this.position = new Vector(x, y);
    this.level = level || 0;
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
     * @type {import("./collision").Shape[]}
     */
    this.collider = [];
    this.bounds = 0;

    this.init = function () {
        this.id = Entity.next_id;
        Entity.next_id++;
        Entity.list.push(this);
        Area.checkIn(this, this.level);

    }

    this.delete = function () {
        Entity.remove.push(this.id);
        Area.checkOut(this, this.level);
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

Entity.properties = [
    { canMine: true },
    { canMine: true },
    { canMine: true },
    { canMine: true },
    { canMine: true },
];


exports.Entity = Entity;