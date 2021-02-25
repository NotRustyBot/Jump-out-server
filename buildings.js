function defineBuildings(Building, Universe, Vector, Ship, Entity) {
    let Buildings = {
        test: {
            size: 300,
            type: 101,
            control: function (dt) {
                if (this.reach == undefined) this.reach = 0;
    
                if (this.timer == undefined || this.timer > 0.1) {
                    if (this.reach < 5000) {
                        this.reach += 10;
                        let angle = 0;
                        for (let i = 0; i < 100; i++) {
                            angle += Math.PI * 2 / 100;
                            let pos = new Vector(Math.cos(angle) * this.reach, Math.sin(angle) * this.reach);
                            pos.add(this.position);
                            Universe.setGas(pos, Math.max(Universe.getGas(pos) - 1, 0));
                        }
                    }
                    this.timer = 0;
                }
                this.timer += dt;
            }
        },
        navBeacon: {
            size: 50,
            type: 102,
            _speedBonus: 500,
            _range: 5000,
            _angle: 1,
            setup: function () {
                this.init();
                Building.navBeacons.push(this);
                this.collisionPurpose = 0;
            }
        }
    }

    return Buildings;
}

exports.defineBuildings = defineBuildings;