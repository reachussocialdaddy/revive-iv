// cart.js
document.addEventListener('DOMContentLoaded', () => {
    let cart = JSON.parse(localStorage.getItem('reviveCart')) || [];

    const saveCart = () => {
        localStorage.setItem('reviveCart', JSON.stringify(cart));
        updateCartUI();
    };

    window.addToCart = (id, name, price, type, img) => {
        const existing = cart.find(item => item.id === id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ id, name, price, type, img, quantity: 1 });
        }
        saveCart();
    };

    window.removeFromCart = (id) => {
        const index = cart.findIndex(item => item.id === id);
        if (index !== -1) {
            cart[index].quantity -= 1;
            if (cart[index].quantity === 0) {
                cart.splice(index, 1);
            }
            saveCart();
        }
    };

    window.clearCart = () => {
        cart = [];
        saveCart();
    };

    window.getCart = () => cart;

    const updateCartUI = () => {
        const bottomBar = document.getElementById('cart-bottom-bar');
        const checkoutList = document.getElementById('checkout-items');
        
        // Products Page UI
        if (bottomBar) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            if (totalItems > 0) {
                bottomBar.classList.add('visible');
                bottomBar.querySelector('.cart-item-count').textContent = `${totalItems} ITEM${totalItems > 1 ? 'S' : ''}`;
                
                const hasCustom = cart.some(i => i.id === 'drip_custom');
                if (hasCustom) {
                    bottomBar.querySelector('.cart-total-price').innerHTML = `$${totalPrice} <span style="font-size:0.6rem; font-weight:normal; opacity:0.8;">+ health needs</span>`;
                } else {
                    bottomBar.querySelector('.cart-total-price').textContent = `$${totalPrice}`;
                }
            } else {
                bottomBar.classList.remove('visible');
            }

            // Update item specific controls on products page
            document.querySelectorAll('.product-item').forEach(el => {
                const id = el.dataset.id;
                const item = cart.find(i => i.id === id);
                const addBtn = el.querySelector('.btn-add-initial');
                const counterDiv = el.querySelector('.item-counter');
                if (item) {
                    if(addBtn) addBtn.style.display = 'none';
                    if(counterDiv) {
                        counterDiv.style.display = 'flex';
                        if (id === 'drip_custom') {
                            counterDiv.innerHTML = `<button onclick="removeFromCart('${id}')" style="width:100%; border:none; background:transparent; font-weight:bold; color:var(--accent-primary); font-size:0.85rem; cursor:pointer;">ADDED<br><span style="font-size:0.55rem; font-weight:normal; color:var(--text-secondary);">(Remove)</span></button>`;
                        } else {
                            counterDiv.innerHTML = `
                                <button onclick="removeFromCart('${id}')">-</button>
                                <span class="qty-val">${item.quantity}</span>
                                <button onclick="addToCart('${id}', '${item.name}', ${item.price}, '${item.type}', '${item.img}')">+</button>
                            `;
                        }
                    }
                } else {
                    if(addBtn) addBtn.style.display = 'block';
                    if(counterDiv) counterDiv.style.display = 'none';
                }
            });
        }

        // Checkout Page UI
        if (checkoutList) {
            checkoutList.innerHTML = '';
            let subtotal = 0;
            
            if (cart.length === 0) {
                checkoutList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem 0;">Your cart is empty.</p>';
                document.getElementById('checkout-subtotal').textContent = '$0';
                document.getElementById('checkout-total').textContent = '$0';
                document.getElementById('pay-now-btn').disabled = true;
                return;
            }

            document.getElementById('pay-now-btn').disabled = false;

            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;
                
                let qtyText = `Qty: ${item.quantity}`;
                let priceText = `$${itemTotal}`;
                
                if (item.id === 'drip_custom') {
                    qtyText = `Base amount + customized add-ons`;
                    priceText = `Base: $175`;
                }
                
                checkoutList.innerHTML += `
                    <div class="checkout-item" style="display: flex; justify-content: space-between; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-light);">
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <img src="${item.img}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
                            <div>
                                <h4 style="font-size: 1rem;">${item.name}</h4>
                                <p style="font-size: 0.85rem; color: var(--text-secondary);">${qtyText}</p>
                            </div>
                        </div>
                        <div style="font-weight: bold; align-self: center; text-align:right;">
                            ${priceText}
                        </div>
                    </div>
                `;
            });
            
            document.getElementById('checkout-subtotal').textContent = `$${subtotal}`;
            
            let finalTotal = subtotal;
            let buttonText = 'Pay Now';
            let groupDiscount = 0;

            const bookingType = localStorage.getItem('reviveBookingType');
            const discountContainer = document.getElementById('discount-container');
            const guestSection = document.getElementById('guest-details-section');
            const hasCustom = cart.some(i => i.id === 'drip_custom');

            if (bookingType === 'group') {
                if (guestSection) guestSection.style.display = 'block';
                
                groupDiscount = subtotal * 0.10;
                finalTotal = subtotal - groupDiscount;
                const advance = finalTotal * 0.20;
                
                if (discountContainer) {
                    discountContainer.innerHTML = `
                        <div class="summary-row" style="color: var(--accent-secondary); margin-bottom: 0.5rem;">
                            <span>Group Booking Discount (10%)</span>
                            <span style="font-weight: 700;">-$${groupDiscount.toFixed(2)}</span>
                        </div>
                    `;
                }
                
                buttonText = `Pay $${advance.toFixed(2)} Advance to Confirm`;
                
                let advanceNote = document.getElementById('advance-note');
                if (!advanceNote) {
                    advanceNote = document.createElement('p');
                    advanceNote.id = 'advance-note';
                    advanceNote.style = "color: var(--text-secondary); font-size: 0.85rem; text-align: center; margin-top: 1rem;";
                    document.getElementById('pay-now-btn').parentElement.appendChild(advanceNote);
                }
                if (hasCustom) {
                    advanceNote.innerHTML = `Total base cost (after 10% off) is $${finalTotal.toFixed(2)}. You are paying a 20% advance today.<br><span style="color:var(--accent-primary); font-weight:bold;">Remaining base + custom health add-ons to be paid later.</span>`;
                } else {
                    advanceNote.textContent = `Total cost (after 10% off) is $${finalTotal.toFixed(2)}. You are paying a 20% advance today.`;
                }
            } else {
                if (guestSection) guestSection.style.display = 'none';
                if (discountContainer) discountContainer.innerHTML = '';
                
                const advance = finalTotal * 0.20;
                buttonText = `Pay $${advance.toFixed(2)} Advance to Confirm`;
                
                let advanceNote = document.getElementById('advance-note');
                if (!advanceNote) {
                    advanceNote = document.createElement('p');
                    advanceNote.id = 'advance-note';
                    advanceNote.style = "color: var(--text-secondary); font-size: 0.85rem; text-align: center; margin-top: 1rem;";
                    document.getElementById('pay-now-btn').parentElement.appendChild(advanceNote);
                }
                if (hasCustom) {
                    advanceNote.innerHTML = `Total base cost is $${finalTotal.toFixed(2)}. You are paying a 20% advance today.<br><span style="color:var(--accent-primary); font-weight:bold;">Remaining base + custom health add-ons to be paid later.</span>`;
                } else {
                    advanceNote.textContent = `Total cost is $${finalTotal.toFixed(2)}. You are paying a 20% advance today.`;
                }
            }

            document.getElementById('checkout-total').textContent = `$${finalTotal.toFixed(2)}`;
            document.getElementById('pay-now-btn').textContent = buttonText;
        }
    };

    // Expose globally for Barba re-init
    window.updateCartUI = updateCartUI;

    // Initial UI update
    updateCartUI();
});

// Fallback if script loads after DOM
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (typeof updateCartUI === 'function') updateCartUI();
}
