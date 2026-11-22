export async function getRedditAccessToken({
  clientId,
  clientSecret,
  username,
  password,
  userAgent,
}) {
  const ua = userAgent || `web:snookey-bot:v1.0 (by /u/${username})`;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const params = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
  });

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': ua,
    },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok || data.error || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Reddit authentication failed');
  }
  return { token: data.access_token, userAgent: ua };
}

export async function searchRedditPosts(
  token,
  userAgent,
  { query, subreddit = '', sort = 'relevance', time = 'week', limit = 15 }
) {
  const cleanSub = subreddit.replace(/^r\//i, '').trim();
  const base = cleanSub
    ? `https://oauth.reddit.com/r/${encodeURIComponent(cleanSub)}/search`
    : 'https://oauth.reddit.com/search';

  const params = new URLSearchParams({
    q: query,
    sort,
    t: time,
    limit: String(Math.min(Math.max(Number(limit) || 15, 1), 30)),
    restrict_sr: cleanSub ? '1' : '0',
    type: 'link',
  });

  const res = await fetch(`${base}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': userAgent,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to search Reddit posts');
  }

  return (data?.data?.children || []).map(({ data: p }) => ({
    id: p.id,
    name: p.name, // full thing_id e.g. t3_abc123
    title: p.title,
    selftext: p.selftext || '',
    subreddit: p.subreddit,
    author: p.author,
    score: p.score,
    numComments: p.num_comments,
    permalink: `https://reddit.com${p.permalink}`,
    url: p.url,
    createdUtc: p.created_utc,
  }));
}

export async function submitRedditPost(
  token,
  userAgent,
  { subreddit, title, kind = 'self', text = '', url = '' }
) {
  const cleanSub = subreddit.replace(/^r\//i, '').trim();
  const params = new URLSearchParams({
    api_type: 'json',
    sr: cleanSub,
    title,
    kind,
  });

  if (kind === 'link') {
    params.set('url', url);
  } else {
    params.set('text', text);
  }

  const res = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent,
    },
    body: params.toString(),
  });

  const data = await res.json();
  const errors = data?.json?.errors || [];
  if (!res.ok || errors.length > 0) {
    const msg = errors.map((e) => e.join(': ')).join('; ') || data.message || 'Submit failed';
    throw new Error(msg);
  }

  return data?.json?.data || {};
}

export async function submitRedditComment(token, userAgent, { thingId, text }) {
  const params = new URLSearchParams({
    api_type: 'json',
    thing_id: thingId,
    text,
  });

  const res = await fetch('https://oauth.reddit.com/api/comment', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent,
    },
    body: params.toString(),
  });

  const data = await res.json();
  const errors = data?.json?.errors || [];
  if (!res.ok || errors.length > 0) {
    const msg = errors.map((e) => e.join(': ')).join('; ') || data.message || 'Comment failed';
    throw new Error(msg);
  }

  return data?.json?.data?.things?.[0]?.data || {};
}
