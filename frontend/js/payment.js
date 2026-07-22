// ════ RAZORPAY (Online Card / UPI / NetBanking payment) ════
    async function payWithRazorpay(details) {
      const { fname, email, phone, address, city, state, pincode, instructions } = details;
      const sub = cartTotal();
      const ship = 0; // Shipping is free for everyone right now.
      const total = sub + ship - promoDiscount;
      const oid = 'SURVAN-' + Math.floor(1000 + Math.random() * 9000);

      const btn = document.getElementById('place-order-btn');
      const setBtnLoading = (loading) => {
        if (!btn) return;
        btn.disabled = loading;
        btn.textContent = loading ? 'Processing…' : 'Place Order →';
      };

      if (typeof Razorpay === 'undefined') {
        showToast('Payment system failed to load. Check your connection and try again.');
        return;
      }

      setBtnLoading(true);
      try {
        const token = localStorage.getItem('survan_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;

        const createRes = await fetch(`${API}/payment/create-order`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ amount: total, items: [...cart], sub, promoCode: appliedPromoCode || undefined })
        });
        const createData = await createRes.json();
        if (!createRes.ok) throw new Error(createData.message || 'Could not start payment');

        const rzp = new Razorpay({
          key: createData.keyId,
          amount: createData.amount,
          currency: createData.currency,
          name: 'SURVAN',
          description: 'Order Payment',
          order_id: createData.razorpayOrderId,
          prefill: { name: fname, email: email, contact: phone },
          theme: { color: '#B8935A' },
          handler: async function (response) {
            try {
              const orderData = {
                orderId: oid, name: fname, phone, email,
                address, city, state, pincode, instructions,
                items: [...cart], sub, ship,
                discount: promoDiscount, total,
                promoCode: appliedPromoCode || undefined
              };
              const verifyRes = await fetch(`${API}/payment/verify`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderData
                })
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.message || 'Payment verification failed');

              finalizeOrderSuccess({
                id: oid,
                date: new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }),
                time: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
                items: [...cart], sub, ship, discount: promoDiscount, total,
                payment: 'RAZORPAY', status: 'Processing',
                address: `${address}, ${city}, ${state} - ${pincode}`, name: fname, phone, email,
                userEmail: currentUser ? currentUser.email : email
              });
            } catch (err) {
              showToast(err.message || 'Payment could not be verified. If money was deducted, it will be refunded automatically.');
            } finally {
              setBtnLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setBtnLoading(false);
              showToast('Payment cancelled');
            }
          }
        });

        rzp.on('payment.failed', function (response) {
          showToast('Payment failed: ' + (response.error?.description || 'Please try again'));
          setBtnLoading(false);
        });

        rzp.open();
      } catch (err) {
        showToast(err.message || 'Could not start payment. Please try again.');
        setBtnLoading(false);
      }
    }