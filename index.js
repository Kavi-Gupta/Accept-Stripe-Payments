// Using Express
var express = require('express');
var app = express();
app.use(express.json());
const { resolve } = require("path");
const stripe = require('stripe')('sk_test_51JCuQlLAJ7k6Ijx1cychaFD8lweczkdG0qWZSvQaLh3uMWFNC5ZT5nR1f9Hu7N3gZMgRqRYfU6JpxwyCXL0uJ3uW00pdgioRMk');

//var PORT = process.env.PORT || 5000;

app.use(express.static('client'));

app.get("/", (req, res) => {
  // Display checkout page
  const path = resolve("./index.html");
  res.sendFile(path);
});

app.get("/client.js", (req, res) => {
  // Display checkout page
  const path = resolve("./client.js");
  res.sendFile(path);
});

app.get("/style.css", (req, res) => {
  // Display checkout page
  const path = resolve("./style.css");
  res.sendFile(path);
});

app.get("/success.html", (req, res) => {
  // Display checkout page
  const path = resolve("./success.html");
  res.sendFile(path);
});

app.get("/fail.html", (req, res) => {
  // Display checkout page
  const path = resolve("./fail.html");
  res.sendFile(path);
});





// Endpoint for when `/pay` is called from client


app.post('/info', async (request, response) => {
  var userData = request.body.user_data
  var amountInStripeFormat = parseFloat(userData.amount) * 100
  console.log(userData)
  console.log(amountInStripeFormat)
  try {
    let intent;
    if (request.body.payment_method_id) {
      // Create the PaymentIntent
      intent = await stripe.paymentIntents.create({
        amount: amountInStripeFormat,
        currency: 'usd',
        confirm: true,
        payment_method: request.body.payment_method_id,
        confirmation_method: 'manual',
        use_stripe_sdk: true,
        receipt_email: userData.emailAddress,
      });
      console.log(request.body.email_address)
    } else if (request.body.payment_intent_id) {
      intent = await stripe.paymentIntents.confirm(
        request.body.payment_intent_id
      );
    }
    // Send the response to the client
    return generateResponse(response, intent);
  }  catch (e) {
    if (e.type === 'StripeCardError') {
      // Display error on client
      return response.send({ error: e.message });
    } else {
      // Something else happened
      return response.status(500).send({ error: e.type });
    }
  }
});

function generateResponse(response, intent) {
  if (intent.status === 'succeeded') {
    // Handle post-payment fulfillment
    console.log("Success");
    return response.send({ success: true });
    
  } else if (intent.status === 'requires_action') {
    // Tell the client to handle the action
    return response.send({
      requiresAction: true,
      clientSecret: intent.client_secret
    });
  } else {
    // Any other status would be unexpected, so error
    return response.status(500).send({error: 'Unexpected status ' + intent.status});
  }
}

//app.listen(PORT, () => console.log(`Node server listening on port ` + PORT));
