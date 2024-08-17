class Scout {
    constructor(creep) {
        this.creep = creep;

        this.run = () => {
            if (creep.memory.working) {
                if (creep.room.controller) {
                    if (creep.reserveController(creep.room.controller) ===
                        ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.controller);
                    }
                }
            }
            else {
                if (creep.room.name !== creep.memory.room) {
                    if (creep.room.controller) {
                        creep.moveTo(creep.room.controller);
                        creep.memory.working = true;
                        creep.memory.room = creep.room.name;
                    }
                    else {
                        moveToFirstExit(creep);
                    }
                }
                else {
                    moveToFirstExit(creep);
                }
            }
        };
    }
}

module.exports = {
    Scout
};
