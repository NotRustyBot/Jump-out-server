let Items = {
    ore: 1,
    scrap: 2,
    crystals: 3,
    naviBeacon: 5,
}

exports.Items = Items;

let ItemInfo = {
    1: { // ore
        tag: 0,
        stackable: true,
    },
    2: { // scrap
        tag: 0,
        stackable: true,
    },
    3: { // crystals
        tag: 0,
        stackable: true,
    },
    5: { // naviBeacon
        tag: 1,
        stackable: false,
    },
}

exports.ItemInfo = ItemInfo;