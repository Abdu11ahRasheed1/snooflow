import { findUserById } from './lib/db.js';
import { decrypt, json, parseBody, verifyAuth } from './lib/crypto.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const claims = verifyAuth(event);
  if (!claims) return json(401, { error: 'Unauthorized' });

  try {
    const user = await findUserById(claims.sub);
    if (!user) return json(401, { error: 'User not found' });

    if (!user.gemini_api_key) {
      return json(400, { error: 'Add your Gemini API key in Settings first.' });
    }

    const apiKey = decrypt(user.gemini_api_key);
    const body = parseBody(event);
    const model = body.model || user.gemini_model || 'gemini-2.5-flash';

    if (!body.postTitle) {
      return json(400, { error: 'Post title is required' });
    }

    const tone = body.tone || 'helpful & natural';
    const extra = body.customInstruction?.trim()
      ? `\nExtra guidance: ${body.customInstruction.trim()}`
      : '';

    const prompt = `Write a concise, authentic Reddit comment replying to this post in r/${body.subreddit || 'reddit'}.
Tone: ${tone}.
Rules: Sound like a real Reddit user, no robotic intros, no hashtags, keep it under 120 words.${extra}

Post Title: ${body.postTitle}
Post Body: ${(body.postBody || '').slice(0, 1200)}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Gemini API error');
    }

    const comment =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (!comment) {
      throw new Error('Model returned an empty response');
    }

    return json(200, { comment, model });
  } catch (err) {
    return json(500, { error: err.message || 'AI generation failed' });
  }
}
