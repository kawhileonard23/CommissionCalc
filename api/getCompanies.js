// api/getCompanies.js
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // 1️⃣ Always send CORS headers up front
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  // 2️⃣ Preflight request handling
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // 3️⃣ Now do your Supabase fetch
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    return res.status(500).json({ error: "Missing Supabase key" });
  }
  const supabase = createClient(
    "https://eqgklaeypeoeyywefbes.supabase.co",
    key
  );

  try {
    const { data, error, status } = await supabase
      .from("companies_change")
      .select("company_name,owner,commission_rate");

    if (error) {
      return res.status(status || 500).json({ error: error.message });
    }
    // 4️⃣ Send the JSON back
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
g