// -------------------------------------------------------------
// MAIN APPLICATION LOGIC - AskMITS Premium UI
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  // Select DOM Elements
  const themeToggleBotton = document.getElementById('themeToggle');
  const body = document.body;
  const chatMessages = document.getElementById('messages');
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const emptyState = document.getElementById('emptyState');
  const topicCards = document.querySelectorAll('.topic-card');
  const suggestionChips = document.querySelectorAll('.suggestion-chip');
  const startChatBtn = document.getElementById('startChatBtn');
  const clearChatBtn = document.getElementById('clearChatBtn');
  const navbar = document.querySelector('.navbar');

  // -------------------------------------------
  // NAVBAR SCROLL EFFECT
  // -------------------------------------------
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });

  // Backend API
  const API_URL = "https://askmits-vercel-backend.onrender.com/ask"; 
  // You might want to switch to the local port during dev but leaving Render URL assuming production deployment.
  
  // -------------------------------------------
  // THEME TOGGLE (Dark/Light)
  // -------------------------------------------
  if (themeToggleBotton) {
    // Check local storage for preference
    const savedTheme = localStorage.getItem('askmits-theme') || 'light';
    if(savedTheme === 'dark') {
      body.classList.remove('light');
      body.classList.add('dark');
      themeToggleBotton.innerHTML = '<i class="ph ph-sun"></i>';
    }

    themeToggleBotton.addEventListener('click', () => {
      body.classList.toggle('dark');
      body.classList.toggle('light');
      const isDark = body.classList.contains('dark');
      themeToggleBotton.innerHTML = isDark ? '<i class="ph ph-sun"></i>' : '<i class="ph ph-moon"></i>';
      localStorage.setItem('askmits-theme', isDark ? 'dark' : 'light');
    });
  }

  // -------------------------------------------
  // UTILITIES
  // -------------------------------------------
  
  function getFormattedTime() {
    return new Intl.DateTimeFormat('default', {
      hour: 'numeric',
      minute: 'numeric'
    }).format(new Date());
  }

  function scrollToBottom() {
    // requestAnimationFrame ensures DOM updates first, making scroll smoother
    requestAnimationFrame(() => {
      setTimeout(() => {
        chatMessages.scrollTo({
          top: chatMessages.scrollHeight,
          behavior: 'smooth'
        });
      }, 50);
    });
  }

  // -------------------------------------------
  // CHAT COMPONENTS BUILDER
  // -------------------------------------------

  function createUserMessage(text) {
    const time = getFormattedTime();
    const msgWrapper = document.createElement('div');
    msgWrapper.className = 'msg-container msg-user-wrapper';
    
    // Convert basic markdown/newlines to HTML
    const formattedText = text.replace(/\\n/g, '<br>');
    
    msgWrapper.innerHTML = `
      <div class="bubble">${formattedText}</div>
      <div class="msg-meta">
        <button class="action-btn copy-btn" title="Copy Message">
          <i class="ph ph-copy"></i>
        </button>
        <span class="timestamp">${time}</span>
      </div>
    `;

    // Attach copy function
    const copyBtn = msgWrapper.querySelector('.copy-btn');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.innerHTML = '<i class="ph ph-check"></i>';
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="ph ph-copy"></i>';
        }, 2000);
      });
    });

    return msgWrapper;
  }

  function createBotMessage(text) {
    const time = getFormattedTime();
    const msgWrapper = document.createElement('div');
    msgWrapper.className = 'msg-container msg-bot-wrapper';
    
    // Convert basic markdown/newlines to HTML
    const formattedText = text.replace(/\\n/g, '<br>');
    
    msgWrapper.innerHTML = `
      <div class="bubble">${formattedText}</div>
      <div class="msg-meta">
        <span class="timestamp">${time}</span>
        <button class="action-btn copy-btn" title="Copy Message">
          <i class="ph ph-copy"></i>
        </button>
      </div>
    `;

    // Attach copy function
    const copyBtn = msgWrapper.querySelector('.copy-btn');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.innerHTML = '<i class="ph ph-check"></i>';
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="ph ph-copy"></i>';
        }, 2000);
      });
    });

    return msgWrapper;
  }

  function createTypingIndicator() {
    const msgWrapper = document.createElement('div');
    msgWrapper.className = 'msg-container msg-bot-wrapper typing-container';
    msgWrapper.innerHTML = `
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    return msgWrapper;
  }

  // -------------------------------------------
  // WELCOME MESSAGE
  // -------------------------------------------

  function showWelcomeMessage() {
    // Hide the generic empty state
    if (emptyState) emptyState.style.display = 'none';

    // Show typing indicator first for realism
    const typingNode = createTypingIndicator();
    chatMessages.appendChild(typingNode);

    setTimeout(() => {
      typingNode.remove();

      // Create a special welcome message node
      const welcomeNode = document.createElement('div');
      welcomeNode.className = 'msg-container msg-bot-wrapper';
      welcomeNode.innerHTML = `
        <div class="bubble welcome-bubble">
          <span class="welcome-emoji">👋</span>
          Hi! I'm <strong>AskMITS</strong> — your intelligent campus AI assistant.<br><br>
          I can help you with <em>admissions, fees, hostel rules, placements,</em> and much more.<br><br>
          How can I help you today?
        </div>
        <div class="msg-meta">
          <span class="timestamp">${getFormattedTime()}</span>
        </div>
      `;
      chatMessages.appendChild(welcomeNode);
      scrollToBottom();
    }, 1200);
  }

  // -------------------------------------------
  // CHAT LOGIC
  // -------------------------------------------
  
  let isRequestInFlight = false;

  async function handleSendMessage(predefinedQuery = null) {
    const message = predefinedQuery || userInput.value.trim();
    if (!message || isRequestInFlight) return;

    // Reset UI
    isRequestInFlight = true;
    if (emptyState) emptyState.style.display = 'none';
    userInput.value = '';
    sendBtn.disabled = true;

    // Append User Message
    const userMsgNode = createUserMessage(message);
    chatMessages.appendChild(userMsgNode);
    scrollToBottom();

    // Append Typing Indicator
    const typingNode = createTypingIndicator();
    chatMessages.appendChild(typingNode);
    scrollToBottom();

    // Ensure typing animation shows for at least 800ms
    const typingDelay = new Promise(resolve => setTimeout(resolve, 800));

    try {
      // Wait for both the API return and the typing delay to finish
      const [response] = await Promise.all([
        fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: message })
        }),
        typingDelay
      ]);

      typingNode.remove();

      if (!response.ok) {
        throw new Error('Server error: ' + response.status);
      }

      const data = await response.json();
      const botReplyNode = createBotMessage(data.answer || "I'm sorry, I don't have information on that yet.");
      chatMessages.appendChild(botReplyNode);

    } catch (err) {
      console.error(err);
      typingNode.remove();
      const errorNode = createBotMessage("Oops! Network error. Make sure the backend is active.");
      chatMessages.appendChild(errorNode);
    } finally {
      isRequestInFlight = false;
      checkInputState();
      scrollToBottom();
      if(!predefinedQuery) userInput.focus();
    }
  }

  // -------------------------------------------
  // EVENT LISTENERS
  // -------------------------------------------

  // Handle Input State (Change button color dynamically)
  function checkInputState() {
    if (userInput.value.trim() !== '' && !isRequestInFlight) {
      sendBtn.disabled = false;
      sendBtn.style.opacity = '1';
    } else {
      sendBtn.disabled = true;
      sendBtn.style.opacity = '0.5';
    }
  }

  userInput.addEventListener('input', checkInputState);
  
  // Submit on Enter (Prevent if shift pressed)
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // Submit on Button Click
  sendBtn.addEventListener('click', () => handleSendMessage());

  // Quick Action Cards
  topicCards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const q = card.getAttribute('data-q');
      if (q) {
        userInput.value = q;
        checkInputState();
        userInput.focus();
      }
    });
  });

  // Suggested Questions (Below Input)
  suggestionChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const q = chip.getAttribute('data-q');
      if (q) {
        userInput.value = q;
        checkInputState();
        userInput.focus();
      }
    });
  });

  // Start Conversation Button Focuses Input
  if(startChatBtn) {
    startChatBtn.addEventListener('click', () => {
      userInput.focus();
    });
  }

  // Initialize Input State
  checkInputState();

  // Show welcome message on load
  showWelcomeMessage();

  // Restore welcome on clear
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
      chatMessages.innerHTML = '';
      showWelcomeMessage();
    }, { once: false });
  }
});
