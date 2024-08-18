const { BaseCreep, TARGET_TTL } = require("./baseCreep");

class Harvester extends BaseCreep {
    run() {
		if (this.creep.memory.working) {
            const target = this.refreshTarget();
            const workResult = this.creep.transfer(target, RESOURCE_ENERGY);
            if (workResult === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(target);
            } else if (workResult === ERR_NOT_ENOUGH_RESOURCES) {
                this.creep.memory.working = false;
            }
		} else {
			if (
				this.creep.store.getUsedCapacity(RESOURCE_ENERGY) ===
				this.creep.store.getCapacity(RESOURCE_ENERGY)
			) {
				this.creep.memory.working = true;
                this.refreshTarget();
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

    refreshTarget () {
        const targetIdUpdateTick = this.creep.memory.targetIdUpdateTick;
        const currentTick = Game.time;
        const targetId = this.creep.memory.targetId;
        let target = Game.getObjectById(targetId);
        if (targetIdUpdateTick === undefined ||
            currentTick - targetIdUpdateTick >= TARGET_TTL ||
            target === undefined
        ) {
            target = this.findClosestEnergySink();
            this.creep.memory.targetId = target.id;
            this.creep.memory.targetIdUpdateTick = Game.time;
        }
        return target;
    };
}

module.exports = {
	Harvester,
};
