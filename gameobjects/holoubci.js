const {Mobile} = require('./mobile');
const {Shape} = require('./collision');
const {Projectile} = require('./projectile');
const {Player} = require('./player');
const { Raycast, flag } = require('./universe');
const { Area } = require('./area');


function Guard(position, level) {
    Mobile.call(this, position.x, position.y, 20, level);
    this.collider.push(new Shape().circle(0, 0, 125));
    this.calculateBounds();
    this.collisionPurpose = flag.CollisionFlags.projectile;
    this.hull = 100;
    this.damage = function(projectile){
        this.hull -= projectile.stats.damage;
        if (this.hull <= 0) {
            this.delete();
        }
    }
    this.init();
    this.control = function (dt) {
        if (!this.ready) {
            this.startPos = this.position.result();
            this.cooldown = 0;
            this.projectileType = 1;
            this.lastSeen = this.position.result();
            this.ready = true;
        }

        let closest = 5000;
        let target = undefined;
        Player.players.forEach(p => {
            let dist = p.ship.position.distance(this.position);
            let relative = this.position.result().sub(p.ship.position);
            if (dist < 5000) {
                let result = Raycast(this.position, relative.mult(-1), this.level, flag.CollisionFlags.any, [this]);
                if (result.closest != undefined && result.closest.entity == p.ship) {
                    target = p.ship;
                    this.lastSeen = p.ship.position.result();
                }
            }
        });
        if (target != undefined) {
            this.cooldown -= dt;
            if (this.cooldown < 0) {
                this.cooldown = Projectile.stats[this.projectileType].cooldown / 1000;
                for (let index = 0; index < 1; index++) {
                    Projectile.from(this, this.projectileType);
                }
            }
            this.rotation = target.position.result().sub(this.position).toAngle();
        }
        let flydir = this.lastSeen.result().sub(this.position);
        if (flydir.length() > 100) {
            this.velocity = flydir.normalize(100);
            Area.moveMe(this, dt);
        }
    }
}

exports.Guard = Guard;