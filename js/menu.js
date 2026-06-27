let menuFilters = { search: '', category: 'All' };

function setMenuFilters(filters) {
  menuFilters = { ...menuFilters, ...filters };
}

function getFilteredMenu() {
  let menu = getActiveMenu();

  if (menuFilters.category !== 'All') {
    menu = menu.filter((item) => (item.category || 'Other') === menuFilters.category);
  }

  if (menuFilters.search) {
    const query = menuFilters.search.toLowerCase();
    menu = menu.filter((item) => item.name.toLowerCase().includes(query));
  }

  return menu;
}

function getMenuCategories() {
  const categories = new Set(getActiveMenu().map((item) => item.category || 'Other'));
  return ['All', ...MENU_CATEGORIES.filter((c) => categories.has(c)), ...[...categories].filter((c) => !MENU_CATEGORIES.includes(c))];
}

function renderCategoryFilters(container, onChange) {
  const categories = getMenuCategories();
  container.innerHTML = categories
    .map(
      (cat) =>
        `<button type="button" class="category-chip${cat === menuFilters.category ? ' active' : ''}" data-category="${cat}">${cat}</button>`
    )
    .join('');

  container.querySelectorAll('.category-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.category-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      setMenuFilters({ category: chip.dataset.category });
      onChange();
    });
  });
}

function renderMenuGrid(container, onItemClick) {
  const menu = getFilteredMenu();
  container.innerHTML = '';

  if (menu.length === 0) {
    container.innerHTML = '<p class="empty-msg">No dishes match your search.</p>';
    return;
  }

  menu.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'menu-card';
    card.innerHTML = `
      <div class="menu-card-media">
        <img src="${menuImageUrl(item.image)}" alt="${item.name}" class="menu-card-img" onerror="this.src='images/placeholder.svg'">
        <span class="menu-card-add" aria-hidden="true">+</span>
      </div>
      <div class="menu-card-body">
        <span class="menu-card-category">${item.category || 'Other'}</span>
        <h3 class="menu-card-name">${item.name}</h3>
        <p class="menu-card-price">${formatCurrency(item.price)}</p>
      </div>
    `;
    card.addEventListener('click', () => onItemClick(item));
    container.appendChild(card);
  });
}
