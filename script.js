
// ============================================
// STATE — the app's memory
// ============================================
let chats = {};
let activeChatId = null;

// ============================================
// GRAB HTML ELEMENTS
// ============================================
const messagesEl = document.getElementById('messages');
const userInputEl = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const chatListEl = document.getElementById('chat-list');
const newChatBtn = document.getElementById('new-chat-btn');

// ============================================
// CREATE A NEW CHAT
// ============================================
function createNewChat() {
  const id = Date.now().toString();
  chats[id] = {
    id: id,
    title: 'New Chat',
    messages: []
  };
  activeChatId = id;
  renderChatList();
  renderMessages();
}

// ============================================
// RENDER SIDEBAR CHAT LIST
// ============================================
function renderChatList() {
  chatListEl.innerHTML = '';
  Object.values(chats).reverse().forEach(chat => {
    const item = document.createElement('div');
    item.className = 'chat-item' + (chat.id === activeChatId ? ' active' : '');
    item.textContent = chat.title;
    item.onclick = () => switchChat(chat.id);
    chatListEl.appendChild(item);
  });
}

// ============================================
// SWITCH TO A DIFFERENT CHAT
// ============================================
function switchChat(id) {
  activeChatId = id;
  renderChatList();
  renderMessages();
}

// ============================================
// RENDER MESSAGES FOR ACTIVE CHAT
// ============================================
function renderMessages() {
  messagesEl.innerHTML = '';
  const chat = chats[activeChatId];
  if (!chat) return;
  chat.messages.forEach(msg => {
    addMessageToDOM(msg.role, msg.content);
  });
}

// ============================================
// ADD A SINGLE MESSAGE TO THE SCREEN
// ============================================
function addMessageToDOM(role, content) {
  const div = document.createElement('div');
  div.className = 'message ' + (role === 'user' ? 'user' : 'ai');

  const label = document.createElement('div');
  label.className = 'message-label';
  label.textContent = role === 'user' ? 'YOU' : 'NEUROCHAT';

  const text = document.createElement('div');
  text.textContent = content;

  div.appendChild(label);
  div.appendChild(text);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

// ============================================
// TYPING ANIMATION
// ============================================
function showTyping() {
  const div = document.createElement('div');
  div.className = 'message ai';
  div.id = 'typing-indicator';

  const label = document.createElement('div');
  label.className = 'message-label';
  label.textContent = 'NEUROCHAT';

  const dots = document.createElement('div');
  dots.innerHTML = `
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
  `;

  div.appendChild(label);
  div.appendChild(dots);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function hideTyping() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();
}

// ============================================
// SEND MESSAGE
// ============================================
async function sendMessage() {
  const content = userInputEl.value.trim();
  if (!content || !activeChatId) return;

  const chat = chats[activeChatId];

  chat.messages.push({ role: 'user', content });
  addMessageToDOM('user', content);
  userInputEl.value = '';
  userInputEl.style.height = 'auto';

  if (chat.title === 'New Chat') {
    chat.title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
    renderChatList();
  }

  sendBtn.disabled = true;
  showTyping();

  try {
const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_GROQ_KEY_HERE'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are NEUROCHAT, a futuristic AI assistant. Be helpful, concise, and slightly mysterious.' },
            ...chat.messages
          ],
          max_tokens: 1024
        })
      }
    );

    const data = await response.json();
    console.log('API response:', JSON.stringify(data));

    if (data.error) {
      hideTyping();
      addMessageToDOM('assistant', '[ERROR] ' + data.error.message);
      sendBtn.disabled = false;
      return;
    }

    const aiReply = data.choices[0].message.content;
    chat.messages.push({ role: 'assistant', content: aiReply });
    hideTyping();
    addMessageToDOM('assistant', aiReply);

  } catch (error) {
    hideTyping();
    addMessageToDOM('assistant', '[ERROR] ' + error.message);
    console.error(error);
  }

  sendBtn.disabled = false;
}

// ============================================
// EVENT LISTENERS
// ============================================
sendBtn.onclick = sendMessage;

userInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

userInputEl.addEventListener('input', () => {
  userInputEl.style.height = 'auto';
  userInputEl.style.height = userInputEl.scrollHeight + 'px';
});

newChatBtn.onclick = createNewChat;

// ============================================
// START
// ============================================
createNewChat();