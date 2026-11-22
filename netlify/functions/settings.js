import { findUserById, updateUserSettings } from './lib/db.js';
import { encrypt, json, parseBody, verifyAuth } from './lib/crypto.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(204, {});

  const claims = verifyAuth(event);
  if (!claims) return json(401, { error: 'Unauthorized' });

  try {
    const user = await findUserById(claims.sub);
    if (!user) return json(401, { error: 'User not found' });

    if (event.httpMethod === 'GET') {
      return json(200, {
        redditClientId: user.reddit_client_id || '',
        redditUsername: user.reddit_username || '',
        redditUserAgent: user.reddit_user_agent || '',
        hasRedditSecret: Boolean(user.reddit_client_secret),
        hasRedditPassword: Boolean(user.reddit_password),
        hasGeminiKey: Boolean(user.gemini_api_key),
        geminiModel: user.gemini_model || 'gemini-2.5-flash',
      });
    }

    if (event.httpMethod === 'POST') {
      const body = parseBody(event);

      const updated = await updateUserSettings(user.id, {
        reddit_client_id:
          body.redditClientId !== undefined
            ? body.redditClientId.trim()
            : user.reddit_client_id,
        reddit_client_secret: body.redditClientSecret?.trim()
          ? encrypt(body.redditClientSecret.trim())
          : user.reddit_client_secret,
        reddit_username:
          body.redditUsername !== undefined
            ? body.redditUsername.trim()
            : user.reddit_username,
        reddit_password: body.redditPassword?.trim()
          ? encrypt(body.redditPassword.trim())
          : user.reddit_password,
        reddit_user_agent:
          body.redditUserAgent !== undefined
            ? body.redditUserAgent.trim()
            : user.reddit_user_agent,
        gemini_api_key: body.geminiApiKey?.trim()
          ? encrypt(body.geminiApiKey.trim())
          : user.gemini_api_key,
        gemini_model: body.geminiModel?.trim() || user.gemini_model || 'gemini-2.5-flash',
      });

      return json(200, {
        ok: true,
        redditConfigured: Boolean(
          updated.reddit_client_id &&
            updated.reddit_client_secret &&
            updated.reddit_username &&
            updated.reddit_password
        ),
        geminiConfigured: Boolean(updated.gemini_api_key),
        geminiModel: updated.gemini_model,
      });
    }

    return json(405, { error: 'Method not allowed' });
  } catch (err) {
    return json(500, { error: err.message || 'Server error' });
  }
}
