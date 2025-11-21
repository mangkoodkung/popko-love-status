(function () {
  // ตั้งค่า ID และคะแนนเต็ม
  const PLUGIN_ID = 'popko-love-status';
  const MAX_SCORE = 100;

  // 1. ดึงค่าความรักเดิม (ป้องกันค่าเพี้ยนด้วยการแปลงเป็น Number เสมอ)
  let storedAffinity = localStorage.getItem('popko_love_affinity');
  let affinity = storedAffinity ? Number(storedAffinity) : 0;
  if (isNaN(affinity)) affinity = 0; // กันเหนียวถ้าค่าเป็น NaN

  // 2. HTML Overlay (ตัวหน้าต่างลอย)
  const OVERLAY_HTML = `
        <div id="love-toggle-btn" title="Toggle Love Status">💗</div>
        <div id="love-overlay" class="hidden">
            <div class="love-status-box">
                <div id="love-level-text">Status Check...</div>
                
                <div class="love-bar" style="position: relative; background: #ffd1dc; height: 24px; border-radius: 12px; overflow: hidden; border: 2px solid #ff85b3; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                    <div id="love-progress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #ff9a9e 0%, #ff6a88 100%); transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                    <div id="love-score-text" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; line-height: 22px; text-align: center; font-weight: bold; color: #fff; text-shadow: 1px 1px 2px #d6336c; font-size: 14px;">0%</div>
                </div>

                <div class="test-buttons" style="margin-top: 10px; display: flex; gap: 5px; justify-content: center;">
                    <button id="btn-love-add" class="menu_button" style="font-size: 10px; padding: 2px 8px;">+10</button>
                    <button id="btn-love-sub" class="menu_button" style="font-size: 10px; padding: 2px 8px;">-10</button>
                </div>
            </div>
        </div>
    `;

  // 3. HTML Extension Menu (เมนูในหน้าตั้งค่า ST)
  const SETTINGS_HTML = `
        <div id="popko-love-settings" class="extension_block">
            <div class="extension_name">
                Popko Love Status
                <span style="float:right; cursor:pointer;" onclick="$(this).parent().next().slideToggle()">▼</span>
            </div>
            <div class="extension_content" style="display:none; padding: 10px;">
                <p style="margin-bottom: 10px; font-size: 14px;">ควบคุมการแสดงผล:</p>
                
                <button id="menu-toggle-overlay" class="menu_button" style="width: 100%; margin-bottom: 5px;">👁️ ซ่อน/แสดง Overlay</button>
                
                <button id="menu-reset-score" class="menu_button" style="width: 100%; background-color: #ffcccc;">🗑️ รีเซ็ตค่าความรัก</button>
                
                <hr style="margin: 10px 0; opacity: 0.3;">
                <small style="opacity: 0.7;">Current Affinity: <span id="menu-affinity-val">0</span>%</small>
            </div>
        </div>
    `;

  // --- ฟังก์ชันอัปเดต UI (หัวใจสำคัญ) ---
  function updateLoveUI() {
    // บังคับแปลงเป็นตัวเลขป้องกันบั๊ก String ต่อกัน
    affinity = Number(affinity);
    if (isNaN(affinity)) affinity = 0;

    // เซฟค่า
    localStorage.setItem('popko_love_affinity', affinity);

    // คำนวณ %
    let percent = (affinity / MAX_SCORE) * 100;
    percent = Math.min(Math.max(percent, 0), 100); // ล็อกค่า 0-100

    // อัปเดต Overlay
    const bar = document.getElementById('love-progress');
    const level = document.getElementById('love-level-text');
    const score = document.getElementById('love-score-text');

    if (bar) {
      bar.style.width = percent + '%'; // สั่งขยับหลอด
      score.textContent = Math.round(percent) + '%';

      if (percent >= 100) level.textContent = '💍 คู่ชีวิต (Soulmate)';
      else if (percent >= 80) level.textContent = '💖 คลั่งรัก (Obsessed)';
      else if (percent >= 60) level.textContent = '🌹 คนรัก (Lover)';
      else if (percent >= 40) level.textContent = '💞 กำลังจีบ (Crush)';
      else if (percent >= 20) level.textContent = '😊 เพื่อน (Friend)';
      else level.textContent = '💔 เกลียด/เฉยๆ';
    }

    // อัปเดตตัวเลขใน Menu Panel (ถ้าเปิดอยู่)
    const menuVal = document.getElementById('menu-affinity-val');
    if (menuVal) menuVal.textContent = Math.round(percent);
  }

  // --- Logic อ่านค่าจากข้อความ ---
  function processMessageText(text, sourceName) {
    if (!text) return false;
    // Regex จับรูปแบบ [LOVE: +10]
    const regex = /\[\s*(?:LOVE|AFFINITY)\s*[:=]\s*([+-]?\s*\d+)\s*\]/i;
    const match = text.match(regex);

    if (match) {
      // ลบช่องว่างทิ้งก่อนแปลงเป็นตัวเลข
      const cleanNum = match[1].replace(/\s/g, '');
      const points = parseInt(cleanNum, 10); // radix 10 เพื่อความชัวร์

      if (!isNaN(points)) {
        console.log(`[Popko] Adding points: ${points} (Source: ${sourceName})`);
        affinity += points;

        // ล็อกค่าไม่ให้เกิน
        if (affinity > MAX_SCORE) affinity = MAX_SCORE;
        if (affinity < 0) affinity = 0;

        updateLoveUI();

        if (typeof toastr !== 'undefined') {
          toastr.success(`Love Updated: ${points > 0 ? '+' : ''}${points}%`);
        }
        return true;
      }
    }
    return false;
  }

  // --- ฟังก์ชันสแกนหาข้อความ (DOM + Variable) ---
  function findAndProcessLastMessage() {
    let foundText = '';
    let method = '';

    // 1. ลองอ่านจากตัวแปร window.chat
    if (window.chat && window.chat.length > 0) {
      for (let i = window.chat.length - 1; i >= 0; i--) {
        if (!window.chat[i].is_user) {
          foundText = window.chat[i].mes;
          method = 'Variable';
          break;
        }
      }
    }

    // 2. ถ้าไม่เจอ อ่านจากจอ (DOM)
    if (!foundText) {
      const mesTexts = document.querySelectorAll('.mes_text');
      if (mesTexts.length > 0) {
        foundText = mesTexts[mesTexts.length - 1].innerText;
        method = 'DOM';
      }
    }

    if (foundText) {
      processMessageText(foundText, method);
    }
  }

  // --- สร้าง UI ทั้งหมด ---
  function initUI() {
    // 1. ล้างของเก่า
    $('#love-toggle-btn').remove();
    $('#love-overlay').remove();
    $('#popko-love-settings').remove();

    // 2. สร้าง Overlay
    $('body').append(OVERLAY_HTML);

    // 3. สร้าง Menu Panel (ยัดใส่ extensions_settings)
    const extSettings = $('#extensions_settings');
    if (extSettings.length > 0) {
      extSettings.append(SETTINGS_HTML);
    } else {
      console.warn('[Popko] Extensions panel not found, menu disabled.');
    }

    // --- ผูก Event Listeners ---

    // Toggle Overlay (ปุ่มหัวใจลอย & ปุ่มในเมนู)
    const toggleFn = () => $('#love-overlay').toggleClass('hidden');
    $('#love-toggle-btn').on('click', toggleFn);
    $('#menu-toggle-overlay').on('click', toggleFn);

    // Reset Score (ปุ่มในเมนู)
    $('#menu-reset-score').on('click', () => {
      if (confirm('รีเซ็ตค่าความรักเป็น 0?')) {
        affinity = 0;
        updateLoveUI();
      }
    });

    // Manual Test Buttons
    $('#btn-love-add').on('click', () => {
      affinity += 10;
      updateLoveUI();
    });
    $('#btn-love-sub').on('click', () => {
      affinity -= 10;
      updateLoveUI();
    });

    // Drag Logic for Floating Button
    const btn = document.getElementById('love-toggle-btn');
    let isDragging = false,
      offsetX,
      offsetY;
    if (btn) {
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
    }

    // อัปเดตค่าเริ่มต้น
    updateLoveUI();
  }

  // --- Auto Listener ---
  function initAIListener() {
    if (!window.eventSource) {
      setTimeout(initAIListener, 1000);
      return;
    }

    window.eventSource.on(window.event_types.MESSAGE_RECEIVED, () => {
      // รอ 1 วินาทีให้ข้อความขึ้นจอ แล้วสแกน
      setTimeout(() => findAndProcessLastMessage(), 1000);
    });
  }

  // --- Entry Point ---
  $(document).ready(function () {
    setTimeout(() => {
      initUI();
      initAIListener();
      console.log('[Popko Love] Final Version Loaded.');
    }, 500); // Delay นิดหน่อยเพื่อให้ ST โหลด HTML หลักเสร็จก่อน
  });
})();
