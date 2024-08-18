const TARGET_TTL = 300;

class BaseCreep {
    constructor(creep) {
        this.creep = creep
    }

    findClosestEnergySink() {
        return this.creep.room
            .find(FIND_MY_STRUCTURES)
            .filter(this.isEnergySink)
            .filter(this.hasCapacity)
            .sort(this.closestToMe)
        [0]
    }

    findClosestFreeSource() {
        return this.creep.room.find(FIND_SOURCES)
            .filter(this.isFree)
            .sort(this.closestToMe)
        [0]
    }

    closestToMe() {
        return (a, b) => {
            return this.creep.pos.getRangeTo(a.pos) -
                this.creep.pos.getRangeTo(b.pos)
        }
    }

    isFree(object) {
        const memory = object.room.memory
        const occupancy = memory.occupancy
        if (occupancy === undefined)
            return true
        return occupancy[object.id] < 3
    }

    isEnergySink(structure) {
       return structure instanceof StructureSpawn ||
            structure instanceof StructureContainer ||
            structure instanceof StructureExtension ||
            structure instanceof StructureTower
    }

    hasCapacity(structure) {
        return structure.store.getUsedCapacity(RESOURCE_ENERGY) <
            structure.store.getCapacity(RESOURCE_ENERGY);
    }
}

module.exports = {
    TARGET_TTL,
    BaseCreep
}
