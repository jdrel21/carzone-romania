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

          <div class="price">${money(p.price)}</div>

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
      id: id,
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
  const el = document.querySelector('#cartItems');
  let total = 0;

  if (!cart.length) {
    el.innerHTML = '<p>Coș gol.</p>';
    document.querySelector('#total').textContent = money(0);
    return;
  }

  el.innerHTML = cart.map(x => {
    const p = products.find(q => q.id === x.id);

    if (!p) return '';

    const subtotal = Number(p.price) * x.qty;
    total += subtotal;

    return `
      <div class="cartline">
        <span>
          ${p.name}<br>
          ${money(p.price)} × ${x.qty}
        </span>

        <span class="qty">
          <button type="button" onclick="change(${p.id}, -1)">−</button>
          <button type="button" onclick="change(${p.id}, 1)">+</button>
        </span>
      </div>
    `;
  }).join('');

  document.querySelector('#total').textContent =
    money(total);
}

function change(id, amount) {
  const x = cart.find(a => a.id === id);

  if (!x) return;

  x.qty += amount;

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
    alert('Coșul este gol.');
    return;
  }

  closeCart();
  document.querySelector('#checkout').classList.remove('hidden');
}

function closeCheckout() {
  document.querySelector('#checkout').classList.add('hidden');
}

document.querySelector('#cartBtn').onclick = openCart;

document.querySelector('#orderForm').addEventListener(
  'submit',
  async function(e) {

    e.preventDefault();

    const form = e.target;
    const f = Object.fromEntries(
      new FormData(form)
    );

    if (!cart.length) {
      alert('Coșul este gol.');
      return;
    }

    const items = cart.map(x => {
      const p = products.find(q => q.id === x.id);

      return {
        product_id: p.id,
        name: p.name,
        unit_price: Number(p.price),
        quantity: x.qty
      };
    });

    const total = items.reduce(
      (sum, item) =>
        sum + item.unit_price * item.quantity,
      0
    );

    const orderId = crypto.randomUUID();

    console.log('Se trimite comanda:', orderId);

    const { error: orderError } = await sb
      .from('orders')
      .insert({
        id: orderId,
        customer_name: f.name,
        phone: f.phone,
        email: f.email || null,
        county: f.county,
        city: f.city,
        address: f.address,
        payment_method: f.payment,
        total: total,
        status: 'new'
      });

    if (orderError) {
      console.error(orderError);

      alert(
        'Eroare la comandă:\n' +
        orderError.message
      );

      return;
    }

    const rows = items.map(item => ({
      order_id: orderId,
      product_id: item.product_id,
      name: item.name,
      unit_price: item.unit_price,
      quantity: item.quantity
    }));

    const { error: itemsError } = await sb
      .from('order_items')
      .insert(rows);

    if (itemsError) {
      console.error(itemsError);

      alert(
        'Comanda a fost creată, dar produsele nu au putut fi salvate:\n' +
        itemsError.message
      );

      return;
    }

    alert(
      'Comanda ta a fost înregistrată cu succes!'
    );

    cart = [];

    save();

    form.reset();

    closeCheckout();
  }
);

save();
loadProducts();
