class BaseCreep {
    constructor(creep) {
        this.creep = creep;
    }

    findClosestFreeSource() {
        return this.creep.room.find(FIND_SOURCES)
            .filter(this.isFree)
            .sort(this.closestToMe)
            [0];
    }

    closestToMe() {
        return (a, b) => {
            return this.creep.pos.getRangeTo(a.pos) -
                this.creep.pos.getRangeTo(b.pos);
        }
    }

    isFree(object) {
        const memory = object.room.memory;
        const occupancy = memory.occupancy;
        if (occupancy === undefined) 
            return true;
        return occupancy[object.id] < 3;
    }
}

module.exports = {
    BaseCreep
}
