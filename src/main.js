import './styles.css';

const STORAGE_KEY = 'herasu-note-state-v1';
const DRINKS = [
  { id: 'beer350', name: 'ビール350ml', pureAlcohol: 14, emoji: '🍺' },
  { id: 'whiskyRock', name: 'ウイスキーロック', pureAlcohol: 10, emoji: '🥃' },
  { id: 'chuhai', name: '酎ハイ', pureAlcohol: 14, emoji: '🍋' },
];
const today = () => new Date().toISOString().slice(0, 10);
const yesterday = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};

const defaultCounts = () => Object.fromEntries(DRINKS.map((drink) => [drink.id, 0]));
const defaultState = { records: {}, goal: '20', reminder: { enabled: false, time: '08:00' } };
let state = loadState();
let selectedDate = today();
let draftCounts = { ...defaultCounts(), ...(state.records[selectedDate]?.counts ?? {}) };

function loadState() {
  try {
    return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return defaultState;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function totalAlcohol(counts) {
  return DRINKS.reduce((sum, drink) => sum + (counts[drink.id] || 0) * drink.pureAlcohol, 0);
}

function dateLabel(dateString) {
  return new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(`${dateString}T00:00:00`));
}

function sortedRecords() {
  return Object.entries(state.records).sort(([a], [b]) => b.localeCompare(a));
}

function setSelectedDate(dateString) {
  selectedDate = dateString;
  draftCounts = { ...defaultCounts(), ...(state.records[selectedDate]?.counts ?? {}) };
  render();
}

function saveRecord() {
  const total = totalAlcohol(draftCounts);
  if (total === 0) {
    delete state.records[selectedDate];
  } else {
    state.records[selectedDate] = { counts: { ...draftCounts }, updatedAt: new Date().toISOString() };
  }
  saveState();
  render();
}

function deleteRecord(dateString) {
  delete state.records[dateString];
  if (dateString === selectedDate) draftCounts = defaultCounts();
  saveState();
  render();
}

function reminderText() {
  if (!state.reminder.enabled) return 'オフ：毎朝の記録リマインダーは停止中です。';
  return `オン：毎朝 ${state.reminder.time} に、昨日（${dateLabel(yesterday())}）の記録を促します。`;
}

async function enableReminder() {
  state.reminder.enabled = !state.reminder.enabled;
  if (state.reminder.enabled && 'Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  saveState();
  render();
}

function scheduleOpenAppReminderHint() {
  if (!state.reminder.enabled || !('Notification' in window) || Notification.permission !== 'granted') return;
  const lastKey = `herasu-note-reminded-${today()}`;
  if (localStorage.getItem(lastKey)) return;
  const [hour, minute] = state.reminder.time.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (now >= target) {
    new Notification('へらすノート', { body: `昨日（${dateLabel(yesterday())}）の飲酒量を記録しましょう。` });
    localStorage.setItem(lastKey, 'true');
  }
}

function render() {
  const goalNumber = Number(state.goal);
  const total = totalAlcohol(draftCounts);
  const remaining = Number.isFinite(goalNumber) ? goalNumber - total : null;
  document.querySelector('#app').innerHTML = `
    <main class="shell">
      <header class="hero">
        <p class="eyebrow">スマホ飲酒量メモ</p>
        <h1>へらすノート</h1>
        <p>飲んだ日を選んで、飲み物の数をタップ。端末内に保存され、再読み込み後も残ります。</p>
      </header>

      <section class="card total-card" aria-live="polite">
        <label class="field-label" for="drink-date">記録する日</label>
        <input id="drink-date" class="date-input" type="date" value="${selectedDate}" />
        <div class="meter">
          <span>純アルコール量</span>
          <strong>${total}g</strong>
        </div>
        <div class="goal-status ${remaining !== null && remaining < 0 ? 'over' : ''}">${remaining === null ? '目標値を入力してください' : remaining >= 0 ? `目標まであと ${remaining}g` : `目標を ${Math.abs(remaining)}g 超過`}</div>
      </section>

      <section class="card">
        <h2>飲み物</h2>
        <div class="drink-list">
          ${DRINKS.map((drink) => `
            <article class="drink-row">
              <div><span class="emoji">${drink.emoji}</span><strong>${drink.name}</strong><small>1杯あたり約${drink.pureAlcohol}g</small></div>
              <div class="counter">
                <button class="tap-button circle" data-action="decrement" data-id="${drink.id}" aria-label="${drink.name}を減らす">−</button>
                <span>${draftCounts[drink.id] || 0}</span>
                <button class="tap-button circle" data-action="increment" data-id="${drink.id}" aria-label="${drink.name}を増やす">＋</button>
              </div>
            </article>`).join('')}
        </div>
        <button class="tap-button primary" data-action="save">この日の記録を保存</button>
      </section>

      <section class="card settings">
        <h2>1日の目標値</h2>
        <label class="field-label" for="goal">純アルコール量（g）</label>
        <input id="goal" class="number-input" inputmode="decimal" type="number" min="0" step="1" value="${state.goal}" placeholder="例：20" />
      </section>

      <section class="card settings">
        <h2>毎朝リマインダー</h2>
        <p>${reminderText()}</p>
        <label class="field-label" for="reminder-time">通知時刻</label>
        <input id="reminder-time" class="date-input" type="time" value="${state.reminder.time}" />
        <button class="tap-button secondary" data-action="toggle-reminder">${state.reminder.enabled ? 'リマインダーをオフにする' : 'リマインダーをオンにする'}</button>
        <small>ブラウザの通知許可後、アプリを開いた状態または開いた直後に通知します。</small>
      </section>

      <section class="card">
        <h2>保存した記録</h2>
        <div class="history">
          ${sortedRecords().length ? sortedRecords().map(([dateString, record]) => `
            <article class="history-row">
              <button class="history-main" data-action="edit" data-date="${dateString}"><strong>${dateLabel(dateString)}</strong><span>${totalAlcohol(record.counts)}g</span></button>
              <button class="tap-button delete" data-action="delete" data-date="${dateString}">削除</button>
            </article>`).join('') : '<p class="empty">まだ保存された記録はありません。</p>'}
        </div>
      </section>
    </main>`;
  bindEvents();
  scheduleOpenAppReminderHint();
}

function bindEvents() {
  document.querySelector('#drink-date').addEventListener('change', (event) => setSelectedDate(event.target.value));
  document.querySelector('#goal').addEventListener('input', (event) => {
    state.goal = event.target.value;
    saveState();
  });
  document.querySelector('#goal').addEventListener('change', render);
  document.querySelector('#reminder-time').addEventListener('change', (event) => {
    state.reminder.time = event.target.value;
    saveState();
    render();
  });
  document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', (event) => {
    const { action, id, date } = event.currentTarget.dataset;
    if (action === 'increment') draftCounts[id] += 1;
    if (action === 'decrement') draftCounts[id] = Math.max(0, draftCounts[id] - 1);
    if (action === 'save') saveRecord();
    if (action === 'delete') deleteRecord(date);
    if (action === 'edit') setSelectedDate(date);
    if (action === 'toggle-reminder') enableReminder();
    if (['increment', 'decrement'].includes(action)) render();
  }));
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}
render();
