function isAdminLoggedIn() {
  return sessionStorage.getItem('adminLoggedIn') === 'true';
}

function requireAdmin(onSuccess) {
  const loginSection = document.getElementById('login-section');
  const reportsSection = document.getElementById('reports-section');

  if (isAdminLoggedIn()) {
    loginSection.hidden = true;
    reportsSection.hidden = false;
    onSuccess();
    return;
  }

  loginSection.hidden = false;
  reportsSection.hidden = true;

  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    const settings = getSettings();

    if (password === settings.adminPassword) {
      sessionStorage.setItem('adminLoggedIn', 'true');
      loginSection.hidden = true;
      reportsSection.hidden = false;
      onSuccess();
    } else {
      document.getElementById('login-error').textContent = 'Incorrect password.';
    }
  });
}

function populateMonthYearFilters() {
  const monthSelect = document.getElementById('report-month');
  const yearSelect = document.getElementById('report-year');
  const now = new Date();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  monthSelect.innerHTML = months
    .map((name, i) => `<option value="${i}" ${i === now.getMonth() ? 'selected' : ''}>${name}</option>`)
    .join('');

  const orders = getOrders();
  const years = new Set([now.getFullYear()]);
  orders.forEach((o) => years.add(new Date(o.date).getFullYear()));

  yearSelect.innerHTML = [...years]
    .sort((a, b) => b - a)
    .map((y) => `<option value="${y}" ${y === now.getFullYear() ? 'selected' : ''}>${y}</option>`)
    .join('');
}

function filterOrdersByMonth(month, year) {
  return getOrders().filter((order) => {
    if (order.status !== 'paid') return false;
    const d = new Date(order.date);
    return d.getMonth() === parseInt(month, 10) && d.getFullYear() === parseInt(year, 10);
  });
}

function getTopSellingItem(orders) {
  const counts = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      counts[item.name] = (counts[item.name] || 0) + item.qty;
    });
  });

  let top = '—';
  let max = 0;
  Object.entries(counts).forEach(([name, qty]) => {
    if (qty > max) {
      max = qty;
      top = name;
    }
  });
  return top;
}

function renderReport() {
  const month = document.getElementById('report-month').value;
  const year = document.getElementById('report-year').value;
  const orders = filterOrdersByMonth(month, year);

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const orderCount = orders.length;
  const topItem = getTopSellingItem(orders);

  document.getElementById('stat-sales').textContent = formatCurrency(totalSales);
  document.getElementById('stat-orders').textContent = orderCount;
  document.getElementById('stat-top-item').textContent = topItem;

  const tbody = document.getElementById('report-table-body');
  tbody.innerHTML = '';

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">No paid orders for this month.</td></tr>';
    return;
  }

  orders
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((order) => {
      const itemsSummary = order.items.map((i) => `${i.name} ×${i.qty}`).join(', ');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(order.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
        <td>${order.id}</td>
        <td>${itemsSummary}</td>
        <td>${formatCurrency(order.total)}</td>
      `;
      tbody.appendChild(tr);
    });
}

function exportCsv() {
  const month = document.getElementById('report-month').value;
  const year = document.getElementById('report-year').value;
  const orders = filterOrdersByMonth(month, year);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const header = 'Date,Order ID,Items,Total\n';
  const rows = orders
    .map((order) => {
      const date = new Date(order.date).toLocaleString('en-IN');
      const items = order.items.map((i) => `${i.name} x${i.qty}`).join('; ');
      return `"${date}","${order.id}","${items}",${order.total}`;
    })
    .join('\n');

  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sales-${months[month]}-${year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function initReportsPage() {
  requireAdmin(() => {
    populateMonthYearFilters();
    renderReport();
  });

  document.getElementById('report-month').addEventListener('change', renderReport);
  document.getElementById('report-year').addEventListener('change', renderReport);
  document.getElementById('export-csv-btn').addEventListener('click', exportCsv);

  document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('adminLoggedIn');
    window.location.reload();
  });
}

document.addEventListener('DOMContentLoaded', initReportsPage);
