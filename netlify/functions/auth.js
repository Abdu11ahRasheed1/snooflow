import bcrypt from 'bcryptjs';
import { createUser, findUserById, findUserByUsername } from './lib/db.js';
import { json, parseBody, signToken, verifyAuth } from './lib/crypto.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(204, {});

  try {
    if (event.httpMethod === 'GET') {
      const claims = verifyAuth(event);
      if (!claims) return json(401, { error: 'Unauthorized' });
      const user = await findUserById(claims.sub);
      if (!user) return json(401, { error: 'User not found' });

      return json(200, {
        user: {
          id: user.id,
          username: user.username,
          redditConfigured: Boolean(
            user.reddit_client_id &&
              user.reddit_client_secret &&
              user.reddit_username &&
              user.reddit_password
          ),
          geminiConfigured: Boolean(user.gemini_api_key),
          geminiModel: user.gemini_model || 'gemini-2.5-flash',
        },
      });
    }

    if (event.httpMethod !== 'POST') {
      return json(405, { error: 'Method not allowed' });
    }

    const { action, username, password } = parseBody(event);
    const cleanUser = (username || '').trim().toLowerCase();

    if (!cleanUser || !password) {
      return json(400, { error: 'Username and password are required' });
    }

    if (action === 'register') {
      if (!/^[a-z0-9_]{3,24}$/.test(cleanUser)) {
        return json(400, {
          error: 'Username must be 3-24 characters (letters, numbers, underscores)',
        });
      }
      if (password.length < 6) {
        return json(400, { error: 'Password must be at least 6 characters' });
      }

      const existing = await findUserByUsername(cleanUser);
      if (existing) {
        return json(409, { error: 'Username is already taken' });
      }

      const hash = await bcrypt.hash(password, 10);
      const user = await createUser(cleanUser, hash);
      const token = signToken(user);

      return json(201, {
        token,
        user: {
          id: user.id,
          username: user.username,
          redditConfigured: false,
          geminiConfigured: false,
          geminiModel: user.gemini_model || 'gemini-2.5-flash',
        },
      });
    }

    if (action === 'login') {
      const user = await findUserByUsername(cleanUser);
      if (!user) {
        return json(401, { error: 'Invalid username or password' });
      }
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return json(401, { error: 'Invalid username or password' });
      }
      const token = signToken(user);

      return json(200, {
        token,
        user: {
          id: user.id,
          username: user.username,
          redditConfigured: Boolean(
            user.reddit_client_id &&
              user.reddit_client_secret &&
              user.reddit_username &&
              user.reddit_password
          ),
          geminiConfigured: Boolean(user.gemini_api_key),
          geminiModel: user.gemini_model || 'gemini-2.5-flash',
        },
      });
    }

    return json(400, { error: 'Invalid action' });
  } catch (err) {
    return json(500, { error: err.message || 'Server error' });
  }
}
