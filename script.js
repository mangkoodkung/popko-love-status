let affinity = 0;

// อัปเดตหลอด
function updateLove() {
  const bar = document.getElementById('love-progress');
  const level = document.getElementById('love-level-text');
  const score = document.getElementById('love-score-text');

  let percent = Math.min(Math.max((affinity / 2000) * 100, 0), 100);
  bar.style.width = percent + '%';
  score.textContent = affinity;

  if (affinity >= 2000) level.textContent = '💍 คู่ครอง';
  else if (affinity >= 500) level.textContent = '🌹 คนรัก';
  else if (affinity >= 100) level.textContent = '💞 แอบชอบ';
  else if (affinity >= 20) level.textContent = '🧑‍🤝‍🧑 เพื่อน';
  else if (affinity >= 0) level.textContent = '😊 รู้จัก';
  else level.textContent = '😞 ลดลง';
}

// ปุ่มทดสอบเดี๋ยวเอาออกทีหลัง
function changeAffinity(amount) {
  affinity += amount;
  updateLove();
}

// toggle overlay
const toggleBtn = document.getElementById('love-toggle-btn');
const overlay = document.getElementById('love-overlay');

toggleBtn.addEventListener('click', () => {
  overlay.classList.toggle('hidden');
});

// รองรับ LLM → postMessage
window.addEventListener('message', ev => {
  if (ev.data?.type === 'LOVE_CHANGE') {
    affinity += ev.data.value;
    updateLove();
  }
});

updateLove();

/* ========== ระบบลากปุ่มลอย (Drag Floating Button) ========== */
const dragBtn = document.getElementById('love-toggle-btn');

let offsetX = 0;
let offsetY = 0;
let isDragging = false;

dragBtn.addEventListener('mousedown', e => {
  isDragging = true;

  // ค่าที่เมาส์กดบนปุ่ม (เพื่อให้ปุ่มไม่กระโดด)
  offsetX = e.clientX - dragBtn.getBoundingClientRect().left;
  offsetY = e.clientY - dragBtn.getBoundingClientRect().top;
});

document.addEventListener('mousemove', e => {
  if (!isDragging) return;

  const x = e.clientX - offsetX;
  const y = e.clientY - offsetY;

  dragBtn.style.left = `${x}px`;
  dragBtn.style.top = `${y}px`;
  dragBtn.style.right = 'auto';
  dragBtn.style.bottom = 'auto';

  dragBtn.style.position = 'fixed';
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});
