
//Ougaba Gray
//2405837
//Individual Assesstment 2

(function () {
  const CART_KEY  = 'mangashop_cart_v1';
  const ORDER_KEY = 'mangashop_order_v1';


  // Helpers
  function safeParseJSON(str, fallback) {
    try {
      return str ? JSON.parse(str) : fallback;
    } catch (e) {
      console.warn('JSON parse error', e);
      return fallback;
    }
  }

  function loadCart() {
    return safeParseJSON(localStorage.getItem(CART_KEY), []);
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart || []));
    } catch (e) {
      console.warn('Could not save cart', e);
    }
  }

  function clearCartAndOrder() {
    try {
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(ORDER_KEY);
    } catch (e) {
      console.warn('Could not clear cart/order', e);
    }
  }

  function parsePrice(text) {
    if (!text) return 0;
    const clean = String(text).replace(/[^0-9.]/g, '');
    const num = Number(clean);
    return Number.isFinite(num) ? num : 0;
  }

  function formatPrice(value) {
    return 'J$ ' + Number(value || 0).toLocaleString('en-JM', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }


  
  // IA2 2d – Basic Interactivity / Logic: cart arithmetic calculations and promo/shipping/tax rules
  function computeCartTotals(cart) {
    const items = cart || [];

    // subtotal from items
    let subtotal = 0;
    items.forEach(function (item) {
      const qty   = item.qty   || 1;
      const price = item.price || 0;
      subtotal   += qty * price;
    });

    // shipping from dropdown text
    let shipping = 0;
    const shipSelect = document.querySelector('.ship select');
    if (shipSelect && shipSelect.selectedIndex >= 0) {
      const txt   = shipSelect.options[shipSelect.selectedIndex].textContent;
      const match = txt && txt.match(/\$([0-9,]+)/);
      if (match) {
        shipping = parsePrice(match[1]);
      }
    }

    // promo: MANGA10 => 10% off subtotal
    let discount = 0;
    const promoInput = document.querySelector('.promo input');
    if (promoInput && promoInput.dataset.applied === 'true') {
      discount = subtotal * 0.10;
    }

    const taxable = Math.max(subtotal - discount, 0) + shipping;
    const tax     = Math.round(taxable * 0.15);
    const total   = subtotal - discount + shipping + tax;

    return {
      subtotal: subtotal,
      discount: discount,
      shipping: shipping,
      tax:      tax,
      total:    total
    };
  }

  // IA2 2a – DOM Manipulation: write computed totals into .totals-row elements in the summary panel
  function updateCartTotals(cart) {
    const totals = computeCartTotals(cart);

    document.querySelectorAll('.totals-row').forEach(function (row) {
      const labelEl = row.firstElementChild;
      const valueEl = row.lastElementChild;
      if (!labelEl || !valueEl) return;

      const label = labelEl.textContent.trim();

      switch (label) {
        case 'Items Subtotal':
          valueEl.textContent = totals.subtotal
            ? formatPrice(totals.subtotal)
            : '-';
          break;
        case 'Discount':
          valueEl.textContent = totals.discount
            ? '-' + formatPrice(totals.discount)
            : 'None';
          break;
        case 'Shipping':
          valueEl.textContent = totals.shipping
            ? formatPrice(totals.shipping)
            : '-';
          break;
        case 'Tax (15%)':
          valueEl.textContent = totals.tax
            ? formatPrice(totals.tax)
            : '-';
          break;
        case 'Total':
          valueEl.textContent = totals.total
            ? formatPrice(totals.total)
            : '-';
          break;
      }
    });

    return totals;
  }


  // Cart table rendering
  // IA2 2a – DOM Manipulation: build cart table rows dynamically from the cart array
  function fillEmptyCartTable(tbody) {
    tbody.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>Empty</td>' +
        '<td class="num">-</td>' +
        '<td>-</td>' +
        '<td class="num">-</td>';
      tbody.appendChild(tr);
    }
  }

  function renderCartTable(cart) {
    const tbody = document.querySelector('.table tbody');
    if (!tbody) return;

    const items = cart || [];
    if (!items.length) {
      fillEmptyCartTable(tbody);
      updateCartTotals([]);
      return;
    }

    tbody.innerHTML = '';
    items.forEach(function (item) {
      const qty = item.qty || 1;
      const tr  = document.createElement('tr');
      tr.innerHTML =
        '<td>' + (item.title || 'Item') + '</td>' +
        '<td class="num">' + formatPrice(item.price || 0) + '</td>' +
        '<td>' + qty + '</td>' +
        '<td class="num">' + formatPrice((item.price || 0) * qty) + '</td>';
      tbody.appendChild(tr);
    });

    updateCartTotals(items);
  }

  // HOME nd SHOP: Add to Cart buttons
  function initCatalogPages() {
    // Works for both index.html and shop.html – any .card .btn.add
    const addButtons = document.querySelectorAll('.card .btn.add');
    if (!addButtons.length) return;

// IA2 2b – Event Handling: attach click handlers to "Add to Cart" buttons on index/shop pages
    addButtons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();

        const card = btn.closest('.card');
        if (!card) return;

        const titleEl = card.querySelector('h3');
        const priceEl = card.querySelector('.price');

        const item = {
          title: titleEl ? titleEl.textContent.trim() : 'Item',
          price: parsePrice(priceEl ? priceEl.textContent : ''),
          qty:   1
        };

        const cart = loadCart();
        cart.push(item);
        saveCart(cart);

        // goes to cart after adding
        const href = btn.getAttribute('href') || 'cart.html';
        window.location.href = href;
      });
    });
  }


  // CART PAGE: cart, promo, shipping, order, clear all
  function initCartPage() {
    // If there is no cart table, assume we are not on cart.html
    if (!document.querySelector('.table')) return;

    function renderCart() {
      const cart = loadCart();
      renderCartTable(cart);
    }

    renderCart();

    // IA2 2b – Event Handling: apply promo code and refresh totals when button is clicked
    const promoInput = document.querySelector('.promo input');
    const promoBtn   = document.querySelector('.promo .btn');
    if (promoInput && promoBtn) {
      promoBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const code = promoInput.value.trim().toUpperCase();
        promoInput.dataset.applied = (code === 'MANGA10') ? 'true' : 'false';
        renderCart();
      });
    }

    //Shipping change
    const shipSelect = document.querySelector('.ship select');
    if (shipSelect) {
      shipSelect.addEventListener('change', function () {
        renderCart();
      });
    }

    //CLEAR ALL (left panel button)
    const clearBtn = document.getElementById('clear-all');
    if (clearBtn) {
      clearBtn.addEventListener('click', function (e) {
        e.preventDefault();
        clearCartAndOrder();
        renderCart();
      });
    }

    //Confirm + Check Out: save order + go to invoice
    function saveOrderAndGoToInvoice(e) {
// IA2 2c – Form Validation / Input Handling: validate checkout inputs before saving order

      if (e) e.preventDefault();

      const cart   = loadCart();
      const totals = updateCartTotals(cart);

      // Customer fields
      const fname   = document.getElementById('fname');
      const lname   = document.getElementById('lname');
      const email   = document.getElementById('email');
      const phone   = document.getElementById('phone');

      // Shipping address fields
      const addr    = document.getElementById('addr');
      const city    = document.getElementById('city');
      const parish  = document.getElementById('parish');
      const zip     = document.getElementById('zip');
      const country = document.getElementById('country');

      const order = {
        customer: {
          firstName: fname  ? fname.value.trim()  : '',
          lastName:  lname  ? lname.value.trim()  : '',
          email:     email  ? email.value.trim()  : '',
          phone:     phone  ? phone.value.trim()  : ''
        },
        shippingAddress: {
          address: addr    ? addr.value.trim()    : '',
          city:    city    ? city.value.trim()    : '',
          parish:  parish  ? parish.value.trim()  : '',
          zip:     zip     ? zip.value.trim()     : '',
          country: country ? country.value.trim() : ''
        },
        items:   cart,
        totals:  totals,
        createdAt: new Date().toISOString()
      };

      try {
        localStorage.setItem(ORDER_KEY, JSON.stringify(order));
      } catch (err) {
        console.warn('Could not save order', err);
      }

      window.location.href = 'invoice.html';
    }

    const form = document.querySelector('.checkout-form');
    if (form) {
      // Confirm button (submit)
      const confirmBtn = form.querySelector('button[type="submit"]');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', saveOrderAndGoToInvoice);
      }

      // Check Out link (inside .actions)
      const checkoutLink = Array.prototype.slice.call(
        form.querySelectorAll('.actions .btn, .actions a')
      ).find(function (btn) {
        return btn.textContent.trim() === 'Check Out';
      });

      if (checkoutLink) {
        checkoutLink.addEventListener('click', saveOrderAndGoToInvoice);
      }
    }
  }


  // INVOICE PAGE: build invoice from stored order
  function initInvoicePage() {
    const invoiceRoot = document.querySelector('[aria-label="Invoice"]');
    if (!invoiceRoot) return; // not on invoice.html

    const order = safeParseJSON(localStorage.getItem(ORDER_KEY), null);
    if (!order) {
      console.warn('No order found in localStorage for invoice.');
      return;
    }

    //Date & Invoice number
    const now = new Date();
    // IA2 2a – DOM Manipulation: populate invoice fields from stored order object
    const invoiceDateEl   = document.getElementById('invoice-date');
    const invoiceNumberEl = document.getElementById('invoice-number');

    if (invoiceDateEl) {
      invoiceDateEl.textContent = now.toLocaleDateString('en-JM', {
        year:  'numeric',
        month: 'short',
        day:   '2-digit'
      });
    }

    if (invoiceNumberEl) {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      invoiceNumberEl.textContent = 'MS-' + y + m + d;
    }

    //Billing To from order.customer
    const billingP = document.getElementById('billing-details');
    if (billingP && order.customer) {
      const fullName = (
        (order.customer.firstName || '') + ' ' +
        (order.customer.lastName  || '')
      ).trim() || 'Customer Name';

      const email = order.customer.email || 'customer@example.com';
      const phone = order.customer.phone || '123-456-7899';

      billingP.innerHTML =
        fullName + '<br>' +
        email    + '<br>' +
        phone;
    }

    //Items table from order.items
    const tbody = invoiceRoot.querySelector('.table tbody');
    if (tbody) {
      const items = Array.isArray(order.items) ? order.items : [];
      if (!items.length) {
        tbody.innerHTML =
          '<tr>' +
            '<td>No items</td>' +
            '<td class="num">-</td>' +
            '<td>-</td>' +
            '<td class="num">-</td>' +
          '</tr>';
      } else {
        tbody.innerHTML = '';
        items.forEach(function (item) {
          const qty = item.qty || 1;
          const tr  = document.createElement('tr');
          tr.innerHTML =
            '<td>' + (item.title || 'Item') + '</td>' +
            '<td class="num">' + formatPrice(item.price || 0) + '</td>' +
            '<td>' + qty + '</td>' +
            '<td class="num">' + formatPrice((item.price || 0) * qty) + '</td>';
          tbody.appendChild(tr);
        });
      }
    }

    //Totals panel from order.totals
    const totalsBox = invoiceRoot.querySelector('.totals');
    if (totalsBox && order.totals) {
      totalsBox.querySelectorAll('.totals-row').forEach(function (row) {
        const labelEl = row.firstElementChild;
        const valueEl = row.lastElementChild;
        if (!labelEl || !valueEl) return;

        const label = labelEl.textContent.trim();
        switch (label) {
          case 'Items Subtotal':
            valueEl.textContent = formatPrice(order.totals.subtotal || 0);
            break;
          case 'Discount':
            valueEl.textContent = order.totals.discount
              ? '-' + formatPrice(order.totals.discount)
              : 'None';
            break;
          case 'Shipping':
            valueEl.textContent = order.totals.shipping
              ? formatPrice(order.totals.shipping)
              : '-';
            break;
          case 'Tax (15%)':
            valueEl.textContent = order.totals.tax
              ? formatPrice(order.totals.tax)
              : '-';
            break;
          case 'Total':
            valueEl.textContent = formatPrice(order.totals.total || 0);
            break;
        }
      });
    }

    //Buttons (Confirm & Print)
    const printBtn = document.getElementById('btn-print');
    if (printBtn) {
      printBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.print();
      });
    }
  }

  //Init on every page
  document.addEventListener('DOMContentLoaded', function () {
    initCatalogPages();
    initCartPage();
    initInvoicePage();
  });
})();
