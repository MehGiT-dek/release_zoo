plet products = [];
let cart = [];
let currentFilter = "";

const $ = selector => document.querySelector(selector);
const money = value => `${Number(value).toLocaleString('uk-UA')} грн`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const sections = {
    popular: "#popular-products",
    new: "#new-products",
    sale: "#sale-products"
};

const categories = {
    "Для собак": "Собаки",
    "Для котів": "Коти",
    "Для птахів": "Птахи",
    "Для риб": "Риби",
    "Для гризунів": "Гризуни",
    "Корм": "Корм",
    "Іграшки": "Іграшки",
    "Догляд": "Догляд"
};

function saveCart() {
    document.cookie = `cart=${encodeURIComponent(JSON.stringify(cart))}; path=/; max-age=604800`; sameSite= lax;
}

function loadCart(){ 
    try{
        const value = document.cookie.split('; ').find(part => part.startsWith('cart='));
        const saved = value ? JSON.parse(decodeURIComponent(value.slice(5))) : [];

        cart = Array.isArray(saved) ? saved.filter(item =>
            Number.isInteger(item.id) && Number.isInteger(item.quantity) && item.quantity > 0
        ) : [];
    } catch {
        cart = [];
    }

    updateCart(false);

}

function productCard(product) {
    const title = escapeHtml(product.title);
    const image = product.image 
    ? `<img src = "${escapeHtml(product.image)}" alt="${title}" loading="lazy">`
    : ecscapeHtml(product.emoji || " ");

    return `<article class="product-card" div-class="product.visual">$ {image}</div>
    
    <h3>${title}</h3>
    <p class = "product-category">
    ${escapeHtml(product.category)}
    </p>
    
    <p class = "product-price">
    ${product.oldPrice ? `<s>${money(product.oldPrice)}</s> ` : ""}
    ${money(product.price)}
    </p>

    <button type = "button" class = "add-to-cart" data-add="${product.id}">
    🧺 В кошик
    </button>
    </article>`;
}

function displayProducts() {
    const term = $("#search").value.trim().toLocaleLowerCase("uk-UA");
    const filtered = products.filter(product => 
        (!currentFilter || 
            product.category === currentFilter ||
            product.type === currentFilter) &&
            product.title.toLocaleLowerCase("uk-UA").includes(term)
    );