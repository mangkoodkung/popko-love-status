(function () {
  const PLUGIN_ID = 'popko-love-status';
  const MAX_SCORE = 100; // คะแนนเต็ม

  // ดึงค่าเก่าที่เคยบันทึกไว้ ถ้าไม่มีให้เริ่มที่ 0
  let storedAffinity = localStorage.getItem('popko_love_affinity');
  let affinity = storedAffinity ? parseInt(storedAffinity) : 0;

  // HTML Overlay (เพิ่มปุ่ม Scan Last Message ไว้เทสต์)
  const OVERLAY_HTML = `
        <div id="love-toggle-btn" title="Toggle Love Status">💗</div>
        <div id="love-overlay" class="hidden">
            <div class="love-status-box">
                <div id="love-level-text">Loading…</div>
                
                <div class="love-bar" style="position: relative; background: #ffd1dc; height: 24px; border-radius: 12px; overflow: hidden; border: 2px solid #ff85b3; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                    <div id="love-progress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #ff9a9e 0%, #ff6a88 100%); transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);"></div>
                    <div id="love-score-text" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; line-height: 22px; text-align: center; font-weight: bold; color: #fff; text-shadow: 1px 1px 2px #d6336c; font-size: 14px;">0%</div>
                </div>

                <div class="test-buttons" style="margin-top: 10px; display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">
                    <button id="btn-love-add" class="menu_button" style="font-size: 10px; padding: 2px 8px;">+10</button>
                    <button id="btn-love-sub" class="menu_button" style="font-size: 10px; padding: 2px 8px;">-10</button>
                    <button id="btn-love-reset" class="menu_button" style="font-size: 10px; padding: 2px 8px;">Reset</button>
                </div>
                <div style="margin-top:5px;">
                     <button id="btn-love-scan" class="menu_button" style="width:100%; font-size: 10px; background: #666;">🔍 Force Scan Last Msg</button>
                </div>
            </div>
        </div>
    `;

  // --- 1. ฟังก์ชันอัปเดตหน้าจอ ---
  function updateLoveUI() {
    const bar = document.getElementById('love-progress');
    const level = document.getElementById('love-level-text');
    const score = document.getElementById('love-score-text');

    if (!bar) return;

    // Save ค่าลงเครื่องทุกครั้งที่อัปเดต
    localStorage.setItem('popko_love_affinity', affinity);

    let percent = (affinity / MAX_SCORE) * 100;
    percent = Math.min(Math.max(percent, 0), 100);

    bar.style.width = percent + '%';
    score.textContent = Math.round(percent) + '%';

    // เปลี่ยนข้อความ
    if (percent >= 100) level.textContent = '💍 คู่ชีวิต (Soulmate)';
    else if (percent >= 80) level.textContent = '💖 คลั่งรัก (Obsessed)';
    else if (percent >= 60) level.textContent = '🌹 คนรัก (Lover)';
    else if (percent >= 40) level.textContent = '💞 กำลังจีบ (Crush)';
    else if (percent >= 20) level.textContent = '😊 เพื่อน (Friend)';
    else if (percent >= 0) level.textContent = '😐 คนรู้จัก (Neutral)';
    else level.textContent = '💔 เกลียด (Hated)';
  }

  // --- 2. ฟังก์ชันประมวลผลข้อความ (Logic หลัก) ---
  function parseAndChangeLove(text) {
    if (!text) return;

    // Regex ขั้นเทพ: รองรับ **ตัวหนา**, เว้นวรรคเยอะๆ, ตัวเล็กตัวใหญ่
    // จับรูปแบบ: [LOVE: +10], [Affinity:+10], **[Love: -5]**
    const regex = /\[\s*(?:LOVE|AFFINITY)\s*[:=]\s*([+-]?\s*\d+)\s*\]/i;

    const match = text.match(regex);

    if (match) {
      // ลบช่องว่างทิ้งแล้วแปลงเป็นตัวเลข
      const numStr = match[1].replace(/\s/g, '');
      const points = parseInt(numStr);

      if (!isNaN(points)) {
        console.log(`[Popko Love] พบคำสั่ง: ${points}% จากข้อความ: "${match[0]}"`);

        // อัปเดตค่า
        affinity += points;

        // Limit ค่า
        if (affinity > MAX_SCORE) affinity = MAX_SCORE;
        if (affinity < 0) affinity = 0;

        updateLoveUI();

        // แจ้งเตือน Toast (ถ้ามี)
        if (typeof toastr !== 'undefined') {
          toastr.success(`สถานะหัวใจ: ${points > 0 ? '+' : ''}${points}%`, 'Love Status Updated!');
        }
        return true;
      }
    } else {
      console.log('[Popko Love] ไม่พบ Pattern [LOVE: +N] ในข้อความนี้');
    }
    return false;
  }

  // --- 3. ระบบดักฟัง AI ---
  function initAIListener() {
    // รอจนกว่า Event System ของ ST จะพร้อม
    if (!window.eventSource) {
      console.warn('[Popko Love] Waiting for EventSource...');
      setTimeout(initAIListener, 1000);
      return;
    }

    console.log('[Popko Love] Ready to listen!');

    // Event: เมื่อมีข้อความใหม่เข้ามา
    window.eventSource.on(window.event_types.MESSAGE_RECEIVED, data => {
      // รอเสี้ยววินาทีเพื่อให้ window.chat อัปเดตล่าสุดชัวร์ๆ
      setTimeout(() => {
        // ดึงข้อความล่าสุดจาก Array Chat
        if (!window.chat || window.chat.length === 0) return;

        const lastMsg = window.chat[window.chat.length - 1];

        // ถ้าเป็นข้อความ user ไม่ต้องทำอะไร
        if (lastMsg.is_user) return;

        console.log('[Popko Love] AI ตอบกลับมาแล้ว... กำลังสแกน...');
        parseAndChangeLove(lastMsg.mes); // ส่งข้อความ (mes) ไปตรวจ
      }, 200); // Delay 200ms
    });
  }

  // --- 4. สร้างหน้าต่าง Overlay ---
  function initOverlay() {
    if ($('#love-toggle-btn').length > 0) return;
    $('body').append(OVERLAY_HTML);

    $('#love-toggle-btn').on('click', () => $('#love-overlay').toggleClass('hidden'));

    // ปุ่ม Test Manual
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

    // ปุ่ม Force Scan (ปุ่มช่วยชีวิต)
    $('#btn-love-scan').on('click', () => {
      if (window.chat && window.chat.length > 0) {
        const lastMsg = window.chat[window.chat.length - 1];
        if (lastMsg) {
          alert(`กำลังสแกนข้อความล่าสุด:\n\n"${lastMsg.mes.substring(0, 50)}..."`);
          const found = parseAndChangeLove(lastMsg.mes);
          if (!found) alert('❌ ไม่พบโค้ด [LOVE: +/-N] ในข้อความล่าสุด');
        }
      } else {
        alert('ไม่พบประวัติแชท');
      }
    });

    // Drag Logic
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

  // Start
  $(document).ready(function () {
    initOverlay();
    initAIListener();
  });
})();
