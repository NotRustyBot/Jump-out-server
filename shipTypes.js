function ShipType() {
    this.name;
    this.speed;
    this.acceleration;
    this.reverseAccelreation;
    this.rotationSpeed;
    this.afterBurnerBonus;
    this.afterBurnerCapacity;
    this.cargoCapacity;
    this.drag;
    this.actionPool = [];
    this.size;
}

function defineShips(Action) {
    ShipType.types = [];

    let fuelShip = new ShipType();
    fuelShip.name = "fuel";
    fuelShip.size = 200;
    fuelShip.speed = 1000;
    fuelShip.acceleration = 100;
    fuelShip.reverseAccelreation = 50;
    fuelShip.rotationSpeed = 1;
    fuelShip.afterBurnerSpeedBonus = 1000;
    fuelShip.afterBurnerRotationBonus = 1;
    fuelShip.afterBurnerAccelerationBonus = 100;
    fuelShip.afterBurnerCapacity = 600;
    fuelShip.cargoCapacity = 30;
    fuelShip.drag = 0.05;
    fuelShip.actionPool = [Action.buildTest, Action.MineRock];
    fuelShip.radarRange = 14000;
    ShipType.types[100] = fuelShip;

    let debugShip = new ShipType();
    debugShip.name = "debug";
    debugShip.size = 125;
    debugShip.speed = 1000;
    debugShip.acceleration = 600;
    debugShip.reverseAccelreation = 300;
    debugShip.rotationSpeed = 3;
    debugShip.afterBurnerSpeedBonus = 1000;
    debugShip.afterBurnerRotationBonus = 1;
    debugShip.afterBurnerAccelerationBonus = 800;
    debugShip.afterBurnerCapacity = 600;
    debugShip.cargoCapacity = 30;
    debugShip.drag = 0.5;
    debugShip.actionPool = [Action.buildTest, Action.MineRock];
    debugShip.radarRange = 14000;
    ShipType.types[0] = debugShip;

    let hackerShip = new ShipType();
    hackerShip.name = "hacker";
    hackerShip.size = 180;
    hackerShip.speed = 1000;
    hackerShip.acceleration = 600;
    hackerShip.reverseAccelreation = 300;
    hackerShip.rotationSpeed = 3;
    hackerShip.afterBurnerSpeedBonus = 1000;
    hackerShip.afterBurnerRotationBonus = 1;
    hackerShip.afterBurnerAccelerationBonus = 800;
    hackerShip.afterBurnerCapacity = 600;
    hackerShip.cargoCapacity = 30;
    hackerShip.drag = 0.5;
    hackerShip.actionPool = [Action.buildTest, Action.MineRock];
    hackerShip.radarRange = 14000;
    ShipType.types[1] = hackerShip;

    return ShipType;
};

exports.defineShips = defineShips;