const {
	findClosestValidRoomPosition,
	partitionCostMatrix,
} = require("./algorithms");
const {
	CREEP_ROLE_BUILDER,
	CREEP_ROLE_HARVESTER,
	CREEP_ROLE_SCOUT,
	CREEP_ROLE_UPGRADER,
	creepData,
} = require("./creepData");
const _creeps = require("./utils").creeps;

const {
	getRoomDistanceTransform,
	iterateMatrix,
	ROOM_SIZE,
} = require("screeps-toolkit");

const MAX_HARVESTERS = 12;
const MAX_UPGRADERS = 3;
const MAX_BUILDERS = 3;
const MAX_SCOUTS = 0;
const MAX_CONTAINERS = 20;
const MAX_EXTENSIONS = 5;
const MAX_TOWERS = 3;
const ROOM_DISTANCE_TRANSFORM_TTL = 60;

class ManagedRoom {
	constructor(room) {
		this.room = room;
		this.spawn = this.room.find(FIND_MY_SPAWNS)[0];
		this.controller = room.controller;
		this.sources = room.find(FIND_SOURCES);
		this.creeps = _creeps().filter((creep) => {
			return creep.memory.room === room.name;
		});
		const creepsOfRole = (role) => {
			return this.creeps
				.filter((creep) => {
					return creep.memory.role === role;
				})
				.map((creep) => {
					return new creepData[role].prototype(creep);
				});
		};
		this.harvesters = creepsOfRole(CREEP_ROLE_HARVESTER);
		this.upgraders = creepsOfRole(CREEP_ROLE_UPGRADER);
		this.builders = creepsOfRole(CREEP_ROLE_BUILDER);
		this.scouts = creepsOfRole(CREEP_ROLE_SCOUT);
	}

	run() {
		this.refreshRoomDistanceTransform();
		this.planStructures();
		this.spawnRoleIfNotMaxxed(CREEP_ROLE_HARVESTER, MAX_HARVESTERS);
		this.spawnRoleIfNotMaxxed(CREEP_ROLE_UPGRADER, MAX_UPGRADERS);
		this.spawnRoleIfNotMaxxed(CREEP_ROLE_BUILDER, MAX_BUILDERS);
		this.spawnRoleIfNotMaxxed(CREEP_ROLE_SCOUT, MAX_SCOUTS);
		for (const harvester of this.harvesters) harvester.run();
		for (const upgrader of this.upgraders) upgrader.run();
		for (const builder of this.builders) builder.run();
		for (const scout of this.scouts) scout.run();
        this.logRoomInfo();
	}

	spawnRoleIfNotMaxxed(role, max) {
		let numberOfCreepsInRole = 0;
		if (role === CREEP_ROLE_HARVESTER)
			numberOfCreepsInRole = this.harvesters.length;
		else if (role === CREEP_ROLE_UPGRADER)
			numberOfCreepsInRole = this.upgraders.length;
		else if (role === CREEP_ROLE_BUILDER)
			numberOfCreepsInRole = this.builders.length;
		else if (role === CREEP_ROLE_SCOUT)
			numberOfCreepsInRole = this.scouts.length;
		if (numberOfCreepsInRole < max) {
			this.spawn.spawnCreep(creepData[role].bodyParts, Game.time.toString(), {
				memory: {
					room: this.room.name,
					working: false,
					role: role,
				},
			});
		}
	}

	hasNeedForRole(role) {
		if (role === CREEP_ROLE_HARVESTER)
			return this.harvesters.length < MAX_HARVESTERS;
		if (role === CREEP_ROLE_UPGRADER)
			return this.upgraders.length < MAX_UPGRADERS;
		if (role === CREEP_ROLE_BUILDER) {
            const hasLessThanMaxBuilders =  
                this.builders.length < MAX_BUILDERS;
            const hasConstructionSites = 
                this.room.find(FIND_CONSTRUCTION_SITES).length > 0;
            return hasLessThanMaxBuilders && hasConstructionSites;
		}
        if (role === CREEP_ROLE_SCOUT)
			return this.scouts.length < MAX_SCOUTS;
	}

	findClosestValidConstructionSite(pos) {
		return findClosestValidRoomPosition(this.room, pos, (objects, current) => {
			for (const object of objects) {
				if (object.type === LOOK_CREEPS) return false;
				if (object.type === LOOK_STRUCTURES) return false;
				if (object.type === LOOK_CONSTRUCTION_SITES)
					if (object.constructionSite) return false;
				if (object.type === LOOK_TERRAIN)
					if (object.terrain === "wall" || object.terrain === "swamp")
						return false;
				if (this.spawn.pos.getRangeTo(current) <= 1) return falsef;
				return true;
			}
		});
	}

	planStructures() {
		this.planPaths();
		//this.largestContiguousArea(room);
	}

	planPaths() {
		const pathsToSources = this.sources.map((source) => {
			return PathFinder.search(this.spawn.pos, source.pos).path;
		});
		for (const path of pathsToSources) {
			for (const roomPosition of path) {
				this.room.createConstructionSite(
					roomPosition.x,
					roomPosition.y,
					STRUCTURE_ROAD,
				);
			}
		}
	}

	largestContiguousArea() {
		const roomDistanceTransform = this.refreshRoomDistanceTransform(this.room);
		const regions = partitionCostMatrix(roomDistanceTransform, 3);
		for (const region of regions) {
			for (const cell in region) {
				this.room.visual.text(cell.v, cell.x, cell.y, {
					color: "white",
					font: 0.25,
				});
			}
		}
	}

	refreshRoomDistanceTransform() {
		const roomDistanceTransformUpdateTick =
			this.room.memory.roomDistanceTransformUpdateTick;
		const currentTick = Game.time;
		const roomDistanceTransform = this.room.memory.roomDistanceTransform;
		if (
			roomDistanceTransformUpdateTick === undefined ||
			currentTick - roomDistanceTransformUpdateTick >=
				ROOM_DISTANCE_TRANSFORM_TTL ||
			roomDistanceTransform === undefined
		) {
			const newRoomDistanceTransform = getRoomDistanceTransform(this.room.name);
			this.room.memory.roomDistanceTransform =
				newRoomDistanceTransform.serialize();
			this.room.memory.roomDistanceTransformUpdateTick = currentTick;
			return newRoomDistanceTransform;
		}
		return PathFinder.CostMatrix.deserialize(roomDistanceTransform);
	}

	visualiseRoomDistanceTransform() {
		const roomDistanceTransform = this.refreshRoomDistanceTransform(this.room);
		const iterator = iterateMatrix(roomDistanceTransform);
		for (const cell of iterator) {
			this.room.visual.text(cell.v, cell.x, cell.y);
		}
	}

    logRoomInfo() {
        console.log(`harvesters: ${this.harvesters.length}`);
        console.log(`upgraders: ${this.upgraders.length}`);
        console.log(`builders: ${this.builders.length}`);
        console.log(`scouts: ${this.scouts.length}`);
    }
}

module.exports = {
	ManagedRoom,
};
