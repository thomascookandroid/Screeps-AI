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

function room(roomName) { 
   return Game.rooms[roomName]; 
}

module.exports = {
    creeps,
    rooms,
    room
};
