const db = window.financeDb;
const APP_STORAGE_KEYS = {
  sessionUser: "finance_active_user",
  legacyLocalData: "lekipe_finance_system_v1"
};

const defaultData = {
  company: { name: "NOME DA SUA EMPRESA", currency: "BRL" },
  users: [],
  categories: {
    revenue: ["Venda", "Serviços", "Consultoria", "Contrato", "Outros"],
    expense: ["Equipamentos", "Marketing", "Impostos", "Salários", "Transporte", "Operacional", "Outros"]
  },
  transactions: [],
  goals: []
};

const viewTitles = {
  dashboardView: "Dashboard",
  receitasView: "Entradas",
  despesasView: "Despesas",
  relatoriosView: "Relatórios",
  metasView: "Metas",
  usuariosView: "Usuários",
  configView: "Configurações"
};

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const state = {
  sessionUser: null,
  selectedMonth: getCurrentMonth(),
  company: { ...defaultData.company },
  users: [...defaultData.users],
  categories: {
    revenue: [...defaultData.categories.revenue],
    expense: [...defaultData.categories.expense]
  },
  transactions: [],
  goals: [],
  charts: { line: null, expense: null }
};

const el = {
  loginScreen: byId("loginScreen"),
  appShell: byId("appShell"),
  loginForm: byId("loginForm"),
  username: byId("username"),
  password: byId("password"),
  navItems: document.querySelectorAll(".nav-item"),
  views: document.querySelectorAll(".view"),
  pageTitle: byId("pageTitle"),
  monthFilter: byId("monthFilter"),
  companyLabel: byId("companyLabel"),
  userName: byId("userName"),
  userRole: byId("userRole"),
  userInitials: byId("userInitials"),
  logoutBtn: byId("logoutBtn"),
  revenueForm: byId("revenueForm"),
  expenseForm: byId("expenseForm"),
  goalForm: byId("goalForm"),
  companyForm: byId("companyForm"),
  revenueCategory: byId("revenueCategory"),
  expenseCategory: byId("expenseCategory"),
  revenueUser: byId("revenueUser"),
  expenseUser: byId("expenseUser"),
  revenuesTable: byId("revenuesTable"),
  expensesTable: byId("expensesTable"),
  latestTransactionsTable: byId("latestTransactionsTable"),
  reportTable: byId("reportTable"),
  goalsTable: byId("goalsTable"),
  goalStatusList: byId("goalStatusList"),
  usersTable: byId("usersTable"),
  annualRevenue: byId("annualRevenue"),
  annualExpense: byId("annualExpense"),
  annualBalance: byId("annualBalance"),
  kpiRevenue: byId("kpiRevenue"),
  kpiExpense: byId("kpiExpense"),
  kpiBalance: byId("kpiBalance"),
  kpiGoal: byId("kpiGoal"),
  kpiRevenueDelta: byId("kpiRevenueDelta"),
  kpiExpenseDelta: byId("kpiExpenseDelta"),
  kpiBalanceStatus: byId("kpiBalanceStatus"),
  kpiGoalLabel: byId("kpiGoalLabel"),
  lastUpdated: byId("lastUpdated"),
  exportCsvBtn: byId("exportCsvBtn"),
  printPdfBtn: byId("printPdfBtn"),
  quickRevenueBtn: byId("quickRevenueBtn"),
  quickExpenseBtn: byId("quickExpenseBtn"),
  companyName: byId("companyName"),
  companyCurrency: byId("companyCurrency"),
  toastContainer: byId("toastContainer"),
  sidebar: byId("sidebar"),
  openSidebarBtn: byId("openSidebarBtn"),
  closeSidebarBtn: byId("closeSidebarBtn"),
  sidebarOverlay: byId("sidebarOverlay"),
  revenueDate: byId("revenueDate"),
  expenseDate: byId("expenseDate"),
  goalMonth: byId("goalMonth"),
  revenueDescription: byId("revenueDescription"),
  expenseDescription: byId("expenseDescription"),
  revenueAmount: byId("revenueAmount"),
  expenseAmount: byId("expenseAmount"),
  goalTitle: byId("goalTitle"),
  goalValue: byId("goalValue"),
  usuariosView: byId("usuariosView"),
  themeToggle: document.querySelector("[data-theme-toggle]")
};

