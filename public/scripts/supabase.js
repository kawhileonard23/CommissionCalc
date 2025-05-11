// scripts/supabase.js

// Import the Supabase client library
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

console.log("Supabase script loaded.");

// Replace these with your actual Supabase URL and anon key
const supabaseUrl = "https://eqgklaeypeoeyywefbes.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZ2tsYWV5cGVvZXl5d2VmYmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTExMjMsImV4cCI6MjA2MjIyNzEyM30.raO5j0aNpiuwxnPuW1o-23GVjaEps429vRyBtM0xDls";
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Supabase client initialized:", supabase);

// Test connection function
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabase
            .from("users")  // Replace "users" with any valid table name
            .select("*")
            .limit(1);

        if (error) {
            console.error("Error connecting to Supabase:", error.message);
            alert("Supabase connection failed: " + error.message);
            return false;
        }

        console.log("Supabase connection successful. Data:", data);
        alert("Supabase connected! Data: " + JSON.stringify(data));
        return true;
    } catch (e) {
        console.error("Unexpected error:", e);
        alert("Unexpected error: " + e.message);
        return false;
    }
}

export { testSupabaseConnection };
