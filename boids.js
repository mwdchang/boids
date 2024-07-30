const dist2 = (x1, y1, z1, x2, y2, z2) => {
  return (
    (x2 - x1) * (x2 - x1) +
    (y2 - y1) * (y2 - y1) +
    (z2 - z1) * (z2 - z1)
  );
}

const dist = (x1, y1, z1, x2, y2, z2) => {
  const d = dist2(x1, y1, z1, x2, y2, z2);
  return Math.sqrt(d);
}

const normalize = (x, y, z) => {
  const mag = Math.sqrt(x * x + y * y + z * z);
  return [x / mag, y / mag, z / mag];
}

// nudge viector (x1, y1, z1) towards vector (x2, y2, z2)
// @return normalied new direction
const nudgeDirection = (x1, y1, z1, x2, y2, z2) => {
  const k = 0.01;
  const xNew = x1 + k * (x2 - x1);
  const yNew = y1 + k * (y2 - y1);
  const zNew = z1 + k * (z2 - z1);
  return normalize(xNew, yNew, zNew);
}


class Agent {
  id;
  x = 0;
  y = 0;
  z = 0;
  dx = 0;
  dy = 0;
  dz = 0;
  speed = 0;

  range = 3.25;
  selfBoundary = 0.75;

  constructor(id, x, y, z, dx, dy, dz, speed) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.z = z;
    this.dx = dx;
    this.dy = dy;
    this.dz = dz;
    this.speed = speed;
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.z += this.dz;
  }
}

export const createAgents = (size, worldSize) => {
  const agents = [];
  for (let i = 0; i < size; i++) {
    // Position
    let x = -0.5 * worldSize + worldSize * Math.random();
    let y = -0.5 * worldSize + worldSize * Math.random();
    let z = -0.5 * worldSize + worldSize * Math.random();


    // Direction
    let dx = -0.5 + Math.random();
    let dy = -0.5 + Math.random();
    let dz = -0.5 + Math.random();
    [dx, dy, dz] = normalize(dx, dy, dz);

    let speed = 0.05 + 0.07 * Math.random();

    const agent = new Agent(i, x, y, z, dx, dy, dz, speed);
    agents.push(agent);
  }
  return agents;
}

const getNeighbourAgents = (agent, agents) => {
  const results = [];
  const d2Map = {};
  const range = agent.range * agent.range;

  agents.forEach(a => {
    if (a.id === agent.id) return;

    const d2 = dist2(
      agent.x, agent.y, agent.z,
      a.x, a.y, a.z
    );

    if (d2 <= range) {
      results.push(a);
      d2Map[a.id] = d2;
    }
  });
  return [results, d2Map];
}

const alignment = (agent, agents) => {
  if (agents.length === 0) return;

  let dx = 0;
  let dy = 0;
  let dz = 0;
  agents.forEach(a => {
    dx += a.dx;
    dy += a.dy;
    dz += a.dz;
  });
  dx /= agents.length;
  dy /= agents.length;
  dz /= agents.length;

  [agent.dx, agent.dy, agent.dz] = nudgeDirection(
    agent.dx, agent.dy, agent.dz,
    dx, dy, dz
  );
}

const cohesion = (agent, agents) => {
  if (agents.length === 0) return;

  let x = 0;
  let y = 0;
  let z = 0;
  agents.forEach(a => {
    x += a.x;
    y += a.y;
    z += a.z;
  });
  x /= agents.length;
  y /= agents.length;
  z /= agents.length;

  // target
  const tx = (x - agent.x);
  const ty = (y - agent.y);
  const tz = (z - agent.z);

  [agent.dx, agent.dy, agent.dz] = nudgeDirection(
    agent.dx, agent.dy, agent.dz,
    tx, ty, tz
  );
}

const separation = (agent, agents, d2Map) => {
  if (agents.length === 0) return;

  let cx = 0;
  let cy = 0;
  let cz = 0;
  const bound = agent.selfBoundary * agent.selfBoundary;
  agents.forEach(a => {
    const d2 = d2Map[a.id];
    if (d2 < bound) {
      cx += (agent.x - a.x);
      cy += (agent.y - a.y);
      cz += (agent.z - a.z);
    }
  });

  // FIXME ???
  // [cx, cy, cz] = normalize(cx, cy, cz);
  [agent.dx, agent.dy, agent.dz] = nudgeDirection(
    agent.dx, agent.dy, agent.dz,
    cx, cy, cz
  );
}


export const updateAgents = (agents, bound, hardWall) => {
  agents.forEach(agent => {
    agent.x += agent.speed * agent.dx;
    agent.y += agent.speed * agent.dy;
    agent.z += agent.speed * agent.dz;

    // 1. grab neighbours, each eagent is reactive to what it can perceive
    const [neighbourAgents, d2Map] = getNeighbourAgents(agent, agents);

    // 2. apply rules
    alignment(agent, neighbourAgents);
    cohesion(agent, neighbourAgents);
    separation(agent, neighbourAgents, d2Map);

    // walls
    if (hardWall) {
      if (agent.x > bound) {
        agent.x = bound;
        agent.dx *= -1;
      }
      if (agent.x < -bound) {
        agent.x = -bound;
        agent.dx *= -1;
      }

      if (agent.y > bound) {
        agent.y = bound;
        agent.dy *= -1;
      }
      if (agent.y < -bound) {
        agent.y = -bound;
        agent.dy *= -1;
      }

      if (agent.z > bound) {
        agent.z = bound;
        agent.dz *= -1;
      }
      if (agent.z < -bound) {
        agent.z = -bound;
        agent.dz *= -1;
      }
    } else {
      if (agent.x > bound) agent.x = -bound;
      if (agent.x < -bound) agent.x = bound;
      if (agent.y > bound) agent.y = -bound;
      if (agent.y < -bound) agent.y = bound;
      if (agent.z > bound) agent.z = -bound;
      if (agent.z < -bound) agent.z = bound;
    }

    // Test
    // [agent.dx, agent.dy, agent.dz] = nudgeDirection(
    //   agent.dx, agent.dy, agent.dz,
    //   1, 0, 0
    // );
  });
}


export const unloadToBuffer = (agents, pointsData) => {
  const positions = pointsData.geometry.attributes.position.array;
  agents.forEach((agent, idx) => {
    positions[idx * 3 + 0] = agent.x;
    positions[idx * 3 + 1] = agent.y;
    positions[idx * 3 + 2] = agent.z;
  });
}
