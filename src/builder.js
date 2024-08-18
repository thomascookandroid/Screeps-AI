const { room } = require("./utils");

class Builder {
    constructor(creep) {
        this.creep = creep;

        this.run = () => {
            if (creep.memory.working) {
                const closestConstructionSite = creep.room
                    .find(FIND_CONSTRUCTION_SITES)
                    .sort(constructionSite => {
                        return creep.pos.getRangeTo(constructionSite.pos);
                    })[0];
                if (closestConstructionSite) {
                    const workResult = creep.build(closestConstructionSite);
                    if (workResult === ERR_NOT_IN_RANGE) {
                        creep.moveTo(closestConstructionSite);
                    }
                    else if (workResult === ERR_NOT_ENOUGH_RESOURCES) {
                        creep.memory.working = false;
                    }
                } else {
                    creep.suicide();
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
    Builder
};

