function defineItems() {
    let Items = {
        ore: 1,
        naviBeacon: 5,
    }

    return Items;
}
exports.defineItems = defineItems;

function defineItemInfo() {
    let ItemInfo = {
        1: { // ore
            tag: 0,
            stackable: true,
        },
        5: { // naviBeacon
            tag: 1,
            stackable: false,
        },
    }

    return ItemInfo;
}

exports.defineItemInfo = defineItemInfo;