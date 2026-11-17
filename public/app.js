const form = document.querySelector('#chat-form');
const input = document.querySelector('#message-input');
const messagesElement = document.querySelector('#messages');
const sendButton = document.querySelector('#send-button');
const history = [];

function addMessage(role, content, extraClass = '') {
  document.querySelector('#welcome')?.remove();
  const row = document.createElement('div');
  row.className = `message-row ${role}`;
  const bubble = document.createElement('div');
  bubble.className = `bubble ${extraClass}`.trim();
  bubble.textContent = content;
  row.append(bubble);
  messagesElement.append(row);
  messagesElement.scrollTop = messagesElement.scrollHeight;
  return bubble;
}

input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
});

input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || sendButton.disabled) return;

  history.push({ role: 'user', content: text });
  addMessage('user', text);
  input.value = '';
  input.style.height = 'auto';
  sendButton.disabled = true;
  const pending = addMessage('assistant', 'חושב...', 'pending');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'אירעה שגיאה. נסו שוב.');
    pending.classList.remove('pending');
    pending.textContent = data.answer;
    history.push({ role: 'assistant', content: data.answer });
  } catch (error) {
    pending.textContent = error.message || 'לא הצלחתי להתחבר. בדקו את החיבור ונסו שוב.';
    pending.classList.remove('pending');
    history.pop();
  } finally {
    sendButton.disabled = false;
    input.focus();
    messagesElement.scrollTop = messagesElement.scrollHeight;
  }
});