void boot();

async function boot() {
  setupTheme();
  simplifyGoalUI();
  clearLegacyLocalData();
  bindEvents();
  setDefaultFormDates();
  await loadData();
  fillCategories();
  renderStaticFields();
  el.monthFilter.value = state.selectedMonth;
  restoreSession();

  if (db?.isReady?.()) {
    toast("Supabase configurado. Dados sincronizados com o banco.", "success");
  } else {
    toast("Supabase não configurado. Nenhum dado será salvo fora do banco.", "error");
  }
}

function bindEvents() {
  el.loginForm.addEventListener("submit", handleLogin);
  el.logoutBtn.addEventListener("click", logout);
  el.monthFilter.addEventListener("change", handleMonthChange);
  el.revenueForm.addEventListener("submit", handleAddRevenue);
  el.expenseForm.addEventListener("submit", handleAddExpense);
  el.goalForm.addEventListener("submit", handleAddGoal);
  el.companyForm.addEventListener("submit", handleSaveCompany);
  el.exportCsvBtn.addEventListener("click", exportCSV);
  el.printPdfBtn.addEventListener("click", () => window.print());
  el.quickRevenueBtn.addEventListener("click", () => activateNav("receitasView"));
  el.quickExpenseBtn.addEventListener("click", () => activateNav("despesasView"));
  el.openSidebarBtn?.addEventListener("click", openSidebar);
  el.closeSidebarBtn?.addEventListener("click", closeSidebar);
  el.sidebarOverlay?.addEventListener("click", closeSidebar);

  el.navItems.forEach(item => {
    item.addEventListener("click", () => {
      activateNav(item.dataset.view, item);
      closeSidebar();
    });
  });
}

function setupTheme() {
  const root = document.documentElement;
  let theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  root.setAttribute("data-theme", theme);
  updateThemeIcon(theme);

  el.themeToggle?.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", theme);
    updateThemeIcon(theme);
    setTimeout(refreshCharts, 80);
  });
}

function updateThemeIcon(theme) {
  if (!el.themeToggle) return;
  el.themeToggle.textContent = theme === "dark" ? "☀" : "☾";
}

function handleMonthChange() {
  state.selectedMonth = el.monthFilter.value;
  refreshUI();
}

