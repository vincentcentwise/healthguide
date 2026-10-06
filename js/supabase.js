import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://gvkypasnjpdolayfzzrw.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_LJrtUPz66pBgW9r_GHvyrQ_jmJQiRCA";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);