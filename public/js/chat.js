const socket = io();

const $form = document.querySelector("#message-form");
const $messageFormInput = $form.querySelector("input");
const $messageFormButton = $form.querySelector("button");
const $sendLocation = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;

socket.on("message", message => {
  console.log(message.text);
  const html = Mustache.render(messageTemplate, {
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a")
  });
  $messages.insertAdjacentHTML("beforeend", html);
});

socket.on("sendLocationMessage", message => {
  const html = Mustache.render(locationTemplate, {
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a")
  });
  $messages.insertAdjacentHTML("beforeend", html);
});

$form.addEventListener("submit", e => {
  e.preventDefault();

  // disable the form
  $messageFormButton.disabled = true;

  const message = e.target.elements.message.value;

  socket.emit("sendMessage", message, error => {
    // re-enable the form
    $messageFormButton.disabled = false;
    $messageFormInput.value = "";
    $messageFormInput.focus();
    if (error) {
      return console.log(error);
    }
    console.log("message delivered");
  });
});

$sendLocation.addEventListener("click", e => {
  $sendLocation.disabled = true;

  if (!navigator.geolocation) {
    $sendLocation.disabled = false;
    return alert("Geolocation is not supported by your browser");
  }

  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    socket.emit("sendLocation", { latitude, longitude }, () => {
      $sendLocation.disabled = false;
      console.log("Location shared!");
    });
  });
});
