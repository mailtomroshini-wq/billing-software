const STORAGE_KEYS = {
  menu: 'restaurant_menu',
  orders: 'restaurant_orders',
  settings: 'restaurant_settings',
  menuVersion: 'restaurant_menu_version',
};

const MENU_VERSION = 6;

const DEFAULT_SETTINGS = {
  restaurantName: 'South Spice Restaurant',
  upiId: 'restaurant@paytm',
  upiPayeeName: 'South Spice Restaurant',
  adminPassword: 'admin123',
};

const DEFAULT_MENU = [
  { id: '1', name: 'Idly', price: 40, image: 'images/idly.jpg', category: 'Breakfast', active: true },
  { id: '2', name: 'Puttu', price: 50, image: 'images/puttu.jpg', category: 'Breakfast', active: true },
  { id: '3', name: 'Poori', price: 45, image: 'images/poori.jpg', category: 'Breakfast', active: true },
  { id: '4', name: 'Coffee', price: 20, image: 'images/coffee.jpg', category: 'Beverages', active: true },
  { id: '5', name: 'Dosai', price: 60, image: 'images/dosai.jpg', category: 'Breakfast', active: true },
  { id: '6', name: 'Vada', price: 35, image: 'images/vada.jpg', category: 'Breakfast', active: true },
  { id: '7', name: 'Pazhampori', price: 30, image: 'images/pazhampori.jpg', category: 'Snacks', active: true },
  { id: '8', name: 'Pongal', price: 55, image: 'images/pongal.jpg', category: 'Breakfast', active: true },
  { id: '9', name: 'Upma', price: 45, image: 'images/upma.jpg', category: 'Breakfast', active: true },
  { id: '10', name: 'Masala Dosa', price: 75, image: 'images/masala-dosa.jpg', category: 'Breakfast', active: true },
  { id: '11', name: 'Parotta', price: 50, image: 'images/parotta.jpg', category: 'Breakfast', active: true },
  { id: '12', name: 'Chappathi', price: 40, image: 'images/chappathi.jpg', category: 'Breakfast', active: true },
  { id: '13', name: 'Lemon Rice', price: 55, image: 'images/lemon-rice.jpg', category: 'Rice', active: true },
  { id: '14', name: 'Sambar Rice', price: 65, image: 'images/sambar-rice.jpg', category: 'Rice', active: true },
  { id: '15', name: 'Biryani', price: 120, image: 'images/biryani.jpg', category: 'Rice', active: true },
  { id: '16', name: 'Kesari', price: 35, image: 'images/kesari.jpg', category: 'Snacks', active: true },
  { id: '17', name: 'Tea', price: 15, image: 'images/tea.jpg', category: 'Beverages', active: true },
  { id: '18', name: 'Samosa', price: 25, image: 'images/samosa.jpg', category: 'Snacks', active: true },
  { id: '19', name: 'Filter Coffee', price: 25, image: 'images/filter-coffee.jpg', category: 'Beverages', active: true },
  { id: '20', name: 'Meals', price: 90, image: 'images/meals.jpg', category: 'Rice', active: true },
];

const MENU_CATEGORIES = ['Breakfast', 'Rice', 'Snacks', 'Beverages'];

function mergeDefaultMenu() {
  const storedVersion = parseInt(localStorage.getItem(STORAGE_KEYS.menuVersion) || '0', 10);

  const existing = localStorage.getItem(STORAGE_KEYS.menu)
    ? JSON.parse(localStorage.getItem(STORAGE_KEYS.menu))
    : [];

  if (!existing.length) {
    localStorage.setItem(STORAGE_KEYS.menu, JSON.stringify(DEFAULT_MENU));
    localStorage.setItem(STORAGE_KEYS.menuVersion, String(MENU_VERSION));
    return;
  }

  if (storedVersion >= MENU_VERSION) {
    return;
  }

  const byId = new Map(existing.map((item) => [item.id, item]));
  const byName = new Map(existing.map((item) => [item.name.toLowerCase(), item]));

  DEFAULT_MENU.forEach((defaultItem) => {
    const match = byId.get(defaultItem.id) || byName.get(defaultItem.name.toLowerCase());
    if (match) {
      if (!match.category) match.category = defaultItem.category;
      const usesBundledImage =
        !match.image ||
        match.image.endsWith('.svg') ||
        (match.image.startsWith('images/') && !match.image.startsWith('data:'));
      if (usesBundledImage || storedVersion < MENU_VERSION) {
        match.image = defaultItem.image;
      }
    } else {
      existing.push({ ...defaultItem });
    }
  });

  localStorage.setItem(STORAGE_KEYS.menu, JSON.stringify(existing));
  localStorage.setItem(STORAGE_KEYS.menuVersion, String(MENU_VERSION));
}

function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.menu)) {
    localStorage.setItem(STORAGE_KEYS.menu, JSON.stringify(DEFAULT_MENU));
    localStorage.setItem(STORAGE_KEYS.menuVersion, String(MENU_VERSION));
  } else {
    mergeDefaultMenu();
  }
  if (!localStorage.getItem(STORAGE_KEYS.orders)) {
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.settings)) {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(DEFAULT_SETTINGS));
  }
}

function getMenu() {
  initStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.menu));
}

function saveMenu(menu) {
  localStorage.setItem(STORAGE_KEYS.menu, JSON.stringify(menu));
}

function getActiveMenu() {
  return getMenu().filter((item) => item.active);
}

function getOrders() {
  initStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.orders));
}

function saveOrder(order) {
  const orders = getOrders();
  orders.push(order);
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
}

function getSettings() {
  initStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.settings));
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

function generateOrderId() {
  const orders = getOrders();
  const num = String(orders.length + 1).padStart(3, '0');
  return `ORD-${num}`;
}

function generateMenuId() {
  const menu = getMenu();
  const ids = menu.map((item) => parseInt(item.id, 10)).filter((id) => !isNaN(id));
  const next = ids.length ? Math.max(...ids) + 1 : 1;
  return String(next);
}

function formatCurrency(amount) {
  return `₹${Number(amount).toFixed(2)}`;
}

function menuImageUrl(image) {
  if (!image || image.startsWith('data:')) return image || 'images/placeholder.svg';
  const sep = image.includes('?') ? '&' : '?';
  return `${image}${sep}v=${MENU_VERSION}`;
}

function exportAllData() {
  return {
    menu: getMenu(),
    orders: getOrders(),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
  };
}

function importAllData(data) {
  if (data.menu) saveMenu(data.menu);
  if (data.orders) localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(data.orders));
  if (data.settings) saveSettings(data.settings);
}

initStorage();
