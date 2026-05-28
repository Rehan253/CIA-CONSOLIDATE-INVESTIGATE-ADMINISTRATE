import 'reflect-metadata';
import { User } from '../entity/User';

describe('User entity', () => {
  it('hashPassword hashes the plaintext password', () => {
    const user = new User();
    user.password = 'plaintextpass';
    user.hashPassword();
    expect(user.password).not.toBe('plaintextpass');
    expect(user.password.length).toBeGreaterThan(20);
  });

  it('checkIfUnencryptedPasswordIsValid returns true for the correct password', () => {
    const user = new User();
    user.password = 'correctpassword';
    user.hashPassword();
    expect(user.checkIfUnencryptedPasswordIsValid('correctpassword')).toBe(true);
  });

  it('checkIfUnencryptedPasswordIsValid returns false for a wrong password', () => {
    const user = new User();
    user.password = 'correctpassword';
    user.hashPassword();
    expect(user.checkIfUnencryptedPasswordIsValid('wrongpassword')).toBe(false);
  });
});
