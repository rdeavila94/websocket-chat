const socket = io();

const $form = document.querySelector("#message-form");
const $messageFormInput = $form.querySelector("input");
const $messageFormButton = $form.querySelector("button");
const $sendLocation = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");
// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;
// Option
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const autoscroll = () => {
  const $newMessage = $messages.lastElementChild;

  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  const visibleHeight = $messages.offsetHeight;

  const containerHeight = $messages.scrollHeight;

  const scrollOffset = $messages.scrollTop + visibleHeight;

  if(containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
}

socket.on("message", message => {
  const html = Mustache.render(messageTemplate, {
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
    username: message.username
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("sendLocationMessage", message => {
  const html = Mustache.render(locationTemplate, {
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
    username: message.username
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, { room, users });
  $sidebar.innerHTML = html;
});

$form.addEventListener("submit", e => {
  e.preventDefault();

  // disable the form
  $messageFormButton.disabled = true;

  const message = e.target.elements.message.value;

  socket.emit("sendMessage", message, message => {
    // re-enable the form
    $messageFormButton.disabled = false;
    $messageFormInput.value = "";
    $messageFormInput.focus();
    console.log(message);
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
    socket.emit("sendLocation", { latitude, longitude }, message => {
      $sendLocation.disabled = false;
      console.log(message);
    });
  });
});

socket.emit("join", { username, room }, error => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
