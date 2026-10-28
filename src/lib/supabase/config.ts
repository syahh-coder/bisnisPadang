function environment(name: string) {
  // Lookup dinamis menjaga konfigurasi server tetap berasal dari environment
  // proses, termasuk ketika build dipakai pada beberapa server pengujian.
  return process.env[name];
}

export function getSupabaseConfig() {
  return {
    url: environment("NEXT_PUBLIC_SUPABASE_URL"),
    key: environment("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  };
}
