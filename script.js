/* =============================================
   Pennypilot — Financial Planning System
   script.js
   ============================================= */

// =============================================
// STATE MANAGEMENT
// =============================================

let state = {
  hideBalance: false,
  incomes: [],
  expenses: [],
  envelopes: [],
  userProfile: {
    image: '',
    fullName: '',
    nickname: '',
    mobile: '',
    email: '',
    gender: '',
    dob: '',
    address: ''
  },
  settings: {
    theme: 'dark',
    currency: '$'
  },
  lastUpdated: new Date().toISOString()
};

function formatMoney(amount) {
  const currency = state.settings?.currency || '$';
  return `${currency} ${Number(amount).toLocaleString('en-US')}`;
}

function applyTheme() {
  const theme = state.settings?.theme || 'dark';
  if (theme === 'light') {
    document.body.setAttribute('data-theme', 'light');
  } else {
    document.body.removeAttribute('data-theme');
  }
}

function saveState() {
  state.lastUpdated = new Date().toISOString();
  localStorage.setItem('flowfund_state', JSON.stringify(state));
  renderApp();
}

function loadState() {
  const saved = localStorage.getItem('flowfund_state');
  if (saved) {
    try {
      state = JSON.parse(saved);
      // Ensure settings exists for older state versions
      if (!state.settings) {
        state.settings = { theme: 'dark', currency: '$' };
      }
    } catch (e) {
      console.error('Could not parse state from localStorage');
    }
  }
  applyTheme();
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function getIconHtml(icon) {
  const mapping = {
    '': 'la-university',
    '': 'la-bullseye',
    '': 'la-home',
    '': 'la-car',
    '': 'la-mobile',
    '': 'la-medkit',
    '': 'la-graduation-cap',
    '': 'la-briefcase',
    'star': 'la-star',
    'warning': 'la-exclamation-triangle',
    'info': 'la-info-circle',
    'success': 'la-check-circle',
    'trash': 'la-trash-alt',
    'check': 'la-check-circle',
    'chart': 'la-chart-bar'
  };
  const iconClass = mapping[icon] || icon || 'la-question-circle';
  return `<i class="las ${iconClass}"></i>`;
}

// =============================================
// NAVIGATION
// =============================================

const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const pageTitle = document.getElementById('pageTitle');

const pageTitles = {
  home: 'Home',
  income: 'Income',
  expenses: 'Expenses',
  savings: 'Savings',
  budget: 'Budget Planner',
  alerts: 'Alerts',
  support: 'Support Center',
  summary: 'Summary',
  profile: 'User Profile'
};

navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    if (item.tagName === 'A') e.preventDefault();
    const target = item.getAttribute('data-page');

    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');

    pages.forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`page-${target}`);
    if (targetPage) targetPage.classList.add('active');

    if (pageTitle) pageTitle.textContent = pageTitles[target] || target;

    // Ensure all data is rendered for the new page
    renderApp();

    // Trigger chart redraws if navigating to those pages
    if (target === 'home' || target === 'summary') {
      setTimeout(renderCharts, 50); // slight delay to ensure container is visible
    }
  });
});

function navigateTo(page) {
  const item = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (item) item.click();
}

// =============================================
// RENDERING LOGIC
// =============================================

function renderApp() {
  checkAutoWithdrawals();
  renderDashboard();
  renderIncomes();
  renderExpenses();
  renderEnvelopes();
  renderProfile();
  renderSummary();
  renderCharts();
}

