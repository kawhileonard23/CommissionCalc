const functions = require("firebase-functions");
const {createClient} = require("@supabase/supabase-js");

const supabaseUrl = "https://eqgklaeypeoeyywefbes.supabase.co";
const supabaseKey = functions.config().supabase.key;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.getCompanies = functions.https.onRequest(async (req, res) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).send("");
  }

  // Allow the browser to call us from any origin
  res.set("Access-Control-Allow-Origin", "*");

  try {
    const {data, error} = await supabase
        .from("companies_change")
        .select("company_name,owner,commission_rate");

    if (error) {
      console.error("Supabase returned error:", error.message);
      return res.status(500).json({error: error.message});
    }

    return res.json(data);
  } catch (err) {
    console.error("Unexpected error:", err.message);
    return res.status(500).json({error: err.message});
  }
});
