(() => {
  const clientApi = window.supabaseClient;

  const TABLES = {
    company: "company_settings",
    users: "app_users",
    categories: "finance_categories",
    transactions: "finance_transactions",
    goals: "finance_goals"
  };

  function getClient() {
    const client = clientApi?.getClient?.();

    if (!client) {
      throw new Error("Supabase não configurado. Defina a anon key antes de usar o banco.");
    }

    return client;
  }

  function maybeSingle(data) {
    return Array.isArray(data) ? data[0] || null : data;
  }

  async function queryBuilder(promise) {
    const { data, error } = await promise;
    if (error) throw error;
    return data;
  }

  async function queryOrFallback(promise, fallbackValue) {
    try {
      return await queryBuilder(promise);
    } catch (error) {
      console.warn("Supabase fallback acionado:", error);
      return fallbackValue;
    }
  }

  function normalizeCategories(rows, fallback) {
    if (!rows?.length) return fallback;

    return {
      revenue: rows.filter(item => item.type === "revenue").map(item => item.name),
      expense: rows.filter(item => item.type === "expense").map(item => item.name)
    };
  }

  function normalizeUser(row) {
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      username: row.username,
      role: row.role || "user"
    };
  }

  function normalizeTransaction(row) {
    return {
      id: row.id,
      type: row.type,
      date: row.date,
      category: row.category,
      description: row.description,
      amount: Number(row.amount),
      user: row.user_name
    };
  }

  function normalizeGoal(row) {
    return {
      id: row.id,
      month: row.month,
      title: row.title,
      type: row.type,
      value: Number(row.value)
    };
  }

  window.financeDb = {
    isReady() {
      return Boolean(clientApi?.isReady?.());
    },

    async loadAppData(defaultData) {
      const client = getClient();

      const [companyRows, userRows, categoryRows, transactionRows, goalRows] = await Promise.all([
        queryOrFallback(client.from(TABLES.company).select("*").limit(1), []),
        queryOrFallback(client.from(TABLES.users).select("*").order("name"), []),
        queryOrFallback(client.from(TABLES.categories).select("*").order("type").order("sort_order"), []),
        queryOrFallback(client.from(TABLES.transactions).select("*").order("date", { ascending: false }), []),
        queryOrFallback(client.from(TABLES.goals).select("*").order("month", { ascending: false }), [])
      ]);

      const company = maybeSingle(companyRows);

      return {
        company: company
          ? { name: company.name, currency: company.currency || "BRL" }
          : defaultData.company,
        users: userRows.map(normalizeUser),
        categories: normalizeCategories(categoryRows, defaultData.categories),
        transactions: transactionRows.map(normalizeTransaction),
        goals: goalRows.map(normalizeGoal)
      };
    },

    async findUserByCredentials(username, password) {
      const client = getClient();

      const data = await queryBuilder(
        client
          .from(TABLES.users)
          .select("*")
          .eq("username", username)
          .eq("password", password)
          .limit(1)
      );

      return normalizeUser(maybeSingle(data));
    },

    async insertTransaction(item) {
      const client = getClient();

      await queryBuilder(
        client.from(TABLES.transactions).insert({
          id: item.id,
          type: item.type,
          date: item.date,
          category: item.category,
          description: item.description,
          amount: item.amount,
          user_name: item.user
        })
      );
    },

    async deleteTransaction(id) {
      const client = getClient();

      await queryBuilder(client.from(TABLES.transactions).delete().eq("id", id));
    },

    async insertGoal(item) {
      const client = getClient();

      await queryBuilder(
        client.from(TABLES.goals).insert({
          id: item.id,
          month: item.month,
          title: item.title,
          type: item.type,
          value: item.value
        })
      );
    },

    async deleteGoal(id) {
      const client = getClient();

      await queryBuilder(client.from(TABLES.goals).delete().eq("id", id));
    },

    async upsertCompany(company) {
      const client = getClient();

      await queryBuilder(
        client.from(TABLES.company).upsert(
          {
            id: 1,
            name: company.name,
            currency: company.currency,
            updated_at: new Date().toISOString()
          },
          { onConflict: "id" }
        )
      );
    }
  };
})();
