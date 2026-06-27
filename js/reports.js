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

function getReportData() {
  const month = document.getElementById('report-month').value;
  const year = document.getElementById('report-year').value;
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const orders = filterOrdersByMonth(month, year);
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const orderCount = orders.length;
  const topItem = getTopSellingItem(orders);
  const settings = getSettings();

  return {
    month,
    year,
    monthName: months[month],
    orders,
    totalSales,
    orderCount,
    topItem,
    restaurantName: settings.restaurantName,
  };
}

function renderReport() {
  const data = getReportData();

  document.getElementById('stat-sales').textContent = formatCurrency(data.totalSales);
  document.getElementById('stat-orders').textContent = data.orderCount;
  document.getElementById('stat-top-item').textContent = data.topItem;

  const tbody = document.getElementById('report-table-body');
  tbody.innerHTML = '';

  if (data.orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">No paid orders for this month.</td></tr>';
    return;
  }

  data.orders
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
  const data = getReportData();

  const header = 'Date,Order ID,Items,Total\n';
  const rows = data.orders
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
  a.download = `sales-${data.monthName}-${data.year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPdf() {
  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    alert('PDF library not loaded.');
    return;
  }

  const data = getReportData();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFontSize(18);
  doc.text(data.restaurantName, 14, 18);
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Sales Report — ${data.monthName} ${data.year}`, 14, 26);
  doc.setTextColor(0);

  doc.setFontSize(10);
  doc.text(`Total Sales: ${formatCurrency(data.totalSales)}`, 14, 36);
  doc.text(`Orders: ${data.orderCount}`, 14, 42);
  doc.text(`Top Item: ${data.topItem}`, 14, 48);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 54);

  const tableBody = data.orders
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((order) => [
      new Date(order.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      order.id,
      order.items.map((i) => `${i.name} x${i.qty}`).join(', '),
      formatCurrency(order.total),
    ]);

  if (tableBody.length === 0) {
    doc.setFontSize(11);
    doc.text('No paid orders for this month.', 14, 64);
  } else {
    doc.autoTable({
      startY: 60,
      head: [['Date', 'Order ID', 'Items', 'Total']],
      body: tableBody,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [249, 115, 22] },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 28 },
        2: { cellWidth: 80 },
        3: { cellWidth: 22, halign: 'right' },
      },
    });
  }

  doc.save(`sales-${data.monthName}-${data.year}.pdf`);
}

function initReportsPage() {
  requireAdmin(() => {
    populateMonthYearFilters();
    renderReport();
  });

  document.getElementById('report-month').addEventListener('change', renderReport);
  document.getElementById('report-year').addEventListener('change', renderReport);
  document.getElementById('export-csv-btn').addEventListener('click', exportCsv);
  document.getElementById('export-pdf-btn').addEventListener('click', exportPdf);

  document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('adminLoggedIn');
    window.location.reload();
  });
}

document.addEventListener('DOMContentLoaded', initReportsPage);
