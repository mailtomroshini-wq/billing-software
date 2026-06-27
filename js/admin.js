function isAdminLoggedIn() {
  return sessionStorage.getItem('adminLoggedIn') === 'true';
}

function requireAdmin(onSuccess) {
  const loginSection = document.getElementById('login-section');
  const adminSection = document.getElementById('admin-section');

  if (isAdminLoggedIn()) {
    loginSection.hidden = true;
    adminSection.hidden = false;
    onSuccess();
    return;
  }

  loginSection.hidden = false;
  adminSection.hidden = true;

  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    const settings = getSettings();

    if (password === settings.adminPassword) {
      sessionStorage.setItem('adminLoggedIn', 'true');
      loginSection.hidden = true;
      adminSection.hidden = false;
      onSuccess();
    } else {
      document.getElementById('login-error').textContent = 'Incorrect password.';
    }
  });
}

function renderMenuTable() {
  const tbody = document.getElementById('menu-table-body');
  const menu = getMenu();
  tbody.innerHTML = '';

  menu.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${menuImageUrl(item.image)}" alt="${item.name}" class="table-thumb" onerror="this.src='images/placeholder.svg'"></td>
      <td>${item.name}</td>
      <td><span class="badge category">${item.category || 'Other'}</span></td>
      <td>${formatCurrency(item.price)}</td>
      <td>${item.active ? '<span class="badge active">Active</span>' : '<span class="badge inactive">Hidden</span>'}</td>
      <td class="table-actions">
        <button type="button" class="btn btn-sm btn-secondary edit-btn" data-id="${item.id}">Edit</button>
        <button type="button" class="btn btn-sm btn-danger delete-btn" data-id="${item.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });

  tbody.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => deleteMenuItem(btn.dataset.id));
  });
}

function openEditModal(id) {
  const menu = getMenu();
  const item = menu.find((m) => m.id === id);
  if (!item) return;

  document.getElementById('edit-id').value = item.id;
  document.getElementById('edit-name').value = item.name;
  document.getElementById('edit-price').value = item.price;
  document.getElementById('edit-category').value = item.category || 'Breakfast';
  document.getElementById('edit-active').checked = item.active;
  document.getElementById('edit-preview').src = menuImageUrl(item.image);
  document.getElementById('edit-image').value = '';

  document.getElementById('edit-modal').classList.add('open');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.remove('open');
}

function deleteMenuItem(id) {
  if (!confirm('Delete this menu item?')) return;
  const menu = getMenu().filter((m) => m.id !== id);
  saveMenu(menu);
  renderMenuTable();
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error('Image must be under 2 MB'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function initAdminPage() {
  requireAdmin(() => {
    renderMenuTable();
    loadSettingsForm();
  });

  document.getElementById('add-item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('add-name').value.trim();
    const price = parseFloat(document.getElementById('add-price').value);
    const category = document.getElementById('add-category').value;
    const file = document.getElementById('add-image').files[0];
    const errorEl = document.getElementById('add-error');

    try {
      let image = 'images/placeholder.svg';
      if (file) {
        image = await readImageFile(file);
      }

      const menu = getMenu();
      menu.push({
        id: generateMenuId(),
        name,
        price,
        category,
        image,
        active: true,
      });
      saveMenu(menu);
      renderMenuTable();
      e.target.reset();
      errorEl.textContent = '';
      showAdminToast('Item added successfully.');
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });

  document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('edit-name').value.trim();
    const price = parseFloat(document.getElementById('edit-price').value);
    const category = document.getElementById('edit-category').value;
    const active = document.getElementById('edit-active').checked;
    const file = document.getElementById('edit-image').files[0];

    try {
      const menu = getMenu();
      const item = menu.find((m) => m.id === id);
      if (!item) return;

      item.name = name;
      item.price = price;
      item.category = category;
      item.active = active;

      if (file) {
        item.image = await readImageFile(file);
      }

      saveMenu(menu);
      renderMenuTable();
      closeEditModal();
      showAdminToast('Item updated. Click "Publish to Vercel" to update live site.');
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('close-edit-modal').addEventListener('click', closeEditModal);
  document.getElementById('edit-modal').addEventListener('click', (e) => {
    if (e.target.id === 'edit-modal') closeEditModal();
  });

  document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const settings = getSettings();
    settings.restaurantName = document.getElementById('setting-name').value.trim();
    settings.upiId = document.getElementById('setting-upi').value.trim();
    settings.upiPayeeName = document.getElementById('setting-payee').value.trim();

    const newPassword = document.getElementById('setting-password').value;
    if (newPassword) {
      settings.adminPassword = newPassword;
    }

    saveSettings(settings);
    showAdminToast('Settings saved. Publish to Vercel to update live site.');
  });

  document.getElementById('publish-btn').addEventListener('click', async () => {
    try {
      const version = await exportDeployZip();
      showAdminToast(`Deploy ZIP downloaded (v${version}). Extract → push to GitHub.`);
    } catch (err) {
      alert(err.message || 'Could not create deploy package.');
    }
  });

  document.getElementById('export-btn').addEventListener('click', () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restaurant-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });

  document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        importAllData(data);
        renderMenuTable();
        loadSettingsForm();
        showAdminToast('Data imported successfully.');
      } catch {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('adminLoggedIn');
    window.location.reload();
  });
}

function loadSettingsForm() {
  const settings = getSettings();
  document.getElementById('setting-name').value = settings.restaurantName;
  document.getElementById('setting-upi').value = settings.upiId;
  document.getElementById('setting-payee').value = settings.upiPayeeName;
}

function showAdminToast(message) {
  const toast = document.getElementById('admin-toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

document.addEventListener('DOMContentLoaded', initAdminPage);
