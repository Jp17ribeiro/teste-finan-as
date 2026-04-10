(() => {
  const DEFAULT_CONFIG = {
    url: "https://qxbqfyybljlsrugdlxaj.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4YnFmeXlibGpsc3J1Z2RseGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDk4MTQsImV4cCI6MjA5MTMyNTgxNH0.-nT5hLb_3n3aaSOvprAWBKehajRArma79Znm1Dg19BI",
    storageKey: "finance_supabase_config"
  };

  function readStoredConfig() {
    try {
      const raw = localStorage.getItem(DEFAULT_CONFIG.storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function persistConfig(config) {
    try {
      localStorage.setItem(DEFAULT_CONFIG.storageKey, JSON.stringify(config));
    } catch {}
  }

  const runtimeConfig = window.__SUPABASE_CONFIG__ || {};
  const storedConfig = readStoredConfig();
  const validStoredConfig = storedConfig?.url && storedConfig?.anonKey ? storedConfig : {};

  window.SUPABASE_CONFIG = {
    ...DEFAULT_CONFIG,
    ...validStoredConfig,
    ...runtimeConfig
  };

  window.setSupabaseConfig = function setSupabaseConfig(nextConfig) {
    window.SUPABASE_CONFIG = {
      ...window.SUPABASE_CONFIG,
      ...nextConfig
    };

    persistConfig({
      url: window.SUPABASE_CONFIG.url,
      anonKey: window.SUPABASE_CONFIG.anonKey
    });

    return window.SUPABASE_CONFIG;
  };
})();
