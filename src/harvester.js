const { BaseCreep } = require("./baseCreep");

class Harvester extends BaseCreep {
    run() {
		if (this.creep.memory.working) {
			const closestTarget = this.creep.room
				.find(FIND_MY_STRUCTURES)
				.filter((structure) => {
					return (
						structure instanceof StructureSpawn ||
						structure instanceof StructureContainer ||
						structure instanceof StructureExtension ||
						structure instanceof StructureTower
					);
				})
				.filter((structure) => {
					return (
						structure.store.getUsedCapacity(RESOURCE_ENERGY) <
						structure.store.getCapacity(RESOURCE_ENERGY)
					);
				})
				.sort((structureA, structureB) => {
					return (
						this.creep.pos.getRangeTo(structureA.pos) -
						this.creep.pos.getRangeTo(structureB.pos)
					);
				})[0];
			if (closestTarget) {
				const workResult = this.creep.transfer(closestTarget, RESOURCE_ENERGY);
				if (workResult === ERR_NOT_IN_RANGE) {
					this.creep.moveTo(closestTarget);
				} else if (workResult === ERR_NOT_ENOUGH_RESOURCES) {
					this.creep.memory.working = false;
				}
			}
		} else {
			if (
				this.creep.store.getUsedCapacity(RESOURCE_ENERGY) ===
				this.creep.store.getCapacity(RESOURCE_ENERGY)
			) {
				this.creep.memory.working = true;
			} else {
				const closestSource = this.findClosestFreeSource();
				if (closestSource) {
                    if (this.creep.harvest(closestSource) === ERR_NOT_IN_RANGE) {
                        this.creep.moveTo(closestSource);
                    }
                }
			}
		}
    }
}

module.exports = {
	Harvester,
};
