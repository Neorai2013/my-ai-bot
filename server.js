const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 100_000) {
        reject(new Error('ההודעה גדולה מדי.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('בקשה לא תקינה.'));
      }
    });
    req.on('error', reject);
  });
}

async function handleChat(req, res) {
  if (!process.env.OPENAI_API_KEY) {
    return sendJson(res, 500, { error: 'חסר מפתח API. הגדירו OPENAI_API_KEY והפעילו מחדש את השרת.' });
  }

  try {
    const { messages } = await readJson(req);
    if (!Array.isArray(messages)) {
      return sendJson(res, 400, { error: 'פורמט הודעות לא תקין.' });
    }

    const recentMessages = messages
      .filter((message) => message && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string')
      .slice(-20)
      .map(({ role, content }) => ({ role, content: content.slice(0, 4_000) }));

    if (!recentMessages.length || recentMessages[recentMessages.length - 1].role !== 'user') {
      return sendJson(res, 400, { error: 'כתבו הודעה כדי להתחיל.' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    let apiResponse;
    try {
      apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'אתה עוזר ידידותי ומועיל. ענה בעברית כברירת מחדל, אלא אם המשתמש מבקש שפה אחרת. אם אינך יודע, אמור זאת בבירור.' },
            ...recentMessages,
          ],
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const result = await apiResponse.json().catch(() => ({}));
    if (!apiResponse.ok) {
      console.error('OpenAI API error:', result.error?.message || apiResponse.status);
      return sendJson(res, 502, { error: 'לא הצלחתי לקבל תשובה כרגע. בדקו את מפתח ה-API ואת הגדרות החשבון ונסו שוב.' });
    }

    const answer = result.choices?.[0]?.message?.content;
    if (typeof answer !== 'string' || !answer.trim()) {
      return sendJson(res, 502, { error: 'התקבלה תשובה ריקה. נסו שוב.' });
    }
    return sendJson(res, 200, { answer });
  } catch (error) {
    if (error.name === 'AbortError') {
      return sendJson(res, 504, { error: 'הבקשה ארכה יותר מדי. נסו שוב.' });
    }
    return sendJson(res, 400, { error: error.message || 'אירעה שגיאה בעיבוד הבקשה.' });
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'POST' && url.pathname === '/api/chat') {
    return handleChat(req, res);
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD, POST' });
    return res.end('Method Not Allowed');
  }

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400);
    return res.end('Bad Request');
  }
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.resolve(PUBLIC_DIR, relativePath);
  if (!filePath.startsWith(`${PUBLIC_DIR}${path.sep}`)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not Found');
    }
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.end(req.method === 'HEAD' ? undefined : content);
  });
});

server.listen(PORT, () => {
  console.log(`Chat app is running at http://localhost:${PORT}`);
});