function renderDashboard() {
  // 1. Calculate Balance
  const totalIncome = state.incomes.reduce((sum, inc) => sum + Number(inc.amount), 0);
  const paidExpenses = state.expenses.filter(e => e.isPaid).reduce((sum, exp) => sum + Number(exp.amount), 0);
  const balance = totalIncome - paidExpenses;

  const dashBalance = document.getElementById('dashBalance');
  if (dashBalance) {
    dashBalance.setAttribute('data-amount', balance);
    dashBalance.textContent = state.hideBalance ? '****' : `${formatMoney(balance)}`;
    const toggleBtn = document.getElementById('toggleBalanceBtn');
    if (toggleBtn) toggleBtn.innerHTML = state.hideBalance ? '<i class="las la-eye-slash"></i>' : '<i class="las la-eye"></i>';
  }

  // 2. Upcoming Cashflow (Income + Expenses)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const upcomingExps = state.expenses.filter(e => {
    if (e.isPaid) return false;
    const due = new Date(e.date);
    return due >= today && due <= nextWeek;
  }).map(e => ({ ...e, type: 'expense' }));

  const upcomingIncomes = state.incomes.filter(i => {
    const d = new Date(i.date);
    return d >= today && d <= nextWeek;
  }).map(i => ({ ...i, type: 'income', name: i.source }));

  const allUpcoming = [...upcomingExps, ...upcomingIncomes].sort((a, b) => new Date(a.date) - new Date(b.date));

  const totalUpcomingExp = upcomingExps.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalUpcomingInc = upcomingIncomes.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalUpcoming = totalUpcomingExp; // Keep this variable for the status indicator

  const upcomingExpAmtEl = document.getElementById('upcomingExpAmt');
  if (upcomingExpAmtEl) upcomingExpAmtEl.textContent = `- ${formatMoney(totalUpcomingExp)}`;

  const upcomingIncAmtEl = document.getElementById('upcomingIncAmt');
  if (upcomingIncAmtEl) upcomingIncAmtEl.textContent = `+ ${formatMoney(totalUpcomingInc)}`;

  const dashUpcomingList = document.getElementById('dashUpcomingList');
  if (dashUpcomingList) {
    dashUpcomingList.innerHTML = '';
    if (allUpcoming.length === 0) {
      dashUpcomingList.innerHTML = '<li style="justify-content:center; padding: 10px; color: var(--text-secondary); font-size: 13px;">No upcoming cashflow</li>';
    } else {
      allUpcoming.slice(0, 3).forEach(item => {
        const isInc = item.type === 'income';
        const dateStr = new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

        dashUpcomingList.innerHTML += `
          <li class="upcoming-item ${item.type}">
            <div class="upcoming-item-left">
              <span class="upcoming-item-name">${escapeHtml(item.name)}</span>
              <span class="upcoming-item-date">${dateStr}</span>
            </div>
            <span class="upcoming-item-amount ${item.type}">${isInc ? '+' : '-'} ${formatMoney(Number(item.amount))}</span>
          </li>
        `;
      });
    }
  }

  // 3. Status Indicator
  const statusEl = document.getElementById('financialStatus');
  if (statusEl) {
    if (balance <= 0 || totalUpcoming > balance) {
      statusEl.textContent = '● Risk';
      statusEl.className = 'status-badge risk';
    } else if (totalUpcoming > balance * 0.5) {
      statusEl.textContent = '● Warning';
      statusEl.className = 'status-badge warning';
    } else {
      statusEl.textContent = '● Safe';
      statusEl.className = 'status-badge safe';
    }
  }

  // 4. Quick Stats (This Month)
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const monthIncomes = state.incomes.filter(i => {
    const d = new Date(i.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((s, i) => s + Number(i.amount), 0);

  const monthExpenses = state.expenses.filter(e => {
    const d = new Date(e.date);
    return e.isPaid && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((s, e) => s + Number(e.amount), 0);

  const monthNet = monthIncomes - monthExpenses;

  const statIncome = document.querySelector('.stat-value.income');
  const statExpense = document.querySelector('.stat-value.expense');
  const statNet = document.querySelector('.stat-row--total .stat-value');

  if (statIncome) statIncome.textContent = `+ ${formatMoney(monthIncomes)}`;
  if (statExpense) statExpense.textContent = `− ${formatMoney(monthExpenses)}`;
  if (statNet) statNet.textContent = `${formatMoney(monthNet)}`;

  // 4b. Dynamic Alert Banner Logic
  const alertBanner = document.getElementById('alertBanner');
  if (alertBanner) {
    const iconSpan = alertBanner.querySelector('.alert-icon');
    const textSpan = alertBanner.querySelectorAll('span')[1];

    if (monthExpenses === 0 && monthIncomes === 0) {
      alertBanner.style.display = 'none';
    } else {
      // Re-show the banner if there's data, unless it was just manually dismissed in this session
      // For now, we'll always show it if the state justifies it
      alertBanner.style.display = 'flex';
      const monthlyBurn = monthExpenses > 0 ? monthExpenses : 1;
      const survivalMonths = Math.max(0, Math.floor(balance / monthlyBurn));

      if (monthNet >= 0) {
        alertBanner.classList.remove('warning');
        alertBanner.classList.add('success');
        iconSpan.innerHTML = '<i class="las la-star"></i>';
        textSpan.textContent = `Good moment! Your income exceeds expenses. Your current balance can sustain you for ${survivalMonths} more months.`;
      } else {
        alertBanner.classList.remove('success');
        alertBanner.classList.add('warning');
        iconSpan.innerHTML = '<i class="las la-exclamation-triangle"></i>';
        textSpan.textContent = `Risk moment! You're spending more than you earn. Your current balance can sustain you for roughly ${survivalMonths} more months.`;
      }
    }
  }

  // 5. Update Last Updated
  const lastUpdEl = document.querySelector('.card--balance .card-sub');
  if (lastUpdEl) {
    const updDate = new Date(state.lastUpdated);
    lastUpdEl.textContent = `Last updated: ${updDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  // 6. Mini Envelopes
  const dashEnvelopesList = document.getElementById('dashEnvelopesList');
  if (dashEnvelopesList) {
    dashEnvelopesList.innerHTML = '';
    state.envelopes.slice(0, 3).forEach(env => {
      const pct = Math.min(100, Math.round((env.current / env.target) * 100));
      dashEnvelopesList.innerHTML += `
        <div class="envelope-mini">
          <div class="env-row">
            <span>${escapeHtml(env.name)}</span>
            <span>${formatMoney(Number(env.current))} / ${formatMoney(Number(env.target))}</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
      `;
    });
  }
}

function renderIncomes() {
  const tbody = document.getElementById('incomeTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const sortedIncomes = [...state.incomes].sort((a, b) => new Date(b.date) - new Date(a.date));

  sortedIncomes.forEach(inc => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${inc.date}</td>
      <td>${escapeHtml(inc.source)}</td>
      <td class="amount-cell income">${formatMoney(Number(inc.amount))}</td>
      <td>${escapeHtml(inc.notes) || '—'}</td>
      <td class="actions-cell">
        <button class="action-btn del-btn" title="Delete" onclick="deleteIncome('${inc.id}')"><i class="las la-trash-alt"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderExpenses() {
  const list = document.getElementById('expenseList');
  if (!list) return;
  list.innerHTML = '';

  const sortedExpenses = [...state.expenses].sort((a, b) => new Date(a.date) - new Date(b.date));

  sortedExpenses.forEach(exp => {
    const dotClass = exp.isPaid ? 'dot-green' : getDotClass(exp.date);
    const catText = exp.category + (exp.recurring ? ' · Recurring' : '');
    const dueDisplay = exp.isPaid ? 'Paid' : `Due ${formatDate(exp.date)}`;

    const div = document.createElement('div');
    div.className = 'expense-item';
    if (exp.isPaid) div.style.opacity = '0.6';

    div.innerHTML = `
      <div class="expense-dot ${dotClass}"></div>
      <div class="expense-info">
        <span class="expense-name" style="${exp.isPaid ? 'text-decoration: line-through;' : ''}">${escapeHtml(exp.name)}</span>
        <span class="expense-cat">${catText}</span>
      </div>
      <div class="expense-right">
        <span class="expense-amount" style="color:${exp.isPaid ? 'var(--text-secondary)' : 'var(--amber)'}">${formatMoney(Number(exp.amount))}</span>
        <span class="expense-due">${dueDisplay}</span>
      </div>
      <div class="actions-cell" style="margin-left: 10px;">
        ${!exp.isPaid ? `<button class="action-btn edit-btn" title="Mark Paid" onclick="markExpensePaid('${exp.id}')"><i class="las la-check-circle"></i></button>` : ''}
        <button class="action-btn del-btn" title="Delete" onclick="deleteExpense('${exp.id}')"><i class="las la-trash-alt"></i></button>
      </div>
    `;
    list.appendChild(div);
  });
}

function renderEnvelopes() {
  const grid = document.getElementById('envelopesGrid');
  if (!grid) return;
  grid.innerHTML = '';

  state.envelopes.forEach(env => {
    const pct = Math.min(100, Math.round((env.current / env.target) * 100));
    const card = document.createElement('div');
    card.className = 'envelope-card';
    let statusHtml = `<div class="envelope-pct">${pct}% funded</div>`;
    let actionButtonsHtml = '';

    if (pct >= 100) {
      if (!env.goalReachedAt) {
        env.goalReachedAt = new Date().toISOString();
      }
      const reachedDate = new Date(env.goalReachedAt);
      const diffTime = new Date() - reachedDate;
      const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const daysLeft = Math.max(0, 7 - daysPassed);

      statusHtml = `<div class="envelope-pct" style="color:var(--green); font-weight: 500;">🎉 Goal Reached! Auto-withdraw in ${daysLeft} day(s)</div>`;
      actionButtonsHtml = `
        <button class="btn btn--sm btn--primary" style="background: var(--green); color: #000;" onclick="withdrawEnvelope('${env.id}')">Withdraw Now</button>
      `;
    } else {
      actionButtonsHtml = `
        <button class="btn btn--sm btn--ghost" onclick="addFundsToEnvelope('${env.id}')">Add Funds</button>
        <button class="btn btn--sm btn--danger" onclick="deleteEnvelope('${env.id}')">Remove</button>
      `;
    }

    card.innerHTML = `
      <div class="envelope-icon">${getIconHtml(env.icon)}</div>
      <div class="envelope-name">${escapeHtml(env.name)}</div>
      <div class="envelope-amounts">
        <span class="env-saved">${formatMoney(Number(env.current))}</span>
        <span class="env-sep">/</span>
        <span class="env-target">${formatMoney(Number(env.target))}</span>
      </div>
      <div class="progress-bar progress-bar--lg">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
      ${statusHtml}
      <div class="envelope-actions">
        ${actionButtonsHtml}
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderProfile() {
  const p = state.userProfile;
  if (!p) return;

  // Top Nav Avatar
  const topNavAvatar = document.getElementById('menuToggle');
  if (topNavAvatar) {
    if (p.image) {
      topNavAvatar.style.backgroundImage = `url(${p.image})`;
      topNavAvatar.style.backgroundSize = 'cover';
      topNavAvatar.style.backgroundPosition = 'center';
      topNavAvatar.textContent = '';
    } else {
      topNavAvatar.style.backgroundImage = '';
      topNavAvatar.textContent = p.nickname ? p.nickname.substring(0, 2).toUpperCase() : 'US';
    }
  }

  // Profile Page Elements
  const profileAvatar = document.getElementById('profileAvatar');
  const profileDisplayName = document.getElementById('profileDisplayName');

  // Greeting
  const greetingTime = document.getElementById('greetingTime');
  const greetingName = document.getElementById('greetingName');
  if (greetingTime && greetingName) {
    const hr = new Date().getHours();
    let timeText = 'Good Evening,';
    if (hr < 12) timeText = 'Good Morning,';
    else if (hr < 18) timeText = 'Good Afternoon,';

    greetingTime.textContent = timeText;
    greetingName.textContent = p.fullName || p.nickname || 'User';
  }

  if (profileAvatar) {
    if (p.image) {
      profileAvatar.style.backgroundImage = `url(${p.image})`;
      profileAvatar.textContent = '';
    } else {
      profileAvatar.style.backgroundImage = '';
      profileAvatar.textContent = p.nickname ? p.nickname.substring(0, 2).toUpperCase() : 'US';
    }
  }

  if (profileDisplayName) {
    profileDisplayName.textContent = p.fullName || 'User Profile';
  }

  // Form Fields
  const ids = ['profileFullName', 'profileNickname', 'profileMobile', 'profileEmail', 'profileGender', 'profileDob', 'profileAddress'];
  const keys = ['fullName', 'nickname', 'mobile', 'email', 'gender', 'dob', 'address'];

  ids.forEach((id, index) => {
    const el = document.getElementById(id);
    if (el) el.value = p[keys[index]] || '';
  });
}

// =============================================
// ACTIONS
// =============================================

function addIncome() {
  const amountEl = document.getElementById('incomeAmount');
  const sourceEl = document.getElementById('incomeSource');
  const dateEl = document.getElementById('incomeDate');
  const notesEl = document.getElementById('incomeNotes');

  const amount = Number(amountEl.value);
  if (!amount || !sourceEl.value || !dateEl.value) {
    showToast('Please fill in Amount, Source, and Date.', 'warning');
    return;
  }

  state.incomes.push({
    id: generateId(),
    amount: amount,
    source: sourceEl.value,
    date: dateEl.value,
    notes: notesEl.value
  });

  amountEl.value = ''; sourceEl.value = ''; dateEl.value = ''; notesEl.value = '';
  saveState();
  showToast('Income logged successfully.', 'success');
}

function deleteIncome(id) {
  if (confirm('Delete this income?')) {
    state.incomes = state.incomes.filter(i => i.id !== id);
    saveState();
    showToast('Income deleted.', 'info');
  }
}

function addExpense() {
  const nameEl = document.getElementById('expenseName');
  const amountEl = document.getElementById('expenseAmount');
  const dueEl = document.getElementById('expenseDue');
  const catEl = document.getElementById('expenseCategory');
  const recEl = document.getElementById('isRecurring');

  const amount = Number(amountEl.value);
  if (!nameEl.value || !amount || !dueEl.value) {
    showToast('Please fill in Name, Amount, and Due Date.', 'warning');
    return;
  }

  state.expenses.push({
    id: generateId(),
    name: nameEl.value,
    amount: amount,
    date: dueEl.value,
    category: catEl.value,
    recurring: recEl.checked,
    isPaid: false
  });

  nameEl.value = ''; amountEl.value = ''; dueEl.value = ''; recEl.checked = false;
  saveState();
  showToast('Expense added.', 'success');
}

function markExpensePaid(id) {
  const exp = state.expenses.find(e => e.id === id);
  if (exp) {
    exp.isPaid = true;
    saveState();
    showToast(`${exp.name} marked as paid!`, 'success');
  }
}

function deleteExpense(id) {
  if (confirm('Delete this expense?')) {
    state.expenses = state.expenses.filter(e => e.id !== id);
    saveState();
    showToast('Expense deleted.', 'info');
  }
}

function createEnvelope() {
  const nameEl = document.getElementById('envName');
  const targetEl = document.getElementById('envTarget');
  const initialEl = document.getElementById('envInitial');
  const iconEl = document.getElementById('envIcon');

  const target = Number(targetEl.value);
  if (!nameEl.value || !target) {
    showToast('Please provide a name and target amount.', 'warning');
    return;
  }

  state.envelopes.push({
    id: generateId(),
    name: nameEl.value,
    target: target,
    current: Number(initialEl.value) || 0,
    icon: iconEl.value
  });

  closeEnvelopeModal();
  saveState();
  showToast(`"${nameEl.value}" envelope created!`, 'success');
}

function addFundsToEnvelope(id) {
  const env = state.envelopes.find(e => e.id === id);
  if (!env) return;

  const amount = prompt(`How much to add to ${env.name} ($)?`);
  if (!amount || isNaN(amount) || Number(amount) <= 0) return;

  env.current += Number(amount);

  if (env.current >= env.target && !env.goalReachedAt) {
    env.goalReachedAt = new Date().toISOString();
  }

  saveState();

  if (env.current >= env.target) {
    showToast('🎉 Savings goal reached! Withdrawal button activated.', 'success');
  } else {
    showToast(`Added ${formatMoney(amount)} to envelope.`, 'success');
  }
}

function withdrawEnvelope(id) {
  const env = state.envelopes.find(e => e.id === id);
  if (!env) return;

  const amount = env.current;
  if (amount <= 0) return;

  const today = new Date().toISOString().split('T')[0];

  state.incomes.push({
    id: generateId(),
    amount: amount,
    source: 'Savings Goal Withdrawn: ' + env.name,
    date: today,
    notes: 'Automatically incremented to balance'
  });

  state.envelopes = state.envelopes.filter(e => e.id !== id);

  saveState();
  showToast(`${formatMoney(amount)} withdrawn to balance!`, 'success');
}

function checkAutoWithdrawals() {
  if (!state.envelopes) return;
  let changed = false;

  state.envelopes.forEach(env => {
    if (env.current >= env.target && env.goalReachedAt) {
      const reachedDate = new Date(env.goalReachedAt);
      const diffTime = new Date() - reachedDate;
      const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (daysPassed >= 7) {
        const today = new Date().toISOString().split('T')[0];
        state.incomes.push({
          id: generateId(),
          amount: env.current,
          source: 'Auto-Withdrawn Savings: ' + env.name,
          date: today,
          notes: 'Goal reached 7 days ago'
        });
        env.toDelete = true;
        changed = true;
      }
    }
  });

  if (changed) {
    state.envelopes = state.envelopes.filter(e => !e.toDelete);
    // Only saveState and re-render if something actually changed to avoid infinite loops,
    // but wait, checkAutoWithdrawals is called IN renderApp(). 
    // This could cause an infinite loop if we call saveState() which calls renderApp().
    // We should NOT call saveState() here. We should just let the state update and renderApp will naturally pick it up.
    // However, localStorage won't be updated until the next manual saveState().
    // So we manually update localStorage here.
    state.lastUpdated = new Date().toISOString();
    localStorage.setItem('flowfund_state', JSON.stringify(state));
    showToast('Some savings goals were automatically withdrawn to your balance!', 'success');
  }
}

function deleteEnvelope(id) {
  if (confirm('Delete this envelope?')) {
    state.envelopes = state.envelopes.filter(e => e.id !== id);
    saveState();
    showToast('Envelope deleted.', 'info');
  }
}

// Modal logic
function openEnvelopeModal() { document.getElementById('envelopeModal').classList.add('open'); }
function closeEnvelopeModal() { document.getElementById('envelopeModal').classList.remove('open'); }

function dismissAlert(btn) {
  const card = btn.closest('.alert-card');
  card.style.opacity = '0';
  setTimeout(() => card.remove(), 200);
}

function saveProfile() {
  if (!state.userProfile) state.userProfile = {};

  state.userProfile.fullName = document.getElementById('profileFullName').value.trim();
  state.userProfile.nickname = document.getElementById('profileNickname').value.trim();
  state.userProfile.mobile = document.getElementById('profileMobile').value.trim();
  state.userProfile.email = document.getElementById('profileEmail').value.trim();
  state.userProfile.gender = document.getElementById('profileGender').value;
  state.userProfile.dob = document.getElementById('profileDob').value;
  state.userProfile.address = document.getElementById('profileAddress').value.trim();

  saveState();
  showToast('Profile updated successfully!', 'success');
}

function handleLogout() {
  if (confirm('Are you sure you want to log out?')) {
    if (state.userProfile) {
      state.userProfile.email = '';
      state.userProfile.password = '';
      saveState();
    }
    window.location.href = 'auth.html';
  }
}

// =============================================
// CHARTS
// =============================================

function getPastWeeksData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const data = [];

  // Create 6 week buckets
  for (let i = 5; i >= 0; i--) {
    let weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (i * 7) - today.getDay());
    let weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    let incSum = state.incomes.filter(inc => {
      let d = new Date(inc.date);
      return d >= weekStart && d <= weekEnd;
    }).reduce((sum, inc) => sum + Number(inc.amount), 0);

    let expSum = state.expenses.filter(exp => {
      let d = new Date(exp.date);
      return exp.isPaid && d >= weekStart && d <= weekEnd;
    }).reduce((sum, exp) => sum + Number(exp.amount), 0);

    data.push({ label: `Wk ${6 - i}`, income: incSum, expense: expSum });
  }
  return data;
}

function drawDashChart() {
  const canvas = document.getElementById('dashChart');
  if (!canvas || !canvas.offsetParent) return; // not visible

  const ctx = canvas.getContext('2d');
  const W = canvas.parentElement.offsetWidth || 600;
  const H = 200;
  canvas.width = W; canvas.height = H;

  const weekData = getPastWeeksData();
  const labels = weekData.map(d => d.label);
  const income = weekData.map(d => d.income);
  const expenses = weekData.map(d => d.expense);

  // If all 0, provide dummy max
  let maxVal = Math.max(...income, ...expenses) * 1.15;
  if (maxVal === 0) maxVal = 100000;

  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;
  const barWidth = chartW / labels.length;

  ctx.clearRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(W - padding.right, y); ctx.stroke();
  }

  ctx.fillStyle = '#6B7280';
  ctx.font = '11px DM Sans, sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const val = maxVal - (maxVal / 4) * i;
    const y = padding.top + (chartH / 4) * i;
    ctx.fillText((val / 1000).toFixed(0) + 'k', padding.left - 8, y + 4);
  }

  labels.forEach((label, i) => {
    const x = padding.left + i * barWidth;
    const groupW = barWidth * 0.7;
    const bW = groupW / 2 - 2;
    const startX = x + (barWidth - groupW) / 2;

    const incomeH = (income[i] / maxVal) * chartH;
    ctx.fillStyle = 'rgba(167, 139, 250, 0.8)';
    roundRect(ctx, startX, padding.top + chartH - incomeH, bW, incomeH, 3);

    const expH = (expenses[i] / maxVal) * chartH;
    ctx.fillStyle = 'rgba(248, 113, 113, 0.7)';
    roundRect(ctx, startX + bW + 3, padding.top + chartH - expH, bW, expH, 3);

    ctx.fillStyle = '#6B7280';
    ctx.font = '11px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + barWidth / 2, H - padding.bottom + 16);
  });
}

function drawWeeklyChart() {
  const canvas = document.getElementById('weeklyChart');
  if (!canvas || !canvas.offsetParent) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.parentElement.offsetWidth || 600;
  const H = 200;
  canvas.width = W; canvas.height = H;

  // Real data for current week
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); // 0 is Sunday
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Mon as start

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const income = [0, 0, 0, 0, 0, 0, 0];
  const expenses = [0, 0, 0, 0, 0, 0, 0];

  state.incomes.forEach(inc => {
    let d = new Date(inc.date);
    if (d >= startOfWeek && d < new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      let idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      income[idx] += Number(inc.amount);
    }
  });

  state.expenses.forEach(exp => {
    if (!exp.isPaid) return;
    let d = new Date(exp.date);
    if (d >= startOfWeek && d < new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      let idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      expenses[idx] += Number(exp.amount);
    }
  });

  let maxVal = Math.max(...income, ...expenses) * 1.15;
  if (maxVal === 0) maxVal = 100000;

  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;
  const barWidth = chartW / labels.length;

  ctx.clearRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(W - padding.right, y); ctx.stroke();
  }

  ctx.fillStyle = '#6B7280';
  ctx.font = '11px DM Sans, sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const val = maxVal - (maxVal / 4) * i;
    const y = padding.top + (chartH / 4) * i;
    ctx.fillText((val / 1000).toFixed(0) + 'k', padding.left - 8, y + 4);
  }

  labels.forEach((label, i) => {
    const x = padding.left + i * barWidth;
    const groupW = barWidth * 0.72;
    const bW = groupW / 2 - 2;
    const startX = x + (barWidth - groupW) / 2;

    if (income[i] > 0) {
      const h = (income[i] / maxVal) * chartH;
      ctx.fillStyle = 'rgba(167, 139, 250, 0.8)';
      roundRect(ctx, startX, padding.top + chartH - h, bW, h, 3);
    }

    if (expenses[i] > 0) {
      const h = (expenses[i] / maxVal) * chartH;
      ctx.fillStyle = 'rgba(248, 113, 113, 0.7)';
      roundRect(ctx, startX + bW + 3, padding.top + chartH - h, bW, h, 3);
    }

    ctx.fillStyle = '#6B7280';
    ctx.font = '11px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + barWidth / 2, H - padding.bottom + 16);
  });
}

