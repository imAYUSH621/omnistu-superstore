/**
 * Omnistu Superstore - Authentic Amazon Client Engine
 * Lightweight, zero-telemetry client interactivity
 */
(function() {
  'use strict';

  // 1. Cart Management in localStorage & API synchronization
  function getCart() {
    try {
      const stored = localStorage.getItem('omnistu_cart') || localStorage.getItem('amazon_cart');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem('omnistu_cart', JSON.stringify(cart));
      localStorage.setItem('amazon_cart', JSON.stringify(cart));
      updateCartBadge();
    } catch (e) {}
  }

  function updateCartBadge() {
    const cart = getCart();
    const count = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
    const countEl = document.getElementById('nav-cart-count');
    if (countEl) {
      countEl.textContent = count.toString();
    }
  }

  function addToCart(item) {
    const cart = getCart();
    const existing = cart.find(x => x.asin === item.asin || x.id === item.id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
    } else {
      cart.push({
        asin: item.asin || 'OMN-' + Date.now(),
        title: item.title || 'Product',
        price: item.price || '$19.99',
        image: item.image || '/assets/images/nav-sprite-global-1x-reorg-privacy._CB779528203_.png',
        quantity: item.quantity || 1
      });
    }
    saveCart(cart);

    // Sync with backend API silently
    try {
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      }).catch(function() {});
    } catch (e) {}

    showToast('✓ Added to Cart');
  }

  function showToast(msg) {
    let toast = document.getElementById('omnistu-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'omnistu-toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.backgroundColor = '#067d62';
      toast.style.color = '#fff';
      toast.style.padding = '12px 20px';
      toast.style.borderRadius = '8px';
      toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      toast.style.zIndex = '99999';
      toast.style.fontSize = '14px';
      toast.style.fontWeight = 'bold';
      toast.style.fontFamily = 'Amazon Ember, Arial, sans-serif';
      toast.style.transition = 'opacity 0.3s ease';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(function() {
      toast.style.opacity = '0';
    }, 2500);
  }

  // 2. Search Box Submission Handler
  function initSearch() {
    const form = document.getElementById('nav-search-bar-form') || document.querySelector('form.nav-searchbar');
    const input = document.getElementById('twotabsearchtextbox') || document.querySelector('input.nav-input[type="text"]');
    
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        const q = input ? input.value.trim() : '';
        if (q) {
          window.location.href = '/s?k=' + encodeURIComponent(q);
        } else {
          window.location.href = '/s';
        }
      });
    }
  }

  // 3. Bind Add to Cart Buttons
  function initAddToCart() {
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('#add-to-cart-button, .a-button-input[name="submit.add-to-cart"], .add-to-cart-btn');
      if (btn) {
        e.preventDefault();
        const asin = btn.getAttribute('data-asin') || document.querySelector('[data-asin]')?.getAttribute('data-asin') || 'B0DSVTXFNW';
        const title = document.getElementById('productTitle')?.textContent?.trim() || 'Silicone Magnetic Balls Fidget Toys';
        const price = document.querySelector('.a-price .a-offscreen')?.textContent?.trim() || '$12.99';
        const img = document.querySelector('#landingImage, #main-image')?.getAttribute('src') || '/assets/images/71q7u1V1F4L._AC_UL320_.jpg';
        
        addToCart({
          asin: asin,
          title: title,
          price: price,
          image: img,
          quantity: 1
        });
      }

      const buyNowBtn = e.target.closest('#buy-now-button, .a-button-input[name="submit.buy-now"]');
      if (buyNowBtn) {
        e.preventDefault();
        const asin = buyNowBtn.getAttribute('data-asin') || document.querySelector('[data-asin]')?.getAttribute('data-asin') || 'B0DSVTXFNW';
        const title = document.getElementById('productTitle')?.textContent?.trim() || 'Silicone Magnetic Balls Fidget Toys';
        const price = document.querySelector('.a-price .a-offscreen')?.textContent?.trim() || '$12.99';
        const img = document.querySelector('#landingImage, #main-image')?.getAttribute('src') || '/assets/images/71q7u1V1F4L._AC_UL320_.jpg';
        
        addToCart({
          asin: asin,
          title: title,
          price: price,
          image: img,
          quantity: 1
        });
        window.location.href = '/checkout';
      }
    });
  }

  // 4. Cart Page Hydration
  function initCartPage() {
    if (window.location.pathname.startsWith('/cart')) {
      const cart = getCart();
      const emptyContainer = document.getElementById('sc-empty-cart');
      const activeContainer = document.getElementById('sc-active-cart');
      const countLabel = document.getElementById('sc-subtotal-label-activecart');
      const amountLabel = document.getElementById('sc-subtotal-amount-activecart');
      
      if (cart.length === 0) {
        if (emptyContainer) emptyContainer.style.display = 'block';
        if (activeContainer) activeContainer.style.display = 'none';
      } else {
        if (emptyContainer) emptyContainer.style.display = 'none';
        if (activeContainer) activeContainer.style.display = 'block';
        
        // Calculate subtotal
        let total = 0;
        let qty = 0;
        cart.forEach(function(item) {
          const num = parseFloat((item.price || '0').replace(/[^0-9.]/g, '')) || 0;
          const q = item.quantity || 1;
          total += num * q;
          qty += q;
        });
        if (countLabel) countLabel.textContent = 'Subtotal (' + qty + ' item' + (qty > 1 ? 's' : '') + '):';
        if (amountLabel) amountLabel.textContent = ' $' + total.toFixed(2);
      }
    }
  }

  // 5. Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    updateCartBadge();
    initSearch();
    initAddToCart();
    initCartPage();
  });

  window.OmnistuStore = {
    getCart: getCart,
    addToCart: addToCart,
    saveCart: saveCart,
    updateCartBadge: updateCartBadge
  };
})();
