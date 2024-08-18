const { 
    findClosestValidRoomPosition,
    partitionCostMatrix
} = require("./algorithms");
const { CREEP_ROLE_BUILDER, CREEP_ROLE_HARVESTER,
        CREEP_ROLE_SCOUT, CREEP_ROLE_UPGRADER,
        creepData } = require("./creepData");
const _creeps = require("./utils").creeps;

const {
    getRoomDistanceTransform,
    ROOM_SIZE
} = require("screeps-toolkit")

const MAX_HARVESTERS = 3;
const MAX_UPGRADERS = 3;
const MAX_BUILDERS = 3;
const MAX_SCOUTS = 1;
const MAX_CONTAINERS = 20;
const MAX_EXTENSIONS = 5;
const MAX_TOWERS = 3;
const ROOM_DISTANCE_TRANSFORM_TTL = 60;

class ManagedRoom {
    constructor(room) {
        this.room = room;

        this.run = () => {
            refreshRoomDistanceTransform(room);
            planStructures(room);
            spawnRoleIfNotMaxxed(CREEP_ROLE_HARVESTER, MAX_HARVESTERS);
            spawnRoleIfNotMaxxed(CREEP_ROLE_UPGRADER, MAX_UPGRADERS);
            spawnRoleIfNotMaxxed(CREEP_ROLE_BUILDER, MAX_BUILDERS);
            spawnRoleIfNotMaxxed(CREEP_ROLE_SCOUT, MAX_SCOUTS);
            updateHarvesterSources(room, harvesters);
            if (controller.level >= 0)
                planLevelZeroConstruction();
            if (controller.level >= 2)
                planLevelTwoConstruction();
            if (controller.level >= 3)
                planLevelThreeConstruction();
            for (const harvester of harvesters) {
                harvester.run();
            }
            for (const upgrader of upgraders) {
                upgrader.run();
            }
            for (const builder of builders) {
                builder.run();
            }
            for (const scout of scouts) {
                scout.run();
            }
        };

        const creeps = _creeps().filter(creep => {
            return creep.memory.room === room.name;
        });

        const creepsOfRole = (role) => {
            return creeps.filter(creep => {
                return creep.memory.role === role;
            }).map(creep => {
                return new creepData[role].prototype(creep);
            });
        };
        const harvesters = creepsOfRole(CREEP_ROLE_HARVESTER);
        const upgraders = creepsOfRole(CREEP_ROLE_UPGRADER);
        const builders = creepsOfRole(CREEP_ROLE_BUILDER);
        const scouts = creepsOfRole(CREEP_ROLE_SCOUT);
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        const controller = room.controller;
        const sources = room.find(FIND_SOURCES);
        const closestSource = (from) => {
            return sources
                .sort((sourceA, sourceB) => {
                    return (from.getRangeTo(sourceA.pos) -
                        from.getRangeTo(sourceB.pos));
                })[0];
        };

        const updateHarvesterSources = () => {
            for (const harvester of harvesters) {
                const source = closestSource(harvester.creep.pos);
                harvester.creep.memory.sourceId = source.id;
            }
        };

        const creepsOfRoleFromCache = (role) => {
            let roleCreeps = [];
            if (role === CREEP_ROLE_HARVESTER)
                roleCreeps = harvesters;
            else if (role === CREEP_ROLE_UPGRADER)
                roleCreeps = upgraders;
            else if (role === CREEP_ROLE_BUILDER)
                roleCreeps = builders;
            else if (role === CREEP_ROLE_SCOUT)
                roleCreeps = scouts;
            return roleCreeps;
        };

        const spawnRoleIfNotMaxxed = (role, max) => {
            const creepsOfRole = creepsOfRoleFromCache(role);
            if (creepsOfRole.length < max) {
                spawn.spawnCreep(creepData[role].bodyParts, Game.time.toString(), {
                    memory: {
                        room: room.name,
                        working: false,
                        role: role
                    }
                });
            }
        };

        const planLevelZeroConstruction = () => {
            const containerCount = room.find(FIND_CONSTRUCTION_SITES).filter(constructionSite => {
                return constructionSite.structureType === STRUCTURE_CONTAINER;
            }).length +
                room.find(FIND_STRUCTURES).filter(structure => {
                    structure.structureType === STRUCTURE_CONTAINER;
                }).length;
            const requiredContainers = Math.max(0, MAX_CONTAINERS - containerCount);
            for (let x = 0; x < requiredContainers; x++) {
                const constructionLocation = findClosestValidConstructionSite(spawn.pos);
                if (constructionLocation !== undefined && constructionLocation !== null) {
                    room.createConstructionSite(constructionLocation.x, constructionLocation.y, STRUCTURE_CONTAINER);
                }
            }
        };

        const planLevelTwoConstruction = () => {
            const extensionCount = room.find(FIND_CONSTRUCTION_SITES).filter(constructionSite => {
                return constructionSite.structureType === STRUCTURE_EXTENSION;
            }).length +
                room.find(FIND_STRUCTURES).filter(structure => {
                    structure.structureType === STRUCTURE_EXTENSION;
                }).length;
            const requiredExtensions = Math.max(0, MAX_EXTENSIONS - extensionCount);
            for (let x = 0; x < requiredExtensions; x++) {
                const constructionLocation = findClosestValidConstructionSite(spawn.pos);
                if (constructionLocation) {
                    room.createConstructionSite(constructionLocation === null ||
                        constructionLocation === void 0 ? void 0 : constructionLocation.x, constructionLocation === null ||
                            constructionLocation === void 0 ? void 0 : constructionLocation.y, STRUCTURE_EXTENSION);
                }
            }
        };

        const planLevelThreeConstruction = () => {
            const extensionCount = room.find(FIND_CONSTRUCTION_SITES).filter(constructionSite => {
                return constructionSite.structureType === STRUCTURE_EXTENSION;
            }).length +
                room.find(FIND_STRUCTURES).filter(structure => {
                    structure.structureType === STRUCTURE_EXTENSION;
                }).length;
            const requiredExtensions = Math.max(0, MAX_EXTENSIONS - extensionCount);
            for (let x = 0; x < requiredExtensions; x++) {
                const constructionLocation = findClosestValidConstructionSite(spawn.pos);
                if (constructionLocation) {
                    room.createConstructionSite(constructionLocation === null ||
                        constructionLocation === void 0 ? void 0 : constructionLocation.x, constructionLocation === null ||
                            constructionLocation === void 0 ? void 0 : constructionLocation.y, STRUCTURE_EXTENSION);
                }
            }
            const towerCount = room.find(FIND_CONSTRUCTION_SITES).filter(constructionSite => {
                return constructionSite.structureType === STRUCTURE_TOWER;
            }).length +
                room.find(FIND_STRUCTURES).filter(structure => {
                    structure.structureType === STRUCTURE_TOWER;
                }).length;
            const requiredTowers = Math.max(0, MAX_TOWERS - towerCount);
            for (let x = 0; x < requiredTowers; x++) {
                const constructionLocation = findClosestValidConstructionSite(controller.pos);
                if (constructionLocation) {
                    room.createConstructionSite(constructionLocation === null ||
                        constructionLocation === void 0 ? void 0 : constructionLocation.x, constructionLocation === null ||
                            constructionLocation === void 0 ? void 0 : constructionLocation.y, STRUCTURE_TOWER);
                }
            }
        };

        const findClosestValidConstructionSite = (pos) => {
            return findClosestValidRoomPosition(room, pos, (objects, current) => {
                for (const object of objects) {
                    if (object.type === LOOK_CREEPS)
                        return false;
                    if (object.type === LOOK_STRUCTURES)
                        return false;
                    if (object.type === LOOK_CONSTRUCTION_SITES)
                        if (object.constructionSite)
                            return false;
                    if (object.type === LOOK_TERRAIN)
                        if (object.terrain === "wall" ||
                            object.terrain === "swamp")
                            return false;
                    if (spawn.pos.getRangeTo(current) <= 1)
                        return false;
                    return true;
                }
            });
        };

        const planStructures = (room) => {
            planPaths(room);           
            //largestContiguousArea(room);
        };

        const planPaths = (room) => {
            const spawn = room.find(FIND_MY_SPAWNS)[0];
            const sources = room.find(FIND_SOURCES);
            const pathsToSources = sources.map((source) => {
                return PathFinder.search(
                    spawn.pos,
                    source.pos
                ).path;
            });
            for (const path of pathsToSources) {
                for (const roomPosition of path) {
                    room.createConstructionSite(roomPosition.x, roomPosition.y, STRUCTURE_ROAD);
                }
            }
        }

        const largestContiguousArea = (room) => {
            const roomDistanceTransform = refreshRoomDistanceTransform(room);
            const regions = partitionCostMatrix(roomDistanceTransform, 3);
            for (const region of regions) {
                for (const cell in region) {
                    room.visual.text(cell.v, cell.x, cell.y, { color: "white", font: 0.25 });
                }
            }
        }


        const refreshRoomDistanceTransform = (room) => {
            const roomDistanceTransformUpdateTick = room.memory.roomDistanceTransformUpdateTick;
            const currentTick = Game.time;
            const roomDistanceTransform = room.memory.roomDistanceTransform;
            if (roomDistanceTransformUpdateTick === undefined ||
                currentTick - roomDistanceTransformUpdateTick >= ROOM_DISTANCE_TRANSFORM_TTL ||
                roomDistanceTransform === undefined
            ) {
                const newRoomDistanceTransform = getRoomDistanceTransform(room.name);
                room.memory.roomDistanceTransform = newRoomDistanceTransform.serialize();
                room.memory.roomDistanceTransformUpdateTick = currentTick;
                return newRoomDistanceTransform;
            }
            return PathFinder.CostMatrix.deserialize(roomDistanceTransform);
        }
    }
}

module.exports = {
    ManagedRoom,
};
