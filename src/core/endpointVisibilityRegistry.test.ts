import {
  setVisibility,
  getVisibility,
  removeVisibility,
  getAllVisibilities,
  getEndpointsByVisibility,
  isVisible,
  resetVisibilityRegistry,
} from './endpointVisibilityRegistry';

beforeEach(() => {
  resetVisibilityRegistry();
});

describe('setVisibility / getVisibility', () => {
  it('defaults to public when not set', () => {
    expect(getVisibility('GET', '/unknown')).toBe('public');
  });

  it('stores and retrieves a visibility level', () => {
    setVisibility('GET', '/admin', 'internal');
    expect(getVisibility('GET', '/admin')).toBe('internal');
  });

  it('is case-insensitive for method', () => {
    setVisibility('post', '/login', 'hidden');
    expect(getVisibility('POST', '/login')).toBe('hidden');
  });

  it('overwrites previous visibility', () => {
    setVisibility('GET', '/docs', 'internal');
    setVisibility('GET', '/docs', 'public');
    expect(getVisibility('GET', '/docs')).toBe('public');
  });
});

describe('removeVisibility', () => {
  it('removes an entry and reverts to public default', () => {
    setVisibility('DELETE', '/resource', 'hidden');
    expect(removeVisibility('DELETE', '/resource')).toBe(true);
    expect(getVisibility('DELETE', '/resource')).toBe('public');
  });

  it('returns false when entry does not exist', () => {
    expect(removeVisibility('GET', '/nonexistent')).toBe(false);
  });
});

describe('getAllVisibilities', () => {
  it('returns all entries', () => {
    setVisibility('GET', '/a', 'public');
    setVisibility('POST', '/b', 'internal');
    const all = getAllVisibilities();
    expect(all).toHaveLength(2);
  });
});

describe('getEndpointsByVisibility', () => {
  it('filters by visibility level', () => {
    setVisibility('GET', '/open', 'public');
    setVisibility('GET', '/secret', 'hidden');
    setVisibility('GET', '/internal', 'internal');
    expect(getEndpointsByVisibility('hidden')).toHaveLength(1);
    expect(getEndpointsByVisibility('public')).toHaveLength(1);
  });
});

describe('isVisible', () => {
  it('public endpoints are always visible', () => {
    setVisibility('GET', '/pub', 'public');
    expect(isVisible('GET', '/pub')).toBe(true);
    expect(isVisible('GET', '/pub', true)).toBe(true);
  });

  it('hidden endpoints are never visible', () => {
    setVisibility('GET', '/hide', 'hidden');
    expect(isVisible('GET', '/hide')).toBe(false);
    expect(isVisible('GET', '/hide', true)).toBe(false);
  });

  it('internal endpoints visible only when allowInternal=true', () => {
    setVisibility('GET', '/int', 'internal');
    expect(isVisible('GET', '/int')).toBe(false);
    expect(isVisible('GET', '/int', true)).toBe(true);
  });
});
