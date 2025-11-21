(function () {
  const PLUGIN_ID = 'popko-love-status';

  // HTML Overlay
  const OVERLAY_HTML = `
        <div id="love-toggle-btn" title="Toggle Love Status">💗</div>
        <div id="love-overlay" class="hidden">
            <div class="love-status-box">
                <div id="love-level-text">Loading…</div>
                
                <div class="love-bar" style="position: relative; background: #ffd1dc; height: 24px; border-radius: 12px; overflow: hidden; border: 2px solid #ff85b3;">
                    <div id="love-progress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%); transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                    
                    <div id="love-score-text" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; line-height: 20px; text-align: center; font-weight: bold; color: #d6336c; text-shadow: 0px 0px 2px white;">0%</div>
                </div>

                <div class="test-buttons" style="margin-top: 10px;">
                    <button id="btn-love-add" class="menu_button" style="font-size: 12px;">+10%</button>
                    <button id="btn-love-sub" class="menu_button" style="font-size: 12px;">-10%</button>
                    <button id="btn-love-reset" class="menu_button" style="font-size: 12px;">Reset</button>
                </div>
            </div>
        </div>
    `;

  // ตั้งค่าคะแนนเต็มที่นี่ (ตั้ง 100 เพื่อให้ 1 แต้ม = 1%)
  const MAX_SCORE = 100;
  let affinity = 0; // คะแนนปัจจุบัน

  // --- 1. ฟังก์ชันอัปเดตหน้าจอ (UI) ---
  function updateLoveUI() {
    const bar = document.getElementById('love-progress');
    const level = document.getElementById('love-level-text');
    const score = document.getElementById('love-score-text');

    if (!bar) return;

    // คำนวณ % โดยเทียบกับ MAX_SCORE
    // สูตร: (คะแนนปัจจุบัน / คะแนนเต็ม) * 100
    let percent = (affinity / MAX_SCORE) * 100;

    // บังคับไม่ให้เกิน 0-100% (Clamping)
    percent = Math.min(Math.max(percent, 0), 100);

    // อัปเดตความกว้างหลอด
    bar.style.width = percent + '%';

    // อัปเดตตัวหนังสือให้เป็น %
    score.textContent = Math.round(percent) + '%'; // โชว์ทศนิยมให้ใช้ toFixed(1)

    // เปลี่ยนข้อความตามระดับ %
    if (percent >= 100) level.textContent = '💍 คู่ชีวิต (100%)';
    else if (percent >= 80) level.textContent = '💖 คลั่งรัก (80%+)';
    else if (percent >= 60) level.textContent = '🌹 คนรัก (60%+)';
    else if (percent >= 40) level.textContent = '💞 กำลังจีบ (40%+)';
    else if (percent >= 20) level.textContent = '😊 เพื่อน (20%+)';
    else if (percent >= 0) level.textContent = '😐 คนรู้จัก (0%+)';
    else level.textContent = '💔 เกลียดขี้หน้า';
  }

  // --- 2. ระบบดักฟัง AI ---
  function initAIListener() {
    if (!window.eventSource) {
      setTimeout(initAIListener, 1000);
      return;
    }
    window.eventSource.on(window.event_types.MESSAGE_RECEIVED, index => {
      let msg = window.chat[index];
      if (!msg || msg.is_user) return;

      // หา Tag [LOVE: +10]
      const match = msg.mes.match(/\[(?:LOVE|AFFINITY)\s*:\s*([+-]?\d+)\]/i);
      if (match) {
        const points = parseInt(match[1]);
        if (!isNaN(points)) {
          console.log(`[Popko] AI Change: ${points}%`);

          // บวกคะแนนเพิ่มเข้าไป
          affinity += points;

          // ล็อกไม่ให้เกิน 100 หรือต่ำกว่า 0
          if (affinity > MAX_SCORE) affinity = MAX_SCORE;
          if (affinity < 0) affinity = 0;

          updateLoveUI();

          // แจ้งเตือน
          if (typeof toastr !== 'undefined') {
            toastr.info(`ค่าความรักเปลี่ยน: ${points > 0 ? '+' : ''}${points}%`);
          }
        }
      }
    });
  }

  // --- 3. ฟังก์ชันสร้าง Overlay ---
  function initOverlay() {
    if ($('#love-toggle-btn').length > 0) return;
    $('body').append(OVERLAY_HTML);

    // ปุ่ม Toggle
    $('#love-toggle-btn').on('click', () => $('#love-overlay').toggleClass('hidden'));

    // ปุ่ม Test
    $('#btn-love-add').on('click', () => {
      affinity = Math.min(affinity + 10, MAX_SCORE);
      updateLoveUI();
    });
    $('#btn-love-sub').on('click', () => {
      affinity = Math.max(affinity - 10, 0);
      updateLoveUI();
    });
    $('#btn-love-reset').on('click', () => {
      affinity = 0;
      updateLoveUI();
    });

    // ระบบลากปุ่ม (Drag)
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
      e.preventDefault();
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

  $(document).ready(function () {
    initOverlay();
    initAIListener();
  });
})();
