const { room } = require("./utils");

class Upgrader {
    constructor(creep) {
        this.creep = creep;

        this.run = () => {
            if (creep.memory.working) {
                const controller = creep.room.controller;
                if (controller) {
                    const workResult = creep.upgradeController(controller);
                    if (workResult === ERR_NOT_IN_RANGE) {
                        creep.moveTo(controller);
                    }
                    else if (workResult === ERR_NOT_ENOUGH_RESOURCES) {
                        creep.memory.working = false;
                    }
                }
            }
            else {
                if (creep.store.getUsedCapacity(RESOURCE_ENERGY) ===
                    creep.store.getCapacity(RESOURCE_ENERGY)) {
                    creep.memory.working = true;
                }
                else {
                    const creepRoom = room(creep.memory.room);
                    const closestSource = creepRoom
                        .find(FIND_SOURCES)
                        .sort((sourceA, sourceB) => {
                            return (creep.pos.getRangeTo(sourceA.pos) -
                                creep.pos.getRangeTo(sourceB.pos));
                        })[0];
                    if (closestSource) {
                        if (creep.harvest(closestSource) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(closestSource);
                        }
                    }
                }
            }
        };
    }
}

module.exports = {
    Upgrader
};
