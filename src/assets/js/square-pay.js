// /src/assets/js/square-pay.js
document.addEventListener("DOMContentLoaded", async () => {
  const appId = "sandbox-sq0idb-gcWsDO_XVdN-VQxoPxS1iQ"; // Square dashboard
  const locationId = "LTT4WRVJPJD7K"; // Square dashboard

  const statusEl = document.getElementById("payment-status");
  const buttonEl = document.getElementById("card-button");

  if (!window.Square) {
    statusEl.innerText = "Square SDK not loaded.";
    return;
  }

  // Initialize Square payments object
  const payments = Square.payments(appId, locationId);

  // Create and attach card input
  const card = await payments.card();
  await card.attach("#card-container");

  // Handle button click
  buttonEl.addEventListener("click", async () => {
    // Disable button to prevent double-click
    buttonEl.disabled = true;
    statusEl.innerText = "Processing payment...";

    try {
      // Tokenize card
      const result = await card.tokenize();

      if (result.status === "OK") {
        const token = result.token;

        // POST token to server
        const resp = await fetch("/api/process-payment.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, amount: 100 }) // $1.00 in cents
        });

        const text = await resp.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Non-JSON response from server:", text);
          statusEl.innerText = "Server error. Check console.";
          return;
        }

        if (resp.ok && data.payment && data.payment.status === "COMPLETED") {
          statusEl.innerText = "Payment succeeded!";
        } else if (data.errors) {
          statusEl.innerText = "Payment failed: " + JSON.stringify(data.errors);
        } else {
          statusEl.innerText = "Payment failed: " + JSON.stringify(data);
        }
      } else {
        statusEl.innerText = "Tokenization errors: " + JSON.stringify(result.errors);
      }
    } catch (err) {
      console.error(err);
      statusEl.innerText = "Unexpected error: " + err;
    } finally {
      buttonEl.disabled = false;
    }
  });
});
