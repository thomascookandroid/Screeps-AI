const { ManagedRoom } = require("./roomManager");
const utils = require("./utils");

module.exports.loop = () => {
	// Automatically delete memory of missing creeps
	for (const name in Memory.creeps) {
		if (!(name in Game.creeps)) {
			delete Memory.creeps[name];
		}
	}
	const room = utils.rooms()[0];
	const managedRoom = new ManagedRoom(room);
	managedRoom.run();
};
