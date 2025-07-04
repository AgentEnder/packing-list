import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { LocalAuthService } from './local-auth-service.js';

let service: LocalAuthService;

describe('LocalAuthService', () => {
  beforeEach(() => {
    service = new LocalAuthService();
  });

  it('signs up and signs in a user', async () => {
    const { user } = await service.signUp('a@test.com', 'pw');
    expect(user).toBeDefined();

    const out = await service.signIn('a@test.com', 'pw');
    expect(out.user).toBeDefined();
    expect(service.getState().user?.email).toBe('a@test.com');
  });

  it('signs out the current user', async () => {
    await service.signUp('b@test.com', 'pw');
    await service.signOut();
    expect(service.getState().user).toBeNull();
  });
});