function roundRect(ctx, x, y, w, h, r) {
  if (h <= 0) return;
  r = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function getDotClass(dateStr) {
  const today = new Date();
  const due = new Date(dateStr);
  const diff = (due - today) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'dot-red';
  if (diff <= 3) return 'dot-red';
  if (diff <= 7) return 'dot-amber';
  return 'dot-green';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  const el = document.createElement('div');
  el.appendChild(document.createTextNode(str));
  return el.innerHTML;
}

// =============================================
// TOAST NOTIFICATIONS
// =============================================

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const colors = {
    success: 'var(--green)',
    warning: 'var(--amber)',
    error: 'var(--red)',
    info: 'var(--accent)'
  };

  const icons = {
    success: '✓',
    warning: '⚠',
    error: '✕',
    info: 'ℹ'
  };

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 90px;
    right: 24px;
    background: var(--bg-card);
    border: 1px solid ${colors[type]};
    border-left: 3px solid ${colors[type]};
    color: var(--text-primary);
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 9999;
    max-width: 320px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    animation: slideInToast 0.25s ease;
  `;

  toast.innerHTML = `
    <span style="color:${colors[type]};font-weight:700;">${getIconHtml(type)}</span>
    <span>${message}</span>
  `;

  if (!document.getElementById('toastStyle')) {
    const style = document.createElement('style');
    style.id = 'toastStyle';
    style.textContent = `
      @keyframes slideInToast {
        from { transform: translateY(10px); opacity: 0; }
        to   { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// =============================================
// INIT
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Load data
  loadState();

  // 2. Initialize settings fields (moved from redundant listener)
  const themeSelect = document.getElementById('settingTheme');
  const currencySelect = document.getElementById('settingCurrency');
  if (themeSelect) themeSelect.value = state.settings?.theme || 'dark';
  if (currencySelect) currencySelect.value = state.settings?.currency || '$';

  // 3. Set default dates
  const today = new Date().toISOString().split('T')[0];
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(inp => { if (!inp.value) inp.value = today; });

  // 4. Modal listeners
  const envModal = document.getElementById('envelopeModal');
  if (envModal) {
    envModal.addEventListener('click', (e) => {
      if (e.target === envModal) closeEnvelopeModal();
    });
  }

  // 5. Toggle Balance
  const toggleBtn = document.getElementById('toggleBalanceBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      state.hideBalance = !state.hideBalance;
      saveState();
    });
  }

  // Profile Image Upload Listener
  const profileImageInput = document.getElementById('profileImageInput');
  if (profileImageInput) {
    profileImageInput.addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (event) {
        if (!state.userProfile) state.userProfile = {};
        state.userProfile.image = event.target.result; // Base64 string
        saveState();
        showToast('Profile image updated!', 'success');
      };
      reader.readAsDataURL(file);
    });
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderCharts, 150);
  });

  // 7. Initial Render
  renderApp();

  // 8. Route Protection
  if (!state.userProfile || !state.userProfile.email) {
    window.location.href = 'auth.html';
    return;
  }
});