function simplifyGoalUI() {
  const goalTypeField = document.querySelector('label[for="goalType"]')?.closest(".field");
  const goalTypeHeader = [...document.querySelectorAll("th")].find(cell => cell.textContent.trim() === "Tipo");
  const goalTitleInput = byId("goalTitle");

  goalTypeField?.remove();
  goalTypeHeader?.remove();

  if (goalTitleInput) {
    goalTitleInput.placeholder = "Ex: Meta de faturamento do mes";
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const username = normalizeUsername(el.username.value);
  const password = el.password.value;

  let user = null;

  try {
    user = await db.findUserByCredentials(username, password);
  } catch (error) {
    console.error(error);
    toast("Erro ao validar login no banco de dados.", "error");
    return;
  }

  if (!user) {
    toast("Usuário ou senha inválidos.", "error");
    return;
  }

  state.sessionUser = user;
  upsertLoadedUser(user);
  persistSession(user);
  el.loginScreen.classList.add("hidden");
  el.appShell.classList.remove("hidden");
  renderSession();
  refreshUI();
  toast(`Bem-vindo, ${user.name}.`, "success");
}

function logout() {
  state.sessionUser = null;
  clearSession();
  el.appShell.classList.add("hidden");
  el.loginScreen.classList.remove("hidden");
  el.loginForm.reset();
  toast("Sessão encerrada.", "info");
}

function renderSession() {
  const { sessionUser } = state;
  el.userName.textContent = sessionUser.name;
  el.userRole.textContent = sessionUser.role === "admin" ? "Admin" : "Usuário";
  el.userInitials.textContent = initials(sessionUser.name);
  el.revenueUser.value = sessionUser.name;
  el.expenseUser.value = sessionUser.name;
  document.querySelectorAll(".admin-only").forEach(node => {
    node.style.display = sessionUser.role === "admin" ? "block" : "none";
  });

  if (sessionUser.role !== "admin" && (el.usuariosView.classList.contains("active") || byId("configView").classList.contains("active"))) {
    activateNav("dashboardView");
  }
}

function activateNav(viewId, navItem = null) {
  el.views.forEach(view => view.classList.remove("active"));
  byId(viewId).classList.add("active");

  el.navItems.forEach(item => item.classList.remove("active"));
  const current = navItem || [...el.navItems].find(item => item.dataset.view === viewId);
  current?.classList.add("active");

  el.pageTitle.textContent = viewTitles[viewId] || viewTitles.dashboardView;
}

function fillCategories() {
  el.revenueCategory.innerHTML = optionsHtml(state.categories.revenue);
  el.expenseCategory.innerHTML = optionsHtml(state.categories.expense);
}

function setDefaultFormDates() {
  const today = currentDateISO();
  el.revenueDate.value = today;
  el.expenseDate.value = today;
  el.goalMonth.value = getCurrentMonth();
}

function renderStaticFields() {
  el.companyName.value = state.company.name;
  el.companyCurrency.value = state.company.currency;
  el.companyLabel.textContent = state.company.name;
}

async function loadData() {
  if (!requireDatabase(false)) {
    applyLoadedData(defaultData);
    return;
  }

  try {
    applyLoadedData(await db.loadAppData(defaultData));
  } catch (error) {
    console.error(error);
    applyLoadedData(defaultData);
    toast("Falha ao carregar o Supabase.", "error");
  }
}

async function handleAddRevenue(event) {
  event.preventDefault();

  const item = buildTransaction({
    type: "revenue",
    date: el.revenueDate.value,
    category: el.revenueCategory.value,
    description: el.revenueDescription.value,
    amount: el.revenueAmount.value
  });

  if (!isTransactionValid(item)) {
    toast("Preencha todos os campos da entrada.", "error");
    return;
  }

  const success = await persistTransaction(item, {
    success: "Entrada cadastrada com sucesso.",
    error: "Erro ao salvar entrada no Supabase."
  });

  if (!success) return;

  el.revenueForm.reset();
  setDefaultFormDates();
  el.revenueUser.value = state.sessionUser.name;
}

async function handleAddExpense(event) {
  event.preventDefault();

  const item = buildTransaction({
    type: "expense",
    date: el.expenseDate.value,
    category: el.expenseCategory.value,
    description: el.expenseDescription.value,
    amount: el.expenseAmount.value
  });

  if (!isTransactionValid(item)) {
    toast("Preencha todos os campos da despesa.", "error");
    return;
  }

  const success = await persistTransaction(item, {
    success: "Despesa cadastrada com sucesso.",
    error: "Erro ao salvar despesa no Supabase."
  });

  if (!success) return;

  el.expenseForm.reset();
  setDefaultFormDates();
  el.expenseUser.value = state.sessionUser.name;
}

async function persistTransaction(item, messages) {
  if (!requireDatabase()) return false;

  state.transactions.push(item);

  try {
    await db.insertTransaction(item);
  } catch (error) {
    console.error(error);
    state.transactions = state.transactions.filter(transaction => transaction.id !== item.id);
    toast(messages.error, "error");
    return false;
  }

  refreshUI();
  toast(messages.success, "success");
  return true;
}

async function handleAddGoal(event) {
  event.preventDefault();
  if (!requireDatabase()) return;

  const item = {
    id: Date.now(),
    month: el.goalMonth.value,
    title: el.goalTitle.value.trim(),
    type: "revenue",
    value: Number(el.goalValue.value)
  };

  if (!item.month || !item.title || item.value <= 0) {
    toast("Preencha todos os campos da meta.", "error");
    return;
  }

  state.goals.push(item);

  try {
    await db.insertGoal(item);
  } catch (error) {
    console.error(error);
    state.goals = state.goals.filter(goal => goal.id !== item.id);
    toast("Erro ao salvar meta no Supabase.", "error");
    return;
  }

  el.goalForm.reset();
  el.goalMonth.value = state.selectedMonth;
  refreshUI();
  toast("Meta cadastrada com sucesso.", "success");
}

async function handleSaveCompany(event) {
  event.preventDefault();
  if (!requireDatabase()) return;

  state.company = {
    name: el.companyName.value.trim() || defaultData.company.name,
    currency: el.companyCurrency.value
  };

  try {
    await db.upsertCompany(state.company);
  } catch (error) {
    console.error(error);
    toast("Erro ao salvar configurações no Supabase.", "error");
    return;
  }

  renderStaticFields();
  refreshUI();
  toast("Configurações salvas.", "success");
}

function refreshUI() {
  if (!state.sessionUser) return;

  renderStaticFields();
  renderKPIs();
  renderTables();
  renderReports();
  renderGoals();
  renderUsers();
  renderLatestTransactions();
  refreshCharts();
  el.lastUpdated.textContent = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderKPIs() {
  const monthItems = getTransactionsByMonth(state.selectedMonth);
  const previousItems = getTransactionsByMonth(getPreviousMonth(state.selectedMonth));
  const revenue = sumByType(monthItems, "revenue");
  const expense = sumByType(monthItems, "expense");
  const balance = revenue - expense;
  const prevRevenue = sumByType(previousItems, "revenue");
  const prevExpense = sumByType(previousItems, "expense");
  const prevBalance = prevRevenue - prevExpense;
  const currentGoals = state.goals.filter(goal => goal.month === state.selectedMonth);
  const completedGoals = currentGoals.filter(goal => goalStatus(goal).done).length;
  const goalPercent = currentGoals.length ? Math.round((completedGoals / currentGoals.length) * 100) : 0;

  el.kpiRevenue.textContent = formatCurrency(revenue);
  el.kpiExpense.textContent = formatCurrency(expense);
  el.kpiBalance.textContent = formatCurrency(balance);
  el.kpiGoal.textContent = `${goalPercent}%`;
  el.kpiRevenueDelta.textContent = `${percentChange(prevRevenue, revenue)}%`;
  el.kpiExpenseDelta.textContent = `${percentChange(prevExpense, expense)}%`;
  el.kpiBalanceStatus.textContent = balance >= prevBalance ? "Melhor que o mês anterior" : "Abaixo do mês anterior";
  el.kpiGoalLabel.textContent = currentGoals.length ? `${completedGoals} de ${currentGoals.length} metas` : "Sem meta definida";
  el.kpiRevenueDelta.className = `kpi-delta ${revenue >= prevRevenue ? "positive" : "negative"}`;
  el.kpiExpenseDelta.className = `kpi-delta ${expense <= prevExpense ? "positive" : "negative"}`;
  el.kpiBalanceStatus.className = `kpi-delta ${balance >= 0 ? "positive" : "negative"}`;
}

function renderTables() {
  const revenues = getVisibleTransactions("revenue");
  const expenses = getVisibleTransactions("expense");
  el.revenuesTable.innerHTML = revenues.length ? revenues.map(transactionRow).join("") : emptyRow("Nenhuma entrada cadastrada neste período.", 5);
  el.expensesTable.innerHTML = expenses.length ? expenses.map(transactionRow).join("") : emptyRow("Nenhuma despesa cadastrada neste período.", 5);
  bindTableActions();
}

function transactionRow(item) {
  const canDelete = state.sessionUser.role === "admin";
  return `
    <tr>
      <td>${formatDate(item.date)}</td>
      <td>${item.category}</td>
      <td>${item.description}</td>
      <td>${formatCurrency(item.amount)}</td>
      <td><div class="table-actions">${canDelete ? `<button class="table-btn" data-delete-transaction="${item.id}">Excluir</button>` : `<span class="badge info">Visualização</span>`}</div></td>
    </tr>
  `;
}

function bindTableActions() {
  bindDeleteActions("[data-delete-transaction]", "deleteTransaction", state.transactions, "Erro ao remover lançamento do Supabase.", "Lançamento removido.");
  bindDeleteActions("[data-delete-goal]", "deleteGoal", state.goals, "Erro ao remover meta do Supabase.", "Meta removida.");
}

function bindDeleteActions(selector, methodName, collection, errorMessage, successMessage) {
  document.querySelectorAll(selector).forEach(button => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.deleteTransaction || button.dataset.deleteGoal);
      const previousItems = [...collection];

      if (methodName === "deleteTransaction") {
        state.transactions = state.transactions.filter(item => item.id !== id);
      } else {
        state.goals = state.goals.filter(item => item.id !== id);
      }

      try {
        await db[methodName](id);
      } catch (error) {
        console.error(error);
        if (methodName === "deleteTransaction") {
          state.transactions = previousItems;
        } else {
          state.goals = previousItems;
        }
        toast(errorMessage, "error");
        return;
      }

      refreshUI();
      toast(successMessage, "info");
    });
  });
}

