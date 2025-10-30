// /src/assets/js/square-pay.js
// Expose a global initializer to start Square payment with dynamic amount and selectors
(function () {
  const appId = "sandbox-sq0idb-gcWsDO_XVdN-VQxoPxS1iQ"; // Square sandbox App ID
  const locationId = "LTT4WRVJPJD7K"; // Square sandbox Location ID

  async function initSquareInlinePayment(options) {
    const {
      amountCents,
      cardContainerSelector = "#card-container",
      payButtonSelector = "#card-button",
      statusSelector = "#payment-status",
      endpoint = "/api/process-payment.php",
      onSuccess,
      onError
    } = options || {};

    const statusEl = document.querySelector(statusSelector);
    const buttonEl = document.querySelector(payButtonSelector);

    if (!window.Square) {
      if (statusEl) statusEl.innerText = "Square SDK not loaded.";
      if (typeof onError === 'function') onError(new Error('Square SDK not loaded'));
      return;
    }

    const payments = Square.payments(appId, locationId);
    const card = await payments.card();
    await card.attach(cardContainerSelector);

    // Remove any previous listeners to avoid duplicates
    if (buttonEl) {
      const newButtonEl = buttonEl.cloneNode(true);
      buttonEl.parentNode.replaceChild(newButtonEl, buttonEl);
    }
    const payBtn = document.querySelector(payButtonSelector);
    if (!payBtn) return;

    payBtn.addEventListener("click", async () => {
      payBtn.disabled = true;
      if (statusEl) statusEl.innerText = "Processing payment...";
      try {
        const result = await card.tokenize();
        if (result.status === "OK") {
          const token = result.token;
          const resp = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, amount: amountCents })
          });
          const text = await resp.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.error("Non-JSON response from server:", text);
            if (statusEl) statusEl.innerText = "Server error. Check console.";
            if (typeof onError === 'function') onError(e);
            return;
          }
          if (resp.ok && data.payment && data.payment.status === "COMPLETED") {
            if (statusEl) statusEl.innerText = "Payment succeeded!";
            if (typeof onSuccess === 'function') onSuccess(data);
          } else {
            const err = data.errors ? new Error(JSON.stringify(data.errors)) : new Error(JSON.stringify(data));
            if (statusEl) statusEl.innerText = "Payment failed.";
            if (typeof onError === 'function') onError(err);
          }
        } else {
          const err = new Error(JSON.stringify(result.errors || {}));
          if (statusEl) statusEl.innerText = "Card validation failed.";
          if (typeof onError === 'function') onError(err);
        }
      } catch (err) {
        console.error(err);
        if (statusEl) statusEl.innerText = "Unexpected error.";
        if (typeof onError === 'function') onError(err);
      } finally {
        payBtn.disabled = false;
      }
    });
  }

  window.initSquareInlinePayment = initSquareInlinePayment;
})();
