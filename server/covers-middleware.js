const { StringDecoder } = require("string_decoder");

function readBody(req) {
  return new Promise((resolve, reject) => {
    const decoder = new StringDecoder("utf8");
    let body = "";
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 100_000) {
        reject(new Error("too large"));
        req.destroy();
        return;
      }
      body += decoder.write(chunk);
    });
    req.on("end", () => resolve(body + decoder.end()));
    req.on("error", reject);
  });
}

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(body);
}

function igdbModule() {
  return require("jiti")(__filename)("../src/igdb.ts");
}

function coversHandler(req, res) {
  readBody(req)
    .then(async (raw) => {
      const { igdbConfigured, lookupCovers } = igdbModule();
      if (!igdbConfigured()) {
        send(res, 200, { configured: false, covers: {} });
        return;
      }
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        send(res, 400, { configured: true, covers: {} });
        return;
      }
      const items = Array.isArray(parsed.items) ? parsed.items.slice(0, 40) : [];
      const covers = await lookupCovers(
        items.flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const key = typeof item.key === "string" ? item.key.slice(0, 80) : "";
          const title = typeof item.title === "string" ? item.title.slice(0, 200) : "";
          const platformId = typeof item.platformId === "string" ? item.platformId.slice(0, 40) : "";
          if (!key || !title || !platformId) return [];
          return [{ key, title, platformId }];
        }),
      );
      send(res, 200, { configured: true, covers });
    })
    .catch(() => {
      if (!res.writableEnded) send(res, 502, { configured: true, covers: {} });
    });
}

function switch2Handler(req, res) {
  readBody(req)
    .then(async (raw) => {
      const { igdbConfigured, switch2Catalog } = igdbModule();
      if (!igdbConfigured()) {
        send(res, 200, { configured: false, games: [], nextPage: undefined });
        return;
      }
      let parsed = {};
      try {
        parsed = raw ? JSON.parse(raw) : {};
      } catch {
        send(res, 400, { configured: true, games: [], nextPage: undefined });
        return;
      }
      const query = typeof parsed.query === "string" ? parsed.query.slice(0, 200) : "";
      const page = typeof parsed.page === "number" && parsed.page > 0 ? Math.floor(parsed.page) : 1;
      const result = await switch2Catalog(query, page);
      send(res, 200, { configured: true, ...result });
    })
    .catch(() => {
      if (!res.writableEnded) send(res, 502, { configured: true, games: [], nextPage: undefined });
    });
}

function detailsHandler(req, res) {
  readBody(req)
    .then(async (raw) => {
      const { igdbConfigured, lookupDetails } = igdbModule();
      if (!igdbConfigured()) {
        send(res, 200, { configured: false, details: null });
        return;
      }
      let parsed = {};
      try {
        parsed = raw ? JSON.parse(raw) : {};
      } catch {
        send(res, 400, { configured: true, details: null });
        return;
      }
      const title = typeof parsed.title === "string" ? parsed.title.slice(0, 200) : "";
      const platformId = typeof parsed.platformId === "string" ? parsed.platformId.slice(0, 40) : "";
      send(res, 200, { configured: true, details: title && platformId ? await lookupDetails({ title, platformId }) : null });
    })
    .catch(() => {
      if (!res.writableEnded) send(res, 502, { configured: true, details: null });
    });
}

function catalogHandler(req, res) {
  readBody(req)
    .then(async (raw) => {
      const { igdbConfigured, searchCatalog } = igdbModule();
      if (!igdbConfigured()) {
        send(res, 200, { configured: false, games: [], nextPage: undefined });
        return;
      }
      let parsed = {};
      try {
        parsed = raw ? JSON.parse(raw) : {};
      } catch {
        send(res, 400, { configured: true, games: [], nextPage: undefined });
        return;
      }
      const query = typeof parsed.query === "string" ? parsed.query.slice(0, 200) : "";
      const page = typeof parsed.page === "number" && parsed.page > 0 ? Math.min(40, Math.floor(parsed.page)) : 1;
      const platformIds = Array.isArray(parsed.platformIds)
        ? parsed.platformIds.flatMap((id) => (typeof id === "string" ? [id.slice(0, 40)] : [])).slice(0, 40)
        : [];
      const result = await searchCatalog(query, page, platformIds);
      send(res, 200, { configured: true, ...result });
    })
    .catch(() => {
      if (!res.writableEnded) send(res, 502, { configured: true, games: [], nextPage: undefined });
    });
}
function coversMiddleware(metroMiddleware) {
  return (req, res, next) => {
    const path = String(req.url || "").split("?")[0];
    if (req.method === "POST" && path === "/covers") {
      coversHandler(req, res);
      return;
    }
    if (req.method === "POST" && path === "/details") {
      detailsHandler(req, res);
      return;
    }
    if (req.method === "POST" && path === "/switch-2") {
      switch2Handler(req, res);
      return;
    }
    if (req.method === "POST" && path === "/catalog") {
      catalogHandler(req, res);
      return;
    }
    return metroMiddleware(req, res, next);
  };
}

module.exports = { coversMiddleware };
