(function () {
  const EXT_ID = 'popko-love-status';

  // 1. HTML Template (เอามาจาก index.html ของคุณ)
  // เราต้องสร้าง HTML ผ่าน JS เพื่อ Inject เข้าหน้า SillyTavern
  const OVERLAY_HTML = `
        <div id="love-toggle-btn" title="Toggle Love Status">💗</div>
        <div id="love-overlay" class="hidden">
            <div class="love-status-box">
                <div id="love-level-text">Loading…</div>
                <div class="love-bar">
                    <div id="love-progress"></div>
                </div>
                <div id="love-score-text">0</div>
                <div class="test-buttons">
                    <button id="btn-test-add">+10</button>
                    <button id="btn-test-sub">-10</button>
                </div>
            </div>
        </div>
    `;

  // State ตัวแปร
  let affinity = 0;

  // --- Functions Logic (จาก script.js เดิม) ---

  function updateLove() {
    const bar = document.getElementById('love-progress');
    const level = document.getElementById('love-level-text');
    const score = document.getElementById('love-score-text');

    if (!bar || !level || !score) return; // ป้องกัน error ถ้า element ยังไม่เกิด

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

  function injectOverlay() {
    // เช็คก่อนว่ามีอยู่แล้วไหม ป้องกันซ้อนทับ
    if (document.getElementById('love-toggle-btn')) return;

    // สร้าง Div container แล้วแปะเข้า body
    const container = document.createElement('div');
    container.id = 'popko-love-wrapper';
    container.innerHTML = OVERLAY_HTML;
    document.body.appendChild(container);

    bindOverlayEvents();
    updateLove();
  }

  function bindOverlayEvents() {
    const toggleBtn = document.getElementById('love-toggle-btn');
    const overlay = document.getElementById('love-overlay');

    // Toggle Show/Hide
    toggleBtn.addEventListener('click', () => {
      overlay.classList.toggle('hidden');
    });

    // ปุ่ม Test
    document.getElementById('btn-test-add')?.addEventListener('click', () => {
      affinity += 10;
      updateLove();
    });
    document.getElementById('btn-test-sub')?.addEventListener('click', () => {
      affinity -= 10;
      updateLove();
    });

    // Drag Logic (ปุ่มลอย)
    let offsetX = 0,
      offsetY = 0,
      isDragging = false;

    toggleBtn.addEventListener('mousedown', e => {
      isDragging = true;
      const rect = toggleBtn.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      toggleBtn.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      toggleBtn.style.left = `${x}px`;
      toggleBtn.style.top = `${y}px`;
      toggleBtn.style.right = 'auto';
      toggleBtn.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      toggleBtn.style.cursor = 'grab';
    });
  }

  // --- SillyTavern Integration ---

  const ext = {};

  // Namespace (สำคัญสำหรับการเรียกใช้จากภายนอก)
  window['extension_' + EXT_ID] = ext;

  // ฟังก์ชัน load จะถูกเรียกโดย SillyTavern เมื่อ Extension พร้อม
  ext.load = function () {
    console.log('[Popko Love Status] Loaded');

    // 1. Inject UI เข้าหน้าจอ
    injectOverlay();

    // 2. เพิ่มเมนูเข้าไปใน Extensions Panel (Legacy/Standard way)
    if (typeof addExtensionMenu === 'function') {
      addExtensionMenu({
        id: EXT_ID,
        title: 'Popko Love Status',
        description: 'แสดงแถบสถานะความรักบนหน้าจอ',
        html: `
                    <div style="padding: 10px;">
                        <h3>Popko Settings</h3>
                        <p>จัดการค่าความสัมพันธ์ที่นี่</p>
                        <button id="popko-reset-btn" class="menu_button">รีเซ็ตค่าเป็น 0</button>
                        <hr>
                        <small>Overlay จะแสดงอยู่ที่มุมขวาล่างของจอ</small>
                    </div>
                `,
      });

      // ผูก Event ให้กับปุ่มในเมนู Setting (ต้องรอจังหวะนิดนึงหรือใช้ Delegate)
      // แต่วิธีที่ง่ายที่สุดคือใช้ jQuery delegate event เพราะปุ่มนี้อาจถูกสร้างใหม่ได้
      $(document).on('click', '#popko-reset-btn', function () {
        affinity = 0;
        updateLove();
        toastr.success('รีเซ็ตค่าความรักเรียบร้อย'); // แจ้งเตือนแบบ ST
      });
    }
  };

  // รองรับการรับค่าจาก LLM (Window Message)
  window.addEventListener('message', ev => {
    if (ev.data?.type === 'LOVE_CHANGE') {
      affinity += parseInt(ev.data.value) || 0;
      updateLove();
    }
  });
})();
