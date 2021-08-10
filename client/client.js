var stripePublishableKeyTest = "pk_test_51JCuQlLAJ7k6Ijx1lPl0ckK2lwdvFJBWSNKvayjmjVopUEFmILwjkcsnYeTSBaaAsSSbTRi9b7WdDBJBh18z9Bym007eKjzd4w"

var stripePublishableKeyLive = "pk_live_51JCuQlLAJ7k6Ijx1TMpDlIFcaUtHGpcWQzmhB1O7eNtRfm53bIIFF8KgIvDQ9RVJEcmuOJWl17basMpnfQNEEfoK00MFdcuwC9"

var stripe = Stripe(stripePublishableKeyTest);

var elements = stripe.elements();
var cardElement = elements.create('card');
cardElement.mount('#card-element');

var form = document.getElementById('payment-form');

var resultContainer = document.getElementById('payment-result');
var messageContainer = document.getElementById('messages');
cardElement.on('change', function(event) {
  if (event.error) {
    resultContainer.textContent = event.error.message;
  } else {
    resultContainer.textContent = '';
  }
});

form.addEventListener('submit', function(event) {
  var paymentButton = document.getElementById('card-button')
  var formSubmitted = true
  if (messageContainer.innerHTML === '') {
    paymentButton.disabled = true
  }
  event.preventDefault();
  resultContainer.textContent = "";
  stripe.createPaymentMethod({
    type: 'card',
    card: cardElement,
  }).then(handlePaymentMethodResult);
});


function handlePaymentMethodResult(result) {
  if (result.error) {
    // An error happened when collecting card details, show it in the payment form
    resultContainer.textContent = result.error.message;
  } else {
    formData = {
      firstName: document.getElementById('First_Name').value,
      lastName: document.getElementById('Last_Name').value,
      emailAddress: document.getElementById('Email').value,
      telephoneLine01: document.getElementById('Telephone_Line_01').value,
      telephoneLine02: document.getElementById('Telephone_Line_02').value,
      streetAddress: document.getElementById('Street_Address').value,
      city: document.getElementById('City').value,
      state: document.getElementById('Email').value,
      country: document.getElementById('Country').value,
      amount: document.getElementById('Amount').value,
    };
    console.log(formData.emailAddress)
    // Otherwise send paymentMethod.id to your server (see Step 3)
    fetch('/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_method_id: result.paymentMethod.id, user_data: formData })
    }).then(function(result) {
      return result.json();
    }).then(handleServerResponse);
  }
}
function handleServerResponse(responseJson) {
  if (responseJson.error) {
    resultContainer.textContent = responseJson.error;
    setTimeout(function(){
      window.location.href = "/fail.html";
    }, 10000);
    messageContainer.textContent = "Redirecting in 10 seconds...Don't close the tab";
    // Show error from server on payment form
    
  } else if (responseJson.requiresAction) {
    // Use Stripe.js to handle required card action
    stripe.handleCardAction(
      responseJson.clientSecret
    ).then(function(result) {
      if (result.error) {
        // Show `result.error.message` in payment form
      } else {
        // The card action has been handled
        // The PaymentIntent can be confirmed again on the server
        fetch('/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_intent_id: result.paymentIntent.id })
        }).then(function(confirmResult) {
          return confirmResult.json();
        }).then(handleServerResponse);
      }
    });
  } else {
    resultContainer.textContent = 'Success!';
    setTimeout(function(){
      window.location.href = "/success.html";
    }, 10000);
    messageContainer.textContent = "Redirecting in 10 seconds please wait...Don't close the tab";
  }
}