function renderCharts() {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  if (activePage.id === 'page-home') drawDashChart();
  if (activePage.id === 'page-summary') drawWeeklyChart();
}

function renderSummary() {
  const summaryTotalIncome = document.getElementById('summaryTotalIncome');
  const summaryTotalExpense = document.getElementById('summaryTotalExpense');
  const summaryNetBalance = document.getElementById('summaryNetBalance');
  const summaryIncomeTrend = document.getElementById('summaryIncomeTrend');
  const summaryExpenseTrend = document.getElementById('summaryExpenseTrend');
  const summaryNetTrend = document.getElementById('summaryNetTrend');
  const summaryInsightsList = document.getElementById('summaryInsightsList');

  if (!summaryTotalIncome) return;

  // 1. Calculate overall totals
  const totalIncome = state.incomes.reduce((sum, inc) => sum + Number(inc.amount), 0);
  const paidExpenses = state.expenses.filter(e => e.isPaid).reduce((sum, exp) => sum + Number(exp.amount), 0);
  const netBalance = totalIncome - paidExpenses;

  summaryTotalIncome.textContent = `${formatMoney(totalIncome)}`;
  summaryTotalExpense.textContent = `${formatMoney(paidExpenses)}`;
  summaryNetBalance.textContent = `${formatMoney(netBalance)}`;

  // 2. Trend Calculations (Last 7 days vs Previous 7 days)
  const now = new Date();
  const last7DaysStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prev7DaysStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  let incLast7 = 0, incPrev7 = 0;
  state.incomes.forEach(i => {
    const d = new Date(i.date);
    if (d >= last7DaysStart) incLast7 += Number(i.amount);
    else if (d >= prev7DaysStart) incPrev7 += Number(i.amount);
  });

  let expLast7 = 0, expPrev7 = 0;
  state.expenses.forEach(e => {
    if (!e.isPaid) return;
    const d = new Date(e.date);
    if (d >= last7DaysStart) expLast7 += Number(e.amount);
    else if (d >= prev7DaysStart) expPrev7 += Number(e.amount);
  });

  const getTrendText = (curr, prev, isInverted = false) => {
    if (prev === 0) return { text: curr > 0 ? '↑ 100% vs last week' : '→ No change', class: curr > 0 ? (isInverted ? 'trend-down' : 'trend-up') : '' };
    const pct = Math.round(((curr - prev) / prev) * 100);
    if (pct > 0) return { text: `↑ ${pct}% vs last week`, class: isInverted ? 'trend-down' : 'trend-up' };
    if (pct < 0) return { text: `↓ ${Math.abs(pct)}% vs last week`, class: isInverted ? 'trend-up' : 'trend-down' };
    return { text: '→ 0% vs last week', class: '' };
  };

  const incTrend = getTrendText(incLast7, incPrev7);
  if (summaryIncomeTrend) {
    summaryIncomeTrend.textContent = incTrend.text;
    summaryIncomeTrend.className = `card-sub ${incTrend.class}`;
  }

  const expTrend = getTrendText(expLast7, expPrev7, true);
  if (summaryExpenseTrend) {
    summaryExpenseTrend.textContent = expTrend.text;
    summaryExpenseTrend.className = `card-sub ${expTrend.class}`;
  }

  if (summaryNetTrend) {
    if (netBalance > 0) {
      summaryNetTrend.textContent = '↑ Good standing';
      summaryNetTrend.className = 'card-sub trend-up';
    } else if (netBalance < 0) {
      summaryNetTrend.textContent = '↓ Negative standing';
      summaryNetTrend.className = 'card-sub trend-down';
    } else {
      summaryNetTrend.textContent = '→ Break even';
      summaryNetTrend.className = 'card-sub';
    }
  }

  // 3. AI Insights
  let insightsHtml = '';

  if (incLast7 > expLast7) {
    insightsHtml += `
      <li class="insight-item insight-good">
        <span class="insight-icon"><i class="las la-star"></i></span>
        You saved ${formatMoney(incLast7 - expLast7)} this week! Great job keeping expenses below income.
      </li>`;
  } else if (expLast7 > incLast7 && incLast7 > 0) {
    insightsHtml += `
      <li class="insight-item insight-warn">
        <span class="insight-icon"><i class="las la-exclamation-triangle"></i></span>
        You spent more than you earned this week. Consider reviewing your recent expenses.
      </li>`;
  }

  const categories = {};
  state.expenses.filter(e => e.isPaid).forEach(e => {
    categories[e.category] = (categories[e.category] || 0) + Number(e.amount);
  });
  let highestCat = '', highestAmt = 0;
  for (let c in categories) {
    if (categories[c] > highestAmt) { highestAmt = categories[c]; highestCat = c; }
  }
  if (highestCat && paidExpenses > 0) {
    const pct = Math.round((highestAmt / paidExpenses) * 100);
    insightsHtml += `
      <li class="insight-item insight-neutral">
        <span class="insight-icon"><i class="las la-chart-bar"></i></span>
        <strong>${highestCat}</strong> is your top expense category, representing ${pct}% of your total spending.
      </li>`;
  }

  const totalSaved = state.envelopes.reduce((sum, env) => sum + Number(env.current), 0);
  const totalTarget = state.envelopes.reduce((sum, env) => sum + Number(env.target), 0);
  if (totalTarget > 0) {
    const savedPct = Math.round((totalSaved / totalTarget) * 100);
    insightsHtml += `
      <li class="insight-item insight-good">
        <span class="insight-icon"><i class="las la-check-circle"></i></span>
        You are ${savedPct}% toward your total savings goals across all envelopes.
      </li>`;
  }

  if (!insightsHtml) {
    insightsHtml = `
      <li class="insight-item insight-neutral">
        <span class="insight-icon"><i c lass="las la-info-circle"></i></span>
        Log more incomes and expenses to get personalized AI insights!
      </li>`;
  }

  if (summaryInsightsList) {
    summaryInsightsList.innerHTML = insightsHtml;
  }
}

// =============================================
// SETTINGS
// =============================================

function updateSettings() {
  const themeSelect = document.getElementById('settingTheme');
  const currencySelect = document.getElementById('settingCurrency');

  if (themeSelect && currencySelect) {
    state.settings.theme = themeSelect.value;
    state.settings.currency = currencySelect.value;
    saveState();
    applyTheme();
    renderApp();
  }
}

// Initialization completed in unified DOMContentLoaded listener
