(() => {
  function canCreateClient() {
    return Boolean(
      window.supabase &&
      typeof window.supabase.createClient === "function" &&
      window.SUPABASE_CONFIG?.url &&
      window.SUPABASE_CONFIG?.anonKey
    );
  }

  function createClient() {
    if (!canCreateClient()) return null;

    return window.supabase.createClient(
      window.SUPABASE_CONFIG.url,
      window.SUPABASE_CONFIG.anonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  }

  let client = createClient();

  window.supabaseClient = {
    isReady() {
      return Boolean(client);
    },

    getClient() {
      if (!client) {
        client = createClient();
      }

      return client;
    },

    getConfigSummary() {
      return {
        url: window.SUPABASE_CONFIG?.url || "",
        hasAnonKey: Boolean(window.SUPABASE_CONFIG?.anonKey)
      };
    }
  };
})();
