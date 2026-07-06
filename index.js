// Management OS — Sheets Sync Worker
// One shared connector: both CEO OS and Management OS call this same worker.
// Endpoints:
//   GET  /sheets/:range   -> reads a range, returns { values: [[...]] }
//   PUT  /sheets/:range   -> writes a range, body: { values: [[...]] }
// :range is URL-encoded, e.g. "Daily%20Tasks!A1:H20"

let cachedToken = null; // { token, expiresAt } — reused across requests in the same isolate

function base64url(bytes) {
  let str = typeof bytes === "string" ? bytes : String.fromCharCode(...new Uint8Array(bytes));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 30) return cachedToken.token;

  const creds = JSON.parse(env.GOOGLE_SHEETS_CREDENTIALS);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;

  const pem = creds.private_key.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
  const keyBytes = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Token exchange failed: ${JSON.stringify(data)}`);

  cachedToken = { token: data.access_token, expiresAt: now + data.expires_in };
  return data.access_token;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // tighten to your Pages domain once it's live
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const match = url.pathname.match(/^\/sheets\/(.+)$/);
    if (!match) {
      return new Response(JSON.stringify({ error: "Use /sheets/:range" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const range = decodeURIComponent(match[1]);
    const sheetId = env.SHEET_ID;

    try {
      const token = await getAccessToken(env);
      const base = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;

      if (request.method === "GET") {
        const res = await fetch(base, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          status: res.status,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        });
      }

      if (request.method === "PUT") {
        const body = await request.json(); // expects { values: [[...]] }
        const res = await fetch(`${base}?valueInputOption=USER_ENTERED`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ values: body.values }),
        });
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          status: res.status,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        });
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }
  },
};
