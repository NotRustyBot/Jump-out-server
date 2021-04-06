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
    fuelShip.name = "Fuel";
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
    debugShip.name = "Debug";
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

    return ShipType;
};

exports.defineShips = defineShips;