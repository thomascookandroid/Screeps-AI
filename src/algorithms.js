const ROOM_SIZE = 50;
const {
    getRoomDistanceTransform
} = require("screeps-toolkit")

const cacheRoomDistanceTransform = (room) => {
    const roomDistanceTransform = getRoomDistanceTransform(room.name);
    room.memory.roomDistanceTransform = roomDistanceTransform.serialize();
}

const findClosestValidRoomPosition = (room, position, heuristic) => {
    const start = room.getPositionAt(position.x, position.y);
    if (start == null)
        return null;
    const frontier = [];
    frontier.push(start);
    const reached = new Set();
    reached.add(start.toString());
    while (frontier !== undefined && frontier.length > 0) {
        const current = frontier.shift();
        const objects = room.lookAt(current.x, current.y);
        const isValid = heuristic(objects);
        if (isValid)
            return current;
        const neighbours = getNeighbours(room, current);
        for (const neighbour of neighbours) {
            if (!reached.has(neighbour.toString())) {
                frontier.push(neighbour);
                reached.add(neighbour.toString());
            }
        }
    }
    return null;
}

const getNeighbours = (room, position) => {
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

module.exports = {
    cacheRoomDistanceTransform,
    findClosestValidRoomPosition
};
