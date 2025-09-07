// server.js
import express from "express";
import fetch from "node-fetch";

const app = express();
const YAHOO_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

function fwd(req) {
  const token = req.headers.authorization; // "Bearer <yahoo_access_token>"
  if (!token) throw new Error("Missing Authorization header from GPT Action (Yahoo OAuth)");
  return { headers: { Authorization: token } };
}

// 1) List my NFL leagues → returns raw Yahoo JSON (you can later normalize)
app.get("/leagues", async (req, res) => {
  const url = `${YAHOO_BASE}/users;use_login=1/games;game_keys=nfl/leagues?format=json`;
  const r = await fetch(url, fwd(req));
  res.status(r.status).send(await r.text());
});

// 2) League settings (scoring, roster positions, modifiers)
app.get("/league/:leagueKey/settings", async (req, res) => {
  const { leagueKey } = req.params; // e.g. "425.l.12345"
  const url = `${YAHOO_BASE}/league/${leagueKey}/settings?format=json`;
  const r = await fetch(url, fwd(req));
  res.status(r.status).send(await r.text());
});

// 3) Available players: status=FA (free agents), W (waivers), A (all available)
app.get("/league/:leagueKey/available-players", async (req, res) => {
  const { leagueKey } = req.params;
  const { status = "A", position, sort = "OR", sort_type = "week", sort_week, count = 50, start = 0 } = req.query;
  const filters = [
    `players;status=${status}`,
    position ? `;position=${position}` : "",
    `;sort=${sort}`,
    `;sort_type=${sort_type}`,
    sort_week ? `;sort_week=${sort_week}` : "",
    `;start=${start};count=${count}`
  ].join("");
  const url = `${YAHOO_BASE}/league/${leagueKey}/${filters}?format=json`;
  const r = await fetch(url, fwd(req));
  res.status(r.status).send(await r.text());
});

app.listen(process.env.PORT || 3000, () => console.log("Proxy up"));