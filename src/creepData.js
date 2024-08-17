const { Harvester } = require("./harvester");
const { Upgrader } = require("./upgrader");
const { Builder } = require("./builder");
const { Scout } = require("./scout");

const CREEP_ROLE_HARVESTER = 0;
const CREEP_ROLE_UPGRADER = 1;
const CREEP_ROLE_BUILDER = 2;
const CREEP_ROLE_SCOUT = 3;

const creepData = [
    {
        role: CREEP_ROLE_HARVESTER,
        bodyParts: [WORK, CARRY, MOVE],
        prototype: Harvester
    },
    {
        role: CREEP_ROLE_UPGRADER,
        bodyParts: [WORK, CARRY, MOVE],
        prototype: Upgrader
    },
    {
        role: CREEP_ROLE_BUILDER,
        bodyParts: [WORK, CARRY, MOVE],
        prototype: Builder
    },
    {
        role: CREEP_ROLE_SCOUT,
        bodyParts: [WORK, CARRY, MOVE],
        prototype: Scout
    }
];

module.exports = {
    CREEP_ROLE_HARVESTER,
    CREEP_ROLE_UPGRADER,
    CREEP_ROLE_BUILDER,
    CREEP_ROLE_SCOUT,
    creepData
};