function renderLatestTransactions() {
  const items = [...state.transactions].sort(sortByDateDesc).slice(0, 6);
  el.latestTransactionsTable.innerHTML = items.length ? items.map(latestTransactionRow).join("") : emptyRow("Sem lançamentos recentes.", 5);
}

function latestTransactionRow(item) {
  return `
    <tr>
      <td>${formatDate(item.date)}</td>
      <td><span class="badge ${item.type === "revenue" ? "success" : "error"}">${item.type === "revenue" ? "Entrada" : "Despesa"}</span></td>
      <td>${item.category}</td>
      <td>${item.description}</td>
      <td>${formatCurrency(item.amount)}</td>
    </tr>
  `;
}

function renderReports() {
  const report = buildMonthlySummary();
  el.reportTable.innerHTML = report.map(row => `
    <tr>
      <td>${row.label}</td>
      <td>${formatCurrency(row.revenue)}</td>
      <td>${formatCurrency(row.expense)}</td>
      <td>${formatCurrency(row.balance)}</td>
      <td>${row.goal ? formatCurrency(row.goal.value) : "-"}</td>
      <td>${row.statusHtml}</td>
    </tr>
  `).join("");

  const annualRevenue = report.reduce((sum, row) => sum + row.revenue, 0);
  const annualExpense = report.reduce((sum, row) => sum + row.expense, 0);
  el.annualRevenue.textContent = formatCurrency(annualRevenue);
  el.annualExpense.textContent = formatCurrency(annualExpense);
  el.annualBalance.textContent = formatCurrency(annualRevenue - annualExpense);
}

