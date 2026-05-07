import {
  assignPriority,
  removePriority,
  getPriority,
  getAllPriorities,
  getEndpointsByPriority,
  getPrioritySummary,
  resetPriorityRegistry,
} from './endpointPriorityRegistry';

beforeEach(() => {
  resetPriorityRegistry();
});

describe('assignPriority', () => {
  it('should assign a priority to an endpoint', () => {
    const entry = assignPriority('GET', '/users', 'high', 'Core user endpoint');
    expect(entry.method).toBe('GET');
    expect(entry.path).toBe('/users');
    expect(entry.priority).toBe('high');
    expect(entry.reason).toBe('Core user endpoint');
    expect(entry.assignedAt).toBeDefined();
  });

  it('should normalise method to uppercase', () => {
    const entry = assignPriority('post', '/orders', 'critical');
    expect(entry.method).toBe('POST');
  });

  it('should overwrite an existing priority', () => {
    assignPriority('GET', '/users', 'low');
    assignPriority('GET', '/users', 'critical', 'Elevated');
    const entry = getPriority('GET', '/users');
    expect(entry?.priority).toBe('critical');
    expect(entry?.reason).toBe('Elevated');
  });
});

describe('removePriority', () => {
  it('should remove an existing priority', () => {
    assignPriority('DELETE', '/items', 'low');
    expect(removePriority('DELETE', '/items')).toBe(true);
    expect(getPriority('DELETE', '/items')).toBeUndefined();
  });

  it('should return false when entry does not exist', () => {
    expect(removePriority('GET', '/nonexistent')).toBe(false);
  });
});

describe('getEndpointsByPriority', () => {
  it('should return only endpoints matching the given priority', () => {
    assignPriority('GET', '/a', 'critical');
    assignPriority('POST', '/b', 'high');
    assignPriority('GET', '/c', 'critical');
    const critical = getEndpointsByPriority('critical');
    expect(critical).toHaveLength(2);
    expect(critical.every((e) => e.priority === 'critical')).toBe(true);
  });
});

describe('getPrioritySummary', () => {
  it('should return counts per priority level', () => {
    assignPriority('GET', '/a', 'critical');
    assignPriority('GET', '/b', 'high');
    assignPriority('GET', '/c', 'high');
    assignPriority('GET', '/d', 'low');
    const summary = getPrioritySummary();
    expect(summary.critical).toBe(1);
    expect(summary.high).toBe(2);
    expect(summary.medium).toBe(0);
    expect(summary.low).toBe(1);
  });
});

describe('getAllPriorities', () => {
  it('should return all entries', () => {
    assignPriority('GET', '/x', 'medium');
    assignPriority('POST', '/y', 'low');
    expect(getAllPriorities()).toHaveLength(2);
  });
});
