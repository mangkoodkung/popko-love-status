(function () {
  const EXT_ID = 'popko-love-status';

  // ส่วนที่ 1: HTML Template (แปลงจาก index.html ของคุณมาเป็น String)
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
                    <button id="btn-test-add" class="menu_button">+10</button>
                    <button id="btn-test-sub" class="menu_button">-10</button>
                </div>
            </div>
        </div>
    `;

  // State ตัวแปรความรัก
  let affinity = 0;

  // ฟังก์ชันอัปเดตหลอดเลือด (จาก script.js เดิม)
  function updateLove() {
    const bar = document.getElementById('love-progress');
    const level = document.getElementById('love-level-text');
    const score = document.getElementById('love-score-text');

    if (!bar) return; // ถ้ายังไม่สร้างหน้าจอ ก็ไม่ต้องทำอะไร

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

  // ฟังก์ชันสร้าง UI ลงบนหน้าจอ SillyTavern (แก้ปัญหา index.html ไม่โหลด)
  function injectOverlay() {
    if (document.getElementById('popko-love-wrapper')) return; // ป้องกันสร้างซ้ำ

    const wrapper = document.createElement('div');
    wrapper.id = 'popko-love-wrapper';
    wrapper.innerHTML = OVERLAY_HTML;
    document.body.appendChild(wrapper);

    // ผูก Event ต่างๆ หลังจากสร้าง Element เสร็จแล้ว
    bindEvents();
    updateLove();
  }

  function bindEvents() {
    const toggleBtn = document.getElementById('love-toggle-btn');
    const overlay = document.getElementById('love-overlay');

    // 1. ปุ่ม Toggle เปิด/ปิด
    toggleBtn.addEventListener('click', () => {
      overlay.classList.toggle('hidden');
    });

    // 2. ปุ่ม Test เพิ่ม/ลด
    document.getElementById('btn-test-add').addEventListener('click', () => {
      affinity += 10;
      updateLove();
    });
    document.getElementById('btn-test-sub').addEventListener('click', () => {
      affinity -= 10;
      updateLove();
    });

    // 3. ระบบลากปุ่ม (Drag)
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
      e.preventDefault(); // กันเลือก Text
      toggleBtn.style.left = e.clientX - offsetX + 'px';
      toggleBtn.style.top = e.clientY - offsetY + 'px';
      toggleBtn.style.right = 'auto';
      toggleBtn.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      toggleBtn.style.cursor = 'grab';
    });
  }

  // --- ส่วนเชื่อมต่อกับ SillyTavern ---
  const ext = {};
  window['extension_' + EXT_ID] = ext; // ต้องประกาศตัวแปร global นี้ ST ถึงจะเห็น

  ext.load = function () {
    console.log('[Popko Love Status] Extension Loaded!');

    // 1. สร้าง Overlay ทันทีที่โหลดเสร็จ
    injectOverlay();

    // 2. เพิ่มเมนูใน Extension Panel
    if (typeof addExtensionMenu === 'function') {
      addExtensionMenu({
        id: EXT_ID,
        title: 'Popko Love Status',
        description: 'แสดงแถบสถานะความรักบนหน้าจอ',
        html: `
                    <div style="padding: 10px;">
                        <h3>Popko Settings</h3>
                        <button id="popko-reset-btn" class="menu_button">รีเซ็ตค่าเป็น 0</button>
                    </div>
                `,
      });

      // ผูกปุ่มรีเซ็ตในเมนู (ใช้ jQuery delegate เพราะเมนูอาจถูกสร้างใหม่)
      $(document).on('click', '#popko-reset-btn', function () {
        affinity = 0;
        updateLove();
        alert('รีเซ็ตค่าความรักแล้ว!');
      });
    }
  };
})();
