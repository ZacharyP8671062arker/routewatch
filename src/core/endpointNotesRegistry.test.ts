import {
  setNote,
  getNote,
  removeNote,
  getAllNotes,
  hasNote,
  resetNotesRegistry,
  makeKey,
} from './endpointNotesRegistry';

beforeEach(() => {
  resetNotesRegistry();
});

describe('makeKey', () => {
  it('should combine method and path into an uppercase key', () => {
    expect(makeKey('get', '/users')).toBe('GET:/users');
    expect(makeKey('POST', '/items')).toBe('POST:/items');
  });
});

describe('setNote / getNote', () => {
  it('should store and retrieve a note', () => {
    setNote('GET', '/users', 'Returns all users');
    const entry = getNote('GET', '/users');
    expect(entry).toBeDefined();
    expect(entry!.note).toBe('Returns all users');
  });

  it('should preserve createdAt when updating a note', () => {
    setNote('GET', '/users', 'First note');
    const first = getNote('GET', '/users')!;
    setNote('GET', '/users', 'Updated note');
    const second = getNote('GET', '/users')!;
    expect(second.createdAt).toBe(first.createdAt);
    expect(second.note).toBe('Updated note');
    expect(second.updatedAt).toBeGreaterThanOrEqual(first.updatedAt);
  });

  it('should return undefined for unknown endpoints', () => {
    expect(getNote('DELETE', '/unknown')).toBeUndefined();
  });
});

describe('removeNote', () => {
  it('should remove an existing note and return true', () => {
    setNote('POST', '/orders', 'Creates an order');
    expect(removeNote('POST', '/orders')).toBe(true);
    expect(getNote('POST', '/orders')).toBeUndefined();
  });

  it('should return false when note does not exist', () => {
    expect(removeNote('GET', '/nonexistent')).toBe(false);
  });
});

describe('hasNote', () => {
  it('should return true when a note exists', () => {
    setNote('PATCH', '/profile', 'Updates profile');
    expect(hasNote('PATCH', '/profile')).toBe(true);
  });

  it('should return false when no note exists', () => {
    expect(hasNote('DELETE', '/nothing')).toBe(false);
  });
});

describe('getAllNotes', () => {
  it('should return all stored notes', () => {
    setNote('GET', '/a', 'Note A');
    setNote('POST', '/b', 'Note B');
    const all = getAllNotes();
    expect(Object.keys(all)).toHaveLength(2);
    expect(all['GET:/a'].note).toBe('Note A');
    expect(all['POST:/b'].note).toBe('Note B');
  });

  it('should return empty object when no notes exist', () => {
    expect(getAllNotes()).toEqual({});
  });
});
