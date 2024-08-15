const utils = require("utils");

function run() {
    objectives.forEach(objective => {
        objective() 
    });
}

const objectives = [
    gather,
    build,
    upgrade,
    scout
];

function gather() {
    utils.creeps().filter(creep => {
        return creep.memory.role == 0; 
    }).forEach(creep => {
        if (creep.memory.working) {
            const closestTarget = creep.room
                .find(FIND_MY_STRUCTURES)
                .filter(structure => {
                return (structure instanceof StructureSpawn ||
                    structure instanceof StructureExtension ||
                    structure instanceof StructureTower);
            })
            .map(structure => structure)
            .filter(structure => {
                return (structure.store.getUsedCapacity(RESOURCE_ENERGY) < structure.store.getCapacity(RESOURCE_ENERGY));
            })
            .map(structure => structure)
            .sort((structureA, structureB) => {
                return (creep.pos.getRangeTo(structureA.pos) -
                    creep.pos.getRangeTo(structureB.pos));
            })[0];
            if (closestTarget) {
                const workResult = creep.transfer(closestTarget, RESOURCE_ENERGY);
                if (workResult == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestTarget);
                }
                else if (workResult == ERR_NOT_ENOUGH_RESOURCES) {
                    creep.memory.working = false;
                }
            }
        }
        else {
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) ==
                creep.store.getCapacity(RESOURCE_ENERGY)) {
                creep.memory.working = true;
            }
            else {
                const creepRoom = utils.room(creep.memory.room);
                const closestSource = creepRoom
                    .find(FIND_SOURCES)
                    .sort((sourceA, sourceB) => {
                        return (creep.pos.getRangeTo(sourceA.pos) -
                            creep.pos.getRangeTo(sourceB.pos));
                    })[0];
                if (closestSource) {
                    if (creep.harvest(closestSource) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(closestSource);
                    }
                }
            }
        }
    });
}

function build() {
    utils.creeps().filter(creep => {
        return creep.memory.role == 2; 
    }).forEach(creep => {
        if (creep.memory.working) {
            const closestConstructionSite = creep.room
                .find(FIND_CONSTRUCTION_SITES)
                .sort(constructionSite => {
                    return creep.pos.getRangeTo(constructionSite.pos);
                })[0];
            if (closestConstructionSite) {
                const workResult = creep.build(closestConstructionSite);
                if (workResult == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestConstructionSite);
                }
                else if (workResult == ERR_NOT_ENOUGH_RESOURCES) {
                    creep.memory.working = false;
                }
            }
        }
        else {
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) ==
                creep.store.getCapacity(RESOURCE_ENERGY)) {
                creep.memory.working = true;
            }
            else {
                const creepRoom = utils.room(creep.memory.room);
                const closestSource = creepRoom
                    .find(FIND_SOURCES)
                    .sort((sourceA, sourceB) => {
                        return (creep.pos.getRangeTo(sourceA.pos) -
                            creep.pos.getRangeTo(sourceB.pos));
                    })[0];
                if (closestSource) {
                    if (creep.harvest(closestSource) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(closestSource);
                    }
                }
            }
        }
    });
}

function upgrade() {
    utils.creeps().filter(creep => {
        return creep.memory.role == 1; 
    }).forEach(creep => {
        if (creep.memory.working) {
            const controller = creep.room.controller;
            if (controller) {
                const workResult = creep.upgradeController(controller);
                if (workResult == ERR_NOT_IN_RANGE) {
                    creep.moveTo(controller);
                }
                else if (workResult == ERR_NOT_ENOUGH_RESOURCES) {
                    creep.memory.working = false;
                }
            }
        }
        else {
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) ==
                creep.store.getCapacity(RESOURCE_ENERGY)) {
                creep.memory.working = true;
            }
            else {
                const creepRoom = utils.room(creep.memory.room);
                const closestSource = creepRoom
                    .find(FIND_SOURCES)
                    .sort((sourceA, sourceB) => {
                        return (creep.pos.getRangeTo(sourceA.pos) -
                            creep.pos.getRangeTo(sourceB.pos));
                    })[0];
                if (closestSource) {
                    if (creep.harvest(closestSource) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(closestSource);
                    }
                }
            }
        }
    });
}

function scout() {
    utils.creeps().filter(creep => {
        return creep.memory.role == 3; 
    }).forEach(creep => {
        if (creep.memory.working) {
            if (creep.room.controller) {
                if (creep.reserveController(creep.room.controller) ==
                    ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller);
                }
            }
        }
        else {
            if (creep.room.name != creep.memory.room) {
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
    }); 

    function moveToFirstExit(creep) {
        const exit = World.room(creep.memory.room).find(FIND_EXIT)[0];
        creep.moveTo(exit);
    }
}

module.exports = {
    run
};
