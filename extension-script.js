(function () {
  const PLUGIN_ID = 'popko-love-status';

  // HTML ของ Overlay
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
                    <button id="btn-love-add" class="menu_button">+10</button>
                    <button id="btn-love-sub" class="menu_button">-10</button>
                </div>
            </div>
        </div>
    `;

  let affinity = 0;

  // --- 1. ฟังก์ชันอัปเดตหน้าจอ ---
  function updateLoveUI() {
    const bar = document.getElementById('love-progress');
    const level = document.getElementById('love-level-text');
    const score = document.getElementById('love-score-text');

    if (!bar) return;

    // คำนวณ % (เต็ม 100 ที่ 1000 แต้ม)
    let percent = Math.min(Math.max((affinity / 1000) * 100, 0), 100);
    bar.style.width = percent + '%';
    score.textContent = affinity;

    // เปลี่ยนข้อความตามระดับ
    if (affinity >= 1000) level.textContent = '💍 คู่ครอง (Soulmate)';
    else if (affinity >= 800) level.textContent = '💖 คลั่งรัก (Devoted)';
    else if (affinity >= 500) level.textContent = '🌹 คนรัก (Lover)';
    else if (affinity >= 200) level.textContent = '💞 แอบชอบ (Crush)';
    else if (affinity >= 50) level.textContent = '😊 เพื่อนสนิท (Friend)';
    else if (affinity >= 0) level.textContent = '😐 คนรู้จัก (Neutral)';
    else level.textContent = '😡 เกลียด (Hated)';
  }

  // --- 2. ระบบดักจับข้อความจาก AI (หัวใจหลัก) ---
  function initAIListener() {
    // ตรวจสอบว่า SillyTavern โหลดระบบ Event หรือยัง
    if (!window.eventSource) {
      console.warn('[Popko Love] EventSource not ready, retrying...');
      setTimeout(initAIListener, 1000);
      return;
    }

    // ดักฟังเมื่อมีข้อความใหม่เข้ามา (MESSAGE_RECEIVED)
    window.eventSource.on(window.event_types.MESSAGE_RECEIVED, index => {
      // ดึงข้อความล่าสุด
      let msg = window.chat[index];

      // ถ้าเป็นข้อความของผู้ใช้ หรือไม่มีข้อความ ให้ข้ามไป
      if (!msg || msg.is_user) return;

      // 🔍 ค้นหา Pattern: [LOVE: +10] หรือ [LOVE: -5]
      // Regex นี้จะหาคำว่า LOVE: ตามด้วยตัวเลข (มี + หรือ - ก็ได้)
      const match = msg.mes.match(/\[(?:LOVE|AFFINITY)\s*:\s*([+-]?\d+)\]/i);

      if (match) {
        // match[1] คือตัวเลขที่จับได้ (เช่น "+10" หรือ "-5")
        const points = parseInt(match[1]);

        if (!isNaN(points)) {
          console.log(`[Popko Love] AI ordered change: ${points}`);
          affinity += points;
          updateLoveUI();

          // (Option) ถ้าอยากให้แจ้งเตือนเด้งมุมจอ
          if (typeof toastr !== 'undefined') {
            if (points > 0) toastr.success(`ความสัมพันธ์เพิ่มขึ้น ${points}!`);
            else toastr.warning(`ความสัมพันธ์ลดลง ${points}...`);
          }
        }
      }
    });

    console.log('[Popko Love] AI Listener Activated! Ready to parse [LOVE: +/-N]');
  }

  // --- 3. ฟังก์ชันสร้าง UI ---
  function initOverlay() {
    if ($('#love-toggle-btn').length > 0) return;
    $('body').append(OVERLAY_HTML);

    $('#love-toggle-btn').on('click', () => $('#love-overlay').toggleClass('hidden'));

    // ปุ่มกดเล่น (Manual)
    $('#btn-love-add').on('click', () => {
      affinity += 10;
      updateLoveUI();
    });
    $('#btn-love-sub').on('click', () => {
      affinity -= 10;
      updateLoveUI();
    });

    // ระบบลากปุ่ม
    const btn = document.getElementById('love-toggle-btn');
    let isDragging = false,
      offsetX,
      offsetY;
    btn.addEventListener('mousedown', e => {
      isDragging = true;
      const rect = btn.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      btn.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', e => {
      if (!isDragging) return;
      btn.style.left = e.clientX - offsetX + 'px';
      btn.style.top = e.clientY - offsetY + 'px';
      btn.style.right = 'auto';
      btn.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', () => {
      isDragging = false;
      btn.style.cursor = 'grab';
    });

    updateLoveUI();
  }

  // --- 4. เริ่มทำงาน ---
  $(document).ready(function () {
    initOverlay();
    initAIListener(); // เริ่มดักฟัง AI
  });
})();
