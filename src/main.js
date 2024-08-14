function creeps() {
    const creeps = [];
    for (const name in Game.creeps) {
        const maybeCreep = Game.creeps[name];
        if (maybeCreep != null) {
            creeps.push(maybeCreep);
        }
    }
    return creeps;
}

function rooms() {
    const rooms = [];
    for (const name in Game.rooms) {
        const maybeRoom = Game.rooms[name];
        if (maybeRoom != null) {
            rooms.push(maybeRoom);
        }
    }
    return rooms;
}

function gather() {
    World.creeps.filter(creep => {
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
                const creepRoom = World.room(creep.memory.room);
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
    World.creeps.filter(creep => {
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
                const creepRoom = World.room(creep.memory.room);
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
    World.creeps.filter(creep => {
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
                const creepRoom = World.room(creep.memory.room);
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
   World.creeps.filter(creep => {
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
                    this.moveToFirstExit(creep);
                }
            }
            else {
                this.moveToFirstExit(creep);
            }
        }
    }); 

    function moveToFirstExit(creep) {
        const exit = World.room(creep.memory.room).find(FIND_EXIT)[0];
        creep.moveTo(exit);
    }
}

const objectiveMap = new Map([
    [0 /* GATHER */, gather()], 
    [2 /* BUILD */, build()],
    [1 /* UPGRADE */, upgrade()],
    [3 /* SCOUT */, scout()]
]);

function objectiveManager() {
    for (const [_, objective] of objectiveMap] {
        objective()
    }
}

function roomManager() {
    const ROOM_SIZE = 50;

    World.rooms.forEach(room => {
        const roomSpawn = room.find(FIND_MY_SPAWNS)[0];
        const roomController = room.controller;
        if (roomController && roomSpawn) {
            const roomCreeps = World.creeps.filter(creep => {
                return creep.memory.room == room.name;
            });
            this.spawnRequiredGatherers(roomCreeps, roomSpawn);
            this.spawnRequiredUpgraders(roomCreeps, roomSpawn);
            this.spawnRequiredBuilders(roomCreeps, roomSpawn);
            this.spawnRequiredScouts(roomCreeps, roomSpawn);
            if (roomController.level >= 0) {
                this.planLevelZeroConstruction(room, roomSpawn);
            }
            if (roomController.level >= 2) {
                this.planLevelTwoConstruction(room, roomSpawn);
            }
            if (roomController.level >= 3) {
                this.planLevelThreeConstruction(room, roomSpawn, roomController);
            }
        }
    });

    function spawnRequiredGatherers(roomCreeps, roomSpawn) {
        const needMoreGatherers = roomCreeps.filter(creep => {
            return creep.memory.role == 0 /* GATHER */;
        }).length < 3;
        if (needMoreGatherers) {
            const newName = Game.time.toString();
            if (roomSpawn) {
                roomSpawn.spawnCreep([WORK, CARRY, MOVE], newName, {
                    memory: {
                        room: roomSpawn.room.name,
                        working: false,
                        role: 0 /* GATHER */
                    }
                });
            }
        }
    }
    
    function spawnRequiredUpgraders(roomCreeps, roomSpawn) {
        const needMoreUpgraders = roomCreeps.filter(creep => {
            return creep.memory.role == 1 /* UPGRADE */;
        }).length < 6;
        if (needMoreUpgraders) {
            const newName = Game.time.toString();
            if (roomSpawn) {
                roomSpawn.spawnCreep([WORK, CARRY, MOVE], newName, {
                    memory: {
                        room: roomSpawn.room.name,
                        working: false,
                        role: 1 /* UPGRADE */
                    }
                });
            }
        }
    }

    function spawnRequiredScouts(roomCreeps, roomSpawn) {
        const needMoreScouts = roomCreeps.filter(creep => {
            return creep.memory.role == 3 /* SCOUT */;
        }).length < 1;
        if (needMoreScouts) {
            const newName = Game.time.toString();
            if (roomSpawn) {
                roomSpawn.spawnCreep([MOVE, MOVE, CLAIM], newName, {
                    memory: {
                        room: roomSpawn.room.name,
                        working: false,
                        role: 3 /* SCOUT */
                    }
                });
            }
        }
    }
    
    function spawnRequiredBuilders(roomCreeps, roomSpawn) {
        const needMoreBuilders = roomCreeps.filter(creep => {
            return creep.memory.role == 2 /* BUILD */;
        }).length < 3;
        if (needMoreBuilders) {
            const newName = Game.time.toString();
            if (roomSpawn) {
                roomSpawn.spawnCreep([WORK, CARRY, MOVE], newName, {
                    memory: {
                        room: roomSpawn.room.name,
                        working: false,
                        role: 2 /* BUILD */
                    }
                });
            }
        }
    }

    function planLevelZeroConstruction(room, roomSpawn) {
        const containerCount = room.find(FIND_CONSTRUCTION_SITES).filter(constructionSite => {
            return constructionSite.structureType == STRUCTURE_CONTAINER;
        }).length +
            room.find(FIND_STRUCTURES).filter(structure => {
                structure.structureType == STRUCTURE_CONTAINER;
            }).length;
        const requiredContainers = Math.max(0, 5 - containerCount);
        for (let x = 0; x < requiredContainers; x++) {
            const constructionLocation = this.algorthims.findClosestValidConstructionSite(room, roomSpawn.pos);
            if (constructionLocation) {
                room.createConstructionSite(constructionLocation === null || constructionLocation === void 0 ? void 0 : constructionLocation.x, constructionLocation === null || constructionLocation === void 0 ? void 0 : constructionLocation.y, STRUCTURE_CONTAINER);
            }
        }
    }

    function planLevelTwoConstruction(room, roomSpawn) {
        const extensionCount = room.find(FIND_CONSTRUCTION_SITES).filter(constructionSite => {
            return constructionSite.structureType == STRUCTURE_EXTENSION;
        }).length +
            room.find(FIND_STRUCTURES).filter(structure => {
                structure.structureType == STRUCTURE_EXTENSION;
            }).length;
        const requiredExtensions = Math.max(0, 5 - extensionCount);
        for (let x = 0; x < requiredExtensions; x++) {
            const constructionLocation = this.algorthims.findClosestValidConstructionSite(room, roomSpawn.pos);
            if (constructionLocation) {
                room.createConstructionSite(constructionLocation === null || constructionLocation === void 0 ? void 0 : constructionLocation.x, constructionLocation === null || constructionLocation === void 0 ? void 0 : constructionLocation.y, STRUCTURE_EXTENSION);
            }
        }
    }

    function planLevelThreeConstruction(room, roomSpawn, roomController) {
        const extensionCount = room.find(FIND_CONSTRUCTION_SITES).filter(constructionSite => {
            return constructionSite.structureType == STRUCTURE_EXTENSION;
        }).length +
            room.find(FIND_STRUCTURES).filter(structure => {
                structure.structureType == STRUCTURE_EXTENSION;
            }).length;
        const requiredExtensions = Math.max(0, 10 - extensionCount);
        for (let x = 0; x < requiredExtensions; x++) {
            const constructionLocation = this.algorthims.findClosestValidConstructionSite(room, roomSpawn.pos);
            if (constructionLocation) {
                room.createConstructionSite(constructionLocation === null || constructionLocation === void 0 ? void 0 : constructionLocation.x, constructionLocation === null || constructionLocation === void 0 ? void 0 : constructionLocation.y, STRUCTURE_EXTENSION);
            }
        }
        const towerCount = room.find(FIND_CONSTRUCTION_SITES).filter(constructionSite => {
            return constructionSite.structureType == STRUCTURE_TOWER;
        }).length +
            room.find(FIND_STRUCTURES).filter(structure => {
                structure.structureType == STRUCTURE_TOWER;
            }).length;
        const requiredTowers = Math.max(0, 1 - towerCount);
        for (let x = 0; x < requiredTowers; x++) {
            const constructionLocation = this.algorthims.findClosestValidConstructionSite(room, roomController.pos);
            if (constructionLocation) {
                room.createConstructionSite(constructionLocation === null || constructionLocation === void 0 ? void 0 : constructionLocation.x, constructionLocation === null || constructionLocation === void 0 ? void 0 : constructionLocation.y, STRUCTURE_TOWER);
            }
        }
    }

    function findClosestValidConstructionSite(room, position) {
        const start = room.getPositionAt(position.x, position.y);
        if (start == null)
            return null;
        const roomSpawns = room.find(FIND_MY_SPAWNS);
        const frontier = new Queue();
        frontier.enqueue(start);
        const reached = new Set();
        reached.add(start.toString());
        while (frontier.isNotEmpty()) {
            const current = frontier.dequeue();
            const objects = room.lookAt(current.x, current.y);
            var isValid = true;
            objects.forEach(object => {
                if (object.type == LOOK_CREEPS) {
                    isValid = false;
                }
                else if (object.type == LOOK_STRUCTURES) {
                    isValid = false;
                }
                else if (object.type == LOOK_CONSTRUCTION_SITES) {
                    if (object.constructionSite) {
                        isValid = false;
                    }
                }
                else if (object.type == LOOK_TERRAIN) {
                    if (object.terrain) {
                        if (object.terrain == TerrainType.WALL ||
                            object.terrain == TerrainType.SWAMP) {
                            isValid = false;
                        }
                    }
                }
                else {
                    roomSpawns.forEach(spawn => {
                        if (spawn.pos.getRangeTo(current) <= 1) {
                            isValid = false;
                        }
                    });
                }
            });
            if (isValid) {
                return current;
            }
            else {
                const neighbours = this.getNeighbours(room, current);
                neighbours.forEach(neighbour => {
                    if (!reached.has(neighbour.toString())) {
                        frontier.enqueue(neighbour);
                        reached.add(neighbour.toString());
                    }
                });
            }
        }
        return null;
    }
    function getNeighbours(room, position) {
        const neighbours = [];
        const left = position.x - 1;
        const top = position.y - 1;
        const right = position.x + 1;
        const bottom = position.y + 1;
        if (left >= 0) {
            const cell = new RoomPosition(left, position.y, room.name);
            neighbours.push(cell);
        }
        if (left >= 0 && top >= 0) {
            const cell = new RoomPosition(left, top, room.name);
            neighbours.push(cell);
        }
        if (top >= 0) {
            const cell = new RoomPosition(position.x, top, room.name);
            neighbours.push(cell);
        }
        if (top >= 0 && right < ROOM_SIZE) {
            const cell = new RoomPosition(right, top, room.name);
            neighbours.push(cell);
        }
        if (right < ROOM_SIZE) {
            const cell = new RoomPosition(right, position.y, room.name);
            neighbours.push(cell);
        }
        if (right < ROOM_SIZE && bottom < ROOM_SIZE) {
            const cell = new RoomPosition(right, bottom, room.name);
            neighbours.push(cell);
        }
        if (bottom < ROOM_SIZE) {
            const cell = new RoomPosition(position.x, bottom, room.name);
            neighbours.push(cell);
        }
        if (bottom < ROOM_SIZE && left >= 0) {
            const cell = new RoomPosition(left, bottom, room.name);
            neighbours.push(cell);
        }
        return neighbours;
    }
}

module.exports.loop = function () {
    console.log(`Current game tick is ${Game.time}`);
    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            delete Memory.creeps[name];
        }
    }
    objectiveManger().run();
    roomManager().run();   
}
