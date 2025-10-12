async function sendMsg() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;

  const messagesDiv = document.getElementById("messages");

  // show user message
  const userMsg = document.createElement("div");
  userMsg.className = "user";
  userMsg.textContent = message;
  messagesDiv.appendChild(userMsg);

  // show typing indicator
  const typingMsg = document.createElement("div");
  typingMsg.className = "bot";
  typingMsg.textContent = "Typing...";
  messagesDiv.appendChild(typingMsg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  try {
    const res = await fetch("http://127.0.0.1:5000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message }),
    });

    if (!res.ok) {
      typingMsg.textContent = "⚠️ Server error: " + res.status;
      return;
    }

    const data = await res.json();
    typingMsg.textContent = data.answer || "Sorry, I don’t have that info yet.";
  } catch (err) {
    typingMsg.textContent = "🚫 Network error. Is Flask running?";
    console.error("Error:", err);
  }

  input.value = "";
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
