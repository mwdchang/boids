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
  x = 0;
  y = 0;
  z = 0;
  dx = 0;
  dy = 0;
  dz = 0;

  constructor(x, y, z, dx, dy, dz) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.dx = dx;
    this.dy = dy;
    this.dz = dz;
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.z += this.dz;
  }
}

export const createAgents = (size) => {
  const agents = [];
  for (let i = 0; i < size; i++) {
    // Position
    let x = -0.5 + Math.random();
    let y = -0.5 + Math.random();
    let z = -0.5 + Math.random();


    // Direction
    let dx = -0.5 + Math.random();
    let dy = -0.5 + Math.random();
    let dz = -0.5 + Math.random();
    [dx, dy, dz] = normalize(dx, dy, dz);

    const agent = new Agent(x, y, z, dx, dy, dz);
    agents.push(agent);
  }
  return agents;
}

export const updateAgents = (agents, bound) => {
  /**
   *
   * align-force
   * separte-force
   * cohesion-force
   *
  **/

  agents.forEach(agent => {
    agent.x += 0.2 * agent.dx;
    agent.y += 0.2 * agent.dy;
    agent.z += 0.2 * agent.dz;

    // Move the the other side
    if (agent.x > bound) agent.x = -bound;
    if (agent.x < -bound) agent.x = bound;

    if (agent.y > bound) agent.y = -bound;
    if (agent.y < -bound) agent.y = bound;

    if (agent.z > bound) agent.z = -bound;
    if (agent.z < -bound) agent.z = bound;

    // Test
    [agent.dx, agent.dy, agent.dz] = nudgeDirection(
      agent.dx, agent.dy, agent.dz,
      1, 0, 0
    );
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