function buildMonthlySummary() {
  const year = new Date().getFullYear();
  return monthNames.map((name, index) => {
    const month = `${year}-${String(index + 1).padStart(2, "0")}`;
    const items = getTransactionsByMonth(month);
    const revenue = sumByType(items, "revenue");
    const expense = sumByType(items, "expense");
    const balance = revenue - expense;
    const goal = state.goals.find(item => item.month === month);
    const status = goal ? goalStatus(goal, { revenue, expense, balance }) : null;

    return {
      label: `${name}/${String(year).slice(-2)}`,
      revenue,
      expense,
      balance,
      goal,
      statusHtml: goal
        ? `<span class="badge ${status.done ? "success" : "warning"}">${status.label}</span>`
        : `<span class="badge info">Sem meta</span>`
    };
  });
}

function renderGoals() {
  el.goalsTable.innerHTML = state.goals.length ? state.goals.map(goalTableRow).join("") : emptyRow("Nenhuma meta cadastrada.", 5);

  const monthGoals = state.goals.filter(goal => goal.month === state.selectedMonth);
  el.goalStatusList.innerHTML = monthGoals.length
    ? monthGoals.map(goalCard).join("")
    : `<div class="goal-item"><strong>Nenhuma meta definida</strong><p>Cadastre metas para acompanhar o desempenho do mês selecionado.</p></div>`;

  bindTableActions();
}

function goalTableRow(goal) {
  const status = goalStatus(goal);
  return `
    <tr>
      <td>${goal.month}</td>
      <td>${goal.title}</td>
      <td>${formatCurrency(goal.value)}</td>
      <td><span class="badge ${status.done ? "success" : "warning"}">${status.label}</span></td>
      <td>${state.sessionUser.role === "admin" ? `<button class="table-btn" data-delete-goal="${goal.id}">Excluir</button>` : `<span class="badge info">Visualização</span>`}</td>
    </tr>
  `;
}

