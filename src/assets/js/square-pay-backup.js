// /src/assets/js/square-pay.js
document.addEventListener("DOMContentLoaded", async () => {
    const appId = "sandbox-sq0idb-gcWsDO_XVdN-VQxoPxS1iQ";    // from dashboard
    const locationId = "LTT4WRVJPJD7K";  // from dashboard
  
    if (!window.Square) {
      document.getElementById('payment-status').innerText = "Square SDK not loaded.";
      return;
    }
  
    // initialize Square payments object
    const payments = Square.payments(appId, locationId);
  
    // create and attach card input
    const card = await payments.card();
    await card.attach("#card-container");
  
    // handle button click: tokenize card and POST token to server
    document.getElementById("card-button").addEventListener("click", async () => {
      try {
        const result = await card.tokenize();
        if (result.status === "OK") {
          // send result.token (nonce) to your server to create the payment
          const token = result.token;
          const resp = await fetch("/api/process-payment.php", { // example path — see server section
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, amount: 100 }) // amount in cents: 100 = $1.00
          });
          const data = await resp.json();
          if (resp.ok && data.payment && data.payment.status === "COMPLETED") {
            document.getElementById('payment-status').innerText = "Payment succeeded!";
          } else {
            document.getElementById('payment-status').innerText = "Payment failed: " + JSON.stringify(data);
          }
        } else {
          document.getElementById('payment-status').innerText = "Tokenization errors: " + JSON.stringify(result.errors);
        }
      } catch (err) {
        document.getElementById('payment-status').innerText = "Unexpected error: " + err;
        console.error(err);
      }
    });
  });
  