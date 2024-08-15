const roomManager = require("roomManager");
const objectiveManager = require("objectiveManager");

module.exports.loop = function () {
    console.log(`Current game tick is ${Game.time}`);
    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            delete Memory.creeps[name];
        }
    }
    objectiveManager.run();
    roomManager.run();
};