function goalCard(goal) {
  const status = goalStatus(goal);
  return `
    <div class="goal-item">
      <strong>${goal.title}</strong>
      <p>Meta: ${formatCurrency(goal.value)}</p>
      <span class="badge ${status.done ? "success" : "warning"}">${status.label}</span>
    </div>
  `;
}

function renderUsers() {
  if (state.sessionUser.role !== "admin") {
    el.usersTable.innerHTML = emptyRow("Somente administradores podem visualizar os usuários cadastrados.", 3);
    return;
  }

  el.usersTable.innerHTML = state.users.map(user => `
    <tr>
      <td>${user.name}</td>
      <td>${user.username}</td>
      <td><span class="badge ${user.role === "admin" ? "info" : "success"}">${user.role === "admin" ? "Admin" : "Usuário"}</span></td>
    </tr>
  `).join("");
}

function refreshCharts() {
  if (typeof Chart !== "function") return;
  renderLineChart();
  renderExpenseChart();
}

function renderLineChart() {
  const report = buildMonthlySummary();
  renderChart("line", byId("lineChart"), {
    type: "line",
    data: {
      labels: report.map(item => item.label),
      datasets: [
        { label: "Entradas", data: report.map(item => item.revenue), borderColor: getCss("--color-primary"), backgroundColor: transparentize(getCss("--color-primary"), 0.15), tension: 0.35, fill: false },
        { label: "Despesas", data: report.map(item => item.expense), borderColor: getCss("--color-error"), backgroundColor: transparentize(getCss("--color-error"), 0.15), tension: 0.35, fill: false }
      ]
    },
    options: chartOptions()
  });
}

function renderExpenseChart() {
  const grouped = groupByCategory(getTransactionsByMonth(state.selectedMonth).filter(item => item.type === "expense"));
  const hasData = Object.keys(grouped).length > 0;

  renderChart("expense", byId("expenseChart"), {
    type: "doughnut",
    data: {
      labels: hasData ? Object.keys(grouped) : ["Sem dados"],
      datasets: [{
        data: hasData ? Object.values(grouped) : [1],
        backgroundColor: hasData
          ? [getCss("--color-primary"), getCss("--color-secondary"), getCss("--color-error"), "#4a8a2d", "#6d5ca8", "#a16b1a"]
          : [transparentize(getCss("--color-text"), 0.75)]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: getCss("--color-text"), font: { family: "Satoshi" } } } }
    }
  });
}

function renderChart(key, canvas, config) {
  if (!canvas) return;
  destroyChart(key);
  state.charts[key] = new Chart(canvas, config);
}

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { labels: { color: getCss("--color-text"), font: { family: "Satoshi" } } } },
    scales: {
      x: { ticks: { color: getCss("--color-text-muted") }, grid: { color: transparentize(getCss("--color-text"), 0.92) } },
      y: { ticks: { color: getCss("--color-text-muted"), callback: value => formatCurrency(value) }, grid: { color: transparentize(getCss("--color-text"), 0.92) } }
    }
  };
}

function destroyChart(key) {
  if (!state.charts[key]) return;
  state.charts[key].destroy();
  state.charts[key] = null;
}

function exportCSV() {
  const rows = [
    ["Data", "Tipo", "Categoria", "Descrição", "Valor", "Responsável"],
    ...state.transactions.map(item => [
      item.date,
      item.type === "revenue" ? "Entrada" : "Despesa",
      item.category,
      item.description,
      item.amount.toFixed(2),
      item.user
    ])
  ];
  const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio-financeiro-${state.selectedMonth}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast("Arquivo CSV exportado.", "success");
}

function getVisibleTransactions(type) {
  const items = getTransactionsByMonth(state.selectedMonth).filter(item => item.type === type);
  if (state.sessionUser.role === "admin") return items.sort(sortByDateDesc);
  return items.filter(item => item.user === state.sessionUser.name).sort(sortByDateDesc);
}

function getTransactionsByMonth(month) {
  return state.transactions.filter(item => item.date.startsWith(month));
}

function sumByType(items, type) {
  return items.filter(item => item.type === type).reduce((sum, item) => sum + item.amount, 0);
}

function groupByCategory(items) {
  return items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});
}

