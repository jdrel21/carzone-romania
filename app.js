const cfg = window.CARZONE_CONFIG;

const sb = window.supabase.createClient(
  cfg.SUPABASE_URL,
  cfg.SUPABASE_ANON_KEY
);

let products = [];
let cart = JSON.parse(localStorage.getItem('cz_cart') || '[]');

const money = n =>
  Number(n).toLocaleString('ro-RO', {
    style: 'currency',
    currency: 'RON'
  });

async function loadProducts() {
  const { data, error } = await sb
    .from('products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) {
    document.querySelector('#products').innerHTML =
      '<p style="color:red">Eroare Supabase: ' +
      error.message +
      '</p>';

    console.error(error);
    return;
  }

  products = data || [];
  renderProducts();
  save();
}

function renderProducts() {
  document.querySelector('#products').innerHTML =
    products.map(p => `
      <article class="card">
        <div class="pic">${p.icon || '🚗'}</div>

        <div class="info">
          <h3>${p.name}</h3>

          <div class="price">
            ${money(p.price)}
          </div>

          <button
            class="primary buy"
            onclick="add(${p.id})">
            Adaugă în coș
          </button>
        </div>
      </article>
    `).join('');
}

function add(id) {
  let x = cart.find(a => a.id === id);

  if (x) {
    x.qty++;
  } else {
    cart.push({
      id,
      qty: 1
    });
  }

  save();
  openCart();
}

function save() {
  localStorage.setItem(
    'cz_cart',
    JSON.stringify(cart)
  );

  document.querySelector('#count').textContent =
    cart.reduce((s, x) => s + x.qty, 0);

  renderCart();
}

function renderCart() {
  let el = document.querySelector('#cartItems');
  let t = 0;

  if (!cart.length) {
    el.innerHTML = '<p>Coș gol.</p>';
    document.querySelector('#total').textContent = money(0);
    return;
  }

  el.innerHTML = cart.map(x => {
    let p = products.find(q => q.id === x.id);

    if (!p) return '';

    let sub = Number(p.price) * x.qty;
    t += sub;

    return `
      <div class="cartline">
        <span>
          ${p.name}<br>
          ${money(p.price)} × ${x.qty}
        </span>

        <span class="qty">
          <button onclick="change(${p.id},-1)">−</button>
          <button onclick="change(${p.id},1)">+</button>
        </span>
      </div>
    `;
  }).join('');

  document.querySelector('#total').textContent = money(t);
}

function change(id, d) {
  let x = cart.find(a => a.id === id);

  if (!x) return;

  x.qty += d;

  if (x.qty < 1) {
    cart = cart.filter(a => a.id !== id);
  }

  save();
}

function openCart() {
  document.querySelector('#cart').classList.remove('hidden');
  renderCart();
}

function closeCart() {
  document.querySelector('#cart').classList.add('hidden');
}

function checkout() {
  if (!cart.length) {
    return alert('Coșul este gol.');
  }

  closeCart();
  document.querySelector('#checkout').classList.remove('hidden');
}

function closeCheckout() {
  document.querySelector('#checkout').classList.add('hidden');
}

document.querySelector('#cartBtn').onclick = openCart;

document.querySelector('#orderForm').onsubmit = async e => {
  e.preventDefault();

  let f = Object.fromEntries(
    new FormData(e.target)
  );

  let items = cart.map(x => {
    let p = products.find(q => q.id === x.id);

    return {
      product_id: p.id,
      name: p.name,
      unit_price: p.price,
      quantity: x.qty
    };
  });

  let total = items.reduce(
    (s, x) => s + x.unit_price * x.quantity,
    0
  );

  const orderId = crypto.randomUUID();

let { error } = await sb
  .from('orders')
  .insert({
    id: orderId,
    customer_name: f.name,
    phone: f.phone,
    email: f.email,
    county: f.county,
    city: f.city,
    address: f.address,
    payment_method: f.payment,
    total: total,
    status: 'new'
  });

if (error) {
  return alert(
    'Eroare la comandă: ' +
    error.message
  );
}

let rows = items.map(x => ({
  ...x,
  order_id: orderId
}));

  let r = await sb
    .from('order_items')
    .insert(rows);

  if (r.error) {
    return alert(
      'Comanda a fost creată, dar produsele nu au putut fi salvate.'
    );
  }

  alert(
    'Comanda ta a fost înregistrată: ' +
    data.order_number
  );

  cart = [];

  save();

  e.target.reset();

  closeCheckout();
};

save();
loadProducts();
