const functions  = require("firebase-functions");
const fetch      = (...args) => import("node-fetch").then(({default: f}) => f(...args));

// grab secret
const SERVICE_KEY = functions.config().supabase.service_role;
const SUPABASE_URL = "https://eqgklaeypeoeyywefbes.supabase.co";

// POST body: { legacy: 1.5, new: 10 }
exports.updateRates = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST,OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST")    return res.status(405).send("POST only");

  const { legacy, new: newer } = req.body || {};
  if (legacy == null || newer == null) return res.status(400).send("Missing rates");

  try {
    // Legacy row
    await fetch(`${SUPABASE_URL}/rest/v1/commission_values?type=eq.Legacy`, {
      method: "PATCH",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ value: legacy })
    });

    // New row
    await fetch(`${SUPABASE_URL}/rest/v1/commission_values?type=eq.New`, {
      method: "PATCH",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ value: newer })
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message);
  }
});