function goalStatus(goal, metrics = null) {
  const monthItems = getTransactionsByMonth(goal.month);
  const revenue = metrics?.revenue ?? sumByType(monthItems, "revenue");

  return revenue >= goal.value
    ? { done: true, label: "Atingida" }
    : { done: false, label: `Faltam ${formatCurrency(goal.value - revenue)}` };
}

function emptyRow(message, colspan) {
  return `<tr><td colspan="${colspan}">${message}</td></tr>`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: state.company.currency || "BRL"
  }).format(Number(value || 0));
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

function initials(name) {
  return name.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase();
}

function currentDateISO() {
  return new Date().toISOString().split("T")[0];
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getPreviousMonth(month) {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(year, mon - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function percentChange(previous, current) {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

function sortByDateDesc(a, b) {
  return new Date(b.date) - new Date(a.date);
}

function getCss(variable) {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

function transparentize(color, opacity) {
  if (!color.startsWith("#")) return color;
  const hex = color.replace("#", "");
  const fullHex = hex.length === 3 ? hex.split("").map(char => char + char).join("") : hex;
  const bigint = Number.parseInt(fullHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function toast(message, type = "info") {
  const node = document.createElement("div");
  node.className = "toast";
  node.innerHTML = `<strong>${toastTitle(type)}</strong><p>${message}</p>`;
  el.toastContainer.appendChild(node);
  setTimeout(() => node.remove(), 3200);
}

function toastTitle(type) {
  return {
    success: "Sucesso",
    error: "Erro",
    info: "Informação"
  }[type] || "Aviso";
}

function requireDatabase(showToast = true) {
  if (db?.isReady?.()) return true;
  if (showToast) toast("Configure o Supabase para salvar e consultar os dados.", "error");
  return false;
}

function applyLoadedData(data) {
  state.company = data.company || { ...defaultData.company };
  state.users = data.users?.length ? data.users : [...defaultData.users];
  state.categories = data.categories || {
    revenue: [...defaultData.categories.revenue],
    expense: [...defaultData.categories.expense]
  };
  state.transactions = data.transactions || [];
  state.goals = data.goals || [];
}

function clearLegacyLocalData() {
  try {
    localStorage.removeItem(APP_STORAGE_KEYS.legacyLocalData);
  } catch {}
}

function restoreSession() {
  const savedUsername = getStoredSessionUsername();
  if (!savedUsername) return;

  const user = state.users.find(item => normalizeUsername(item.username) === savedUsername);
  if (!user) {
    clearSession();
    return;
  }

  state.sessionUser = user;
  el.loginScreen.classList.add("hidden");
  el.appShell.classList.remove("hidden");
  renderSession();
  refreshUI();
}

function persistSession(user) {
  try {
    sessionStorage.setItem(APP_STORAGE_KEYS.sessionUser, normalizeUsername(user.username));
  } catch {}
}

function clearSession() {
  try {
    sessionStorage.removeItem(APP_STORAGE_KEYS.sessionUser);
  } catch {}
}

function getStoredSessionUsername() {
  try {
    return sessionStorage.getItem(APP_STORAGE_KEYS.sessionUser);
  } catch {
    return null;
  }
}

function upsertLoadedUser(user) {
  const existingIndex = state.users.findIndex(item => item.id === user.id || normalizeUsername(item.username) === normalizeUsername(user.username));

  if (existingIndex >= 0) {
    state.users[existingIndex] = user;
    return;
  }

  state.users.push(user);
}

function normalizeUsername(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function openSidebar() {
  el.sidebar.classList.add("open");
  el.sidebarOverlay.classList.add("show");
}

function closeSidebar() {
  el.sidebar.classList.remove("open");
  el.sidebarOverlay.classList.remove("show");
}

function buildTransaction({ type, date, category, description, amount }) {
  return {
    id: Date.now(),
    type,
    date,
    category,
    description: description.trim(),
    amount: Number(amount),
    user: state.sessionUser.name
  };
}

function isTransactionValid(item) {
  return Boolean(item.date && item.category && item.description && item.amount > 0);
}

function byId(id) {
  return document.getElementById(id);
}

function optionsHtml(items) {
  return items.map(item => `<option value="${item}">${item}</option>`).join("");
}
