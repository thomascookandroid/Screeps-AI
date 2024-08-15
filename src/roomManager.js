const utils = require("utils");

function run() {
    const ROOM_SIZE = 50;

    utils.rooms().forEach(room => {
        const roomSpawn = room.find(FIND_MY_SPAWNS)[0];
        const roomController = room.controller;
        if (roomController && roomSpawn) {
            const roomCreeps = utils.creeps().filter(creep => {
                return creep.memory.room == room.name;
            });
            spawnRequiredGatherers(roomCreeps, roomSpawn);
            spawnRequiredUpgraders(roomCreeps, roomSpawn);
            spawnRequiredBuilders(roomCreeps, roomSpawn);
            spawnRequiredScouts(roomCreeps, roomSpawn);
            if (roomController.level >= 0) {
                planLevelZeroConstruction(room, roomSpawn);
            }
            if (roomController.level >= 2) {
                planLevelTwoConstruction(room, roomSpawn);
            }
            if (roomController.level >= 3) {
                planLevelThreeConstruction(room, roomSpawn, roomController);
            }
        }
    });
}

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
        const constructionLocation = findClosestValidConstructionSite(room, roomSpawn.pos);
        if (constructionLocation) {
            room.createConstructionSite(constructionLocation === null ||
                constructionLocation === void 0 ? void 0 : constructionLocation.x, constructionLocation === null 
                || constructionLocation === void 0 ? void 0 : constructionLocation.y, STRUCTURE_CONTAINER);
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
        const constructionLocation = findClosestValidConstructionSite(room, roomSpawn.pos);
        if (constructionLocation) {
            room.createConstructionSite(constructionLocation === null ||
                constructionLocation === void 0 ? void 0 : constructionLocation.x, constructionLocation === null ||
                constructionLocation === void 0 ? void 0 : constructionLocation.y, STRUCTURE_EXTENSION);
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
        const constructionLocation = findClosestValidConstructionSite(room, roomSpawn.pos);
        if (constructionLocation) {
            room.createConstructionSite(constructionLocation === null ||
                constructionLocation === void 0 ? void 0 : constructionLocation.x, constructionLocation === null ||
                constructionLocation === void 0 ? void 0 : constructionLocation.y, STRUCTURE_EXTENSION);
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
        const constructionLocation = findClosestValidConstructionSite(room, roomController.pos);
        if (constructionLocation) {
            room.createConstructionSite(constructionLocation === null ||
                constructionLocation === void 0 ? void 0 : constructionLocation.x, constructionLocation === null ||
                constructionLocation === void 0 ? void 0 : constructionLocation.y, STRUCTURE_TOWER);
        }
    }
}

function findClosestValidConstructionSite(room, position) {
    const start = room.getPositionAt(position.x, position.y);
    if (start == null)
        return null;
    const roomSpawns = room.find(FIND_MY_SPAWNS);
    const frontier = [];
    frontier.push(start);
    const reached = new Set();
    reached.add(start.toString());
    while (frontier !== undefined && frontier.length > 0) {
        const current = frontier.shift();
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
                if (object.constructionSi, te) {
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
            const neighbours = getNeighbours(room, current);
            neighbours.forEach(neighbour => {
                if (!reached.has(neighbour.toString())) {
                    frontier.push(neighbour);
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
        const cell = new RoomPosition( right, position.y, room.name);
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

function closestSource(room, from) {
}

module.exports = {
    run
};
