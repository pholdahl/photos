// import { createClient } from "@supabase/supabase-js";
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js";

const supabaseUrl = "https://xfflyfzlowqzkfrgqbst.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZmx5Znpsb3dxemtmcmdxYnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQ0MDQ2MDcsImV4cCI6MjAyOTk4MDYwN30.T6aB_dO5X1XiBjmDUm1_GQ94dJKRdVJbSfxnEAMup8o";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
