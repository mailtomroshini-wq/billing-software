let cart = [];

function getCart() {
  return cart;
}

function addToCart(item) {
  const existing = cart.find((c) => c.id === item.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      qty: 1,
    });
  }
  return cart;
}

function updateQty(id, delta) {
  const item = cart.find((c) => c.id === id);
  if (!item) return cart;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((c) => c.id !== id);
  }
  return cart;
}

function removeFromCart(id) {
  cart = cart.filter((c) => c.id !== id);
  return cart;
}

function clearCart() {
  cart = [];
  return cart;
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartItemCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function getCartSnapshot() {
  return cart.map((item) => ({ ...item }));
}
