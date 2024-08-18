const {
    iterateMatrix,
    ROOM_SIZE,
    normalizePos
} = require("screeps-toolkit")

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
        const neighbours = getNeighbours(current);
        for (const neighbour of neighbours) {
            if (!reached.has(neighbour.toString())) {
                frontier.push(neighbour);
                reached.add(neighbour.toString());
            }
        }
    }
    return null;
}

const partitionCostMatrix = (costMatrix, minCost) => {
    const contiguousRegions = [];
    const costMatrixIterator = iterateMatrix(costMatrix);
    const cellsAlreadyAssignedToRegions = new Set();
    for (const cell of costMatrixIterator) {
        if (cellsAlreadyAssignedToRegions.has(cell))
            continue;
        const region = [];
        const visited = new Set();
        const frontier = [];
        frontier.push(cell);
        visited.add(cell);
        while (frontier.length > 0) {
            const current = frontier.shift();
            if (current.v < minCost)
                continue;
            const neighbours = getNeighbours(current);
            for (const neighbour of neighbours) {
                const matrixNeighbour = {
                    x: neighbour.x,
                    y: neighbour.y,
                    v: costMatrix.get(neighbour.x, neighbour.y)
                }
                if (!visited.has(matrixNeighbour)) {
                    visited.add(matrixNeighbour);
                    frontier.push(matrixNeighbour);
                    if (matrixNeighbour.v >= minCost && !cellsAlreadyAssignedToRegions.has(matrixNeighbour)) {
                        region.push(matrixNeighbour);
                        cellsAlreadyAssignedToRegions.add(matrixNeighbour);
                    }
                }
            }
        }
        contiguousRegions.push(region);
    }
    return contiguousRegions;
}

const getNeighbours = (pos) => {
    const neighbours = [];
    const left = pos.x - 1;
    const top = pos.y - 1;
    const right = pos.x + 1;
    const bottom = pos.y + 1;
    if (left >= 0) 
        neighbours.push({ x: left, y: pos.y});
    if (left >= 0 && top >= 0)
        neighbours.push({ x: left, y: top });
    if (top >= 0)
        neighbours.push({ x: pos.x, y: top });
    if (top >= 0 && right < ROOM_SIZE)
        neighbours.push({ x: right, y: top });
    if (right < ROOM_SIZE)
        neighbours.push({ x: right, y: pos.y });
    if (right < ROOM_SIZE && bottom < ROOM_SIZE)
        neighbours.push({ x: right, y: bottom });
    if (bottom < ROOM_SIZE)
        neighbours.push({ x: pos.x, y: bottom });
    if (bottom < ROOM_SIZE && left >= 0)
        neighbours.push({ x: left, y: bottom });
    return neighbours;

}

module.exports = {
    findClosestValidRoomPosition,
    partitionCostMatrix
};
