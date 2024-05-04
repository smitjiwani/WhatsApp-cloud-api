function sendMessage() {
  var messageInput = document.getElementById('messageInput');
  var message = messageInput.value.trim();

  fetch('http://localhost:3000/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user: 'web',
      message
    })
  })



  if (message !== '') {
    sendToWhatsApp(message);
    displayMessage(message, true);
    messageInput.value = '';
  }

  displayMessage();
}

function displayMessage(message, isSent) {
  var messagesContainer = document.getElementById('messages');
  fetch('http://localhost:3000/messages')
    .then(response => response.json())
    .then(data => {
      messagesContainer.innerHTML = data.map(message => {
        return `<div class="message ${isSent ? 'sent' : 'received'}">${message.user}: ${message.message}</div>`;
      }).join('');
    })
}

function sendToWhatsApp(message) {
  const fromId = '300955449770510';
  const url = `https://graph.facebook.com/v19.0/300955449770510/messages`;
  const accessToken = 'EAAdwhZBodAG8BO9CdxrmZCk8SQQNQm7soc4ZBpPPeENYGQ7ieeWWhZCQ3QC7ZAynjNtPEfJTIPp8ika1Qt7O3MayKt4ANgaeVEXqyy7KEhnicdEabP5Wzvk3QPTxGdXAtH88Q8TIoUzXjWmrzOFmAwTsXZBkk8ng3ZBNSIZCnm6y23dDyz7TNnqRHa5FL024yhm7It492a7H79Ne1aFrYhAZD';

  fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+918850382695',
      type: 'text',
      text: {
        preview_url: true,
        body: message
      }
    })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      console.log('Message sent successfully');
      // Optionally, you can update the UI or perform other actions upon successful message sending
    })
    .catch(error => {
      console.error(error);
      // Optionally, you can handle the error and display a message to the user
    });
}

setInterval(displayMessage, 2000);


