// scripts/supabase.js

// Import the Supabase client library
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
    "https://eqgklaeypeoeyywefbes.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZ2tsYWV5cGVvZXl5d2VmYmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTExMjMsImV4cCI6MjA2MjIyNzEyM30.raO5j0aNpiuwxnPuW1o-23GVjaEps429vRyBtM0xDls"
  );