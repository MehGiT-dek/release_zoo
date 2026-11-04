let products = [];
let cart = [];
let currentFilter = '';

const $ = selector => document.querySelector(selector);
const money = value => `${Number(value).toLocaleString('uk-UA')} грн`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const sections = { popular: '#popular-products', new: '#new-products', sale: '#sale-products' };
const categories = { 'Для собак':'Собаки', 'Для котів':'Коти', 'Для птахів':'Птахи', 'Для риб':'Риби', 'Для гризунів':'Гризуни', 'Корм':'Корм', 'Іграшки':'Іграшки', 'Догляд':'Догляд' };

function saveCart() {
  document.cookie = `cart=${encodeURIComponent(JSON.stringify(cart))}; max-age=604800; path=/; SameSite=Lax`;
}

function loadCart() {
  try {
    const value = document.cookie.split('; ').find(part => part.startsWith('cart='));
    const saved = value ? JSON.parse(decodeURIComponent(value.slice(5))) : [];
    cart = Array.isArray(saved) ? saved.filter(item => Number.isInteger(item.id) && Number.isInteger(item.quantity) && item.quantity > 0) : [];
  } catch { cart = []; }
  updateCart(false);
}

function productCard(product) {
  const title = escapeHtml(product.title);
  const image = product.image
    ? `<img src="${escapeHtml(product.image)}" alt="${title}" loading="lazy">`
    : escapeHtml(product.emoji || '🐾');
  return `<article class="product-card">
    <div class="product-visual">${image}</div>
    <h3>${title}</h3>
    <p class="product-category">${escapeHtml(product.category)}</p>
    <p class="product-price">${product.oldPrice ? `<s>${money(product.oldPrice)}</s> ` : ''}${money(product.price)}</p>
    <button type="button" class="add-cart" data-add="${product.id}">🛒 В кошик</button>
  </article>`;
}

function displayProducts() {
  const term = $('#search').value.trim().toLocaleLowerCase('uk-UA');
  const filtered = products.filter(product =>
    (!currentFilter || product.category === currentFilter || product.type === currentFilter) &&
    product.title.toLocaleLowerCase('uk-UA').includes(term)
  );
  Object.entries(sections).forEach(([section, selector]) => {
    const cards = filtered.filter(product => product.section === section);
    $(selector).innerHTML = cards.length ? cards.map(productCard).join('') : '<p>Товарів не знайдено</p>';
  });
}

function addToCart(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  const item = cart.find(item => item.id === id);
  if (item) item.quantity++;
  else cart.push({ id, quantity: 1 });
  updateCart();
  showToast('Товар додано до кошика');
}

function changeQuantity(id, change) {
  const item = cart.find(item => item.id === id);
  if (!item) return;
  item.quantity += change;
  cart = cart.filter(item => item.quantity > 0);
  updateCart();
}

function updateCart(save = true) {
  if (save) saveCart();
  $('#cart-count').textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  displayCart();
}

function displayCart() {
  let total = 0;
  const rows = cart.map(item => {
    const product = products.find(product => product.id === item.id);
    if (!product) return '';
    const price = product.price * item.quantity;
    total += price;
    return `<div class="cart-item">
      <div><strong>${escapeHtml(product.title)}</strong><p>${money(price)}</p></div>
      <div class="qty-controls">
        <button type="button" data-id="${item.id}" data-change="-1" aria-label="Зменшити кількість">−</button>
        <span>${item.quantity}</span>
        <button type="button" data-id="${item.id}" data-change="1" aria-label="Збільшити кількість">+</button>
        <button type="button" data-id="${item.id}" data-change="${-item.quantity}" aria-label="Видалити товар">✕</button>
      </div>
    </div>`;
  }).join('');
  $('#cartItems').innerHTML = rows || '<p>Ваш кошик порожній 🛒</p>';
  $('#totalPrice').textContent = money(total);
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('visible'), 2200);
}

async function fetchProducts() {
  try {
    const response = await fetch('store_db.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Невірний формат JSON');
    products = data;
    displayProducts();
    displayCart();
  } catch (error) {
    console.error('Не вдалося завантажити товари:', error);
    Object.values(sections).forEach(selector => {
      $(selector).textContent = 'Не вдалося завантажити товари. Запустіть сайт через Live Server.';
    });
  }
}

$('#search').addEventListener('input', displayProducts);
document.addEventListener('click', event => {
  const add = event.target.closest('[data-add]');
  const quantity = event.target.closest('[data-change]');
  if (add) addToCart(Number(add.dataset.add));
  if (quantity) changeQuantity(Number(quantity.dataset.id), Number(quantity.dataset.change));
});

document.querySelectorAll('.categories > div').forEach(element => {
  element.setAttribute('role', 'button');
  element.tabIndex = 0;
  function activate() {
    const category = categories[element.querySelector('p')?.textContent.trim()];
    currentFilter = currentFilter === category ? '' : category;
    document.querySelectorAll('.categories > div').forEach(card => {
      card.classList.toggle('selected', !!currentFilter && categories[card.querySelector('p')?.textContent.trim()] === currentFilter);
    });
    displayProducts();
  }
  element.addEventListener('click', activate);
  element.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); }
  });
});

const dialog = $('#cart-dialog');
$('#open-cart').addEventListener('click', () => dialog.showModal());
$('#close-cart').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

loadCart();
fetchProducts();
