import { findUserById } from './lib/db.js';
import { decrypt, json, parseBody, verifyAuth } from './lib/crypto.js';
import {
  getRedditAccessToken,
  searchRedditPosts,
  submitRedditComment,
  submitRedditPost,
} from './lib/reddit.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const claims = verifyAuth(event);
  if (!claims) return json(401, { error: 'Unauthorized' });

  try {
    const user = await findUserById(claims.sub);
    if (!user) return json(401, { error: 'User not found' });

    if (
      !user.reddit_client_id ||
      !user.reddit_client_secret ||
      !user.reddit_username ||
      !user.reddit_password
    ) {
      return json(400, { error: 'Configure your Reddit API credentials in Settings first.' });
    }

    const { token, userAgent } = await getRedditAccessToken({
      clientId: user.reddit_client_id,
      clientSecret: decrypt(user.reddit_client_secret),
      username: user.reddit_username,
      password: decrypt(user.reddit_password),
      userAgent: user.reddit_user_agent,
    });

    const body = parseBody(event);

    if (body.action === 'search') {
      if (!body.query?.trim()) {
        return json(400, { error: 'Search query is required' });
      }
      const posts = await searchRedditPosts(token, userAgent, {
        query: body.query.trim(),
        subreddit: body.subreddit || '',
        sort: body.sort || 'relevance',
        time: body.time || 'week',
        limit: body.limit || 15,
      });
      return json(200, { posts });
    }

    if (body.action === 'post') {
      if (!body.subreddit?.trim() || !body.title?.trim()) {
        return json(400, { error: 'Subreddit and title are required' });
      }
      const result = await submitRedditPost(token, userAgent, {
        subreddit: body.subreddit,
        title: body.title.trim(),
        kind: body.kind || 'self',
        text: body.text || '',
        url: body.url || '',
      });
      return json(200, { ok: true, post: result });
    }

    if (body.action === 'comment') {
      if (!body.thingId || !body.text?.trim()) {
        return json(400, { error: 'Post ID and comment text are required' });
      }
      const result = await submitRedditComment(token, userAgent, {
        thingId: body.thingId,
        text: body.text.trim(),
      });
      return json(200, { ok: true, comment: result });
    }

    return json(400, { error: 'Invalid Reddit action' });
  } catch (err) {
    return json(500, { error: err.message || 'Reddit request failed' });
  }
}
