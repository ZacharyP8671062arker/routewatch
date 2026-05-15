import {
  assignCompliance,
  removeCompliance,
  getCompliance,
  getAllCompliances,
  getNonCompliantEndpoints,
  getEndpointsByStandard,
  resetComplianceTracker,
  makeKey,
} from './endpointComplianceTracker';

beforeEach(() => resetComplianceTracker());

describe('makeKey', () => {
  it('normalises method to uppercase', () => {
    expect(makeKey('get', '/users')).toBe('GET:/users');
  });
});

describe('assignCompliance / getCompliance', () => {
  it('stores and retrieves a compliance entry', () => {
    assignCompliance('GET', '/users', ['GDPR'], true, 'Reviewed 2024');
    const entry = getCompliance('GET', '/users');
    expect(entry).toBeDefined();
    expect(entry?.standards).toContain('GDPR');
    expect(entry?.compliant).toBe(true);
    expect(entry?.notes).toBe('Reviewed 2024');
  });

  it('overwrites an existing entry', () => {
    assignCompliance('GET', '/users', ['GDPR'], true);
    assignCompliance('GET', '/users', ['GDPR', 'SOC2'], false);
    const entry = getCompliance('GET', '/users');
    expect(entry?.compliant).toBe(false);
    expect(entry?.standards).toHaveLength(2);
  });
});

describe('removeCompliance', () => {
  it('removes an existing entry and returns true', () => {
    assignCompliance('POST', '/data', ['HIPAA'], true);
    expect(removeCompliance('POST', '/data')).toBe(true);
    expect(getCompliance('POST', '/data')).toBeUndefined();
  });

  it('returns false when entry does not exist', () => {
    expect(removeCompliance('DELETE', '/nope')).toBe(false);
  });
});

describe('getAllCompliances', () => {
  it('returns all registered entries', () => {
    assignCompliance('GET', '/a', ['GDPR'], true);
    assignCompliance('POST', '/b', ['PCI-DSS'], false);
    expect(getAllCompliances()).toHaveLength(2);
  });
});

describe('getNonCompliantEndpoints', () => {
  it('returns only non-compliant entries', () => {
    assignCompliance('GET', '/ok', ['GDPR'], true);
    assignCompliance('POST', '/fail', ['HIPAA'], false);
    const results = getNonCompliantEndpoints();
    expect(results).toHaveLength(1);
    expect(results[0].path).toBe('/fail');
  });
});

describe('getEndpointsByStandard', () => {
  it('filters by standard', () => {
    assignCompliance('GET', '/gdpr', ['GDPR'], true);
    assignCompliance('GET', '/hipaa', ['HIPAA'], true);
    assignCompliance('GET', '/both', ['GDPR', 'HIPAA'], true);
    const gdpr = getEndpointsByStandard('GDPR');
    expect(gdpr.map((e) => e.path).sort()).toEqual(['/both', '/gdpr']);
  });
});
