(function () {
  // --- ตั้งค่าตัวแปร ---
  const MAX_SCORE = 100;

  // ฟังก์ชันช่วยดึงค่า (ป้องกันค่าเพี้ยน)
  function getScore() {
    const val = localStorage.getItem('popko_love_score');
    return val ? parseInt(val, 10) : 0;
  }

  function setScore(val) {
    if (val > MAX_SCORE) val = MAX_SCORE;
    if (val < 0) val = 0;
    localStorage.setItem('popko_love_score', val);
    return val;
  }

  // --- HTML ที่จะสร้าง (เรียก Class จาก style.css) ---
  const HTML_TEMPLATE = `
        <div id="popko-root">
            <div id="love-toggle-btn">💗</div>

            <div id="love-overlay" class="hidden">
                <div class="love-status-box">
                    <div id="love-level-text">...</div>
                    
                    <div class="love-bar-container">
                        <div id="love-progress"></div>
                        <div id="love-score-text">0%</div>
                    </div>

                    <div class="test-buttons">
                        <button id="btn-test-add">+10</button>
                        <button id="btn-test-sub">-10</button>
                    </div>
                </div>
            </div>
        </div>
    `;

  const SETTINGS_PANEL_HTML = `
        <div id="popko-settings-panel" class="extension_block">
            <div class="extension_name">
                Popko Love Status
                <span style="float:right; cursor:pointer;" onclick="$(this).parent().next().slideToggle()">▼</span>
            </div>
            <div class="extension_content" style="display:none; padding: 10px;">
                <button id="menu-toggle-widget" class="menu_button" style="width:100%; margin-bottom:5px;">
                    👁️ ซ่อน/แสดง ปุ่มหัวใจ
                </button>
                <button id="menu-reset" class="menu_button" style="width:100%; background:#ffcccc;">
                    🗑️ รีเซ็ตค่าเป็น 0
                </button>
            </div>
        </div>
    `;

  // --- ฟังก์ชันอัปเดตหน้าจอ (Render) ---
  function updateDisplay() {
    const score = getScore();
    const percent = (score / MAX_SCORE) * 100;

    const bar = document.getElementById('love-progress');
    const text = document.getElementById('love-score-text');
    const label = document.getElementById('love-level-text');

    if (bar && text && label) {
      bar.style.width = `${percent}%`;
      text.innerText = `${Math.round(percent)}%`;

      // เปลี่ยนข้อความตามระดับ
      if (percent >= 100) label.innerText = '💍 คู่ชีวิต (Soulmate)';
      else if (percent >= 80) label.innerText = '💖 คลั่งรัก (Obsessed)';
      else if (percent >= 60) label.innerText = '🌹 คนรัก (Lover)';
      else if (percent >= 40) label.innerText = '💞 จีบ (Crush)';
      else if (percent >= 20) label.innerText = '😊 เพื่อน (Friend)';
      else label.innerText = '😐 คนรู้จัก (Neutral)';
    }
  }

  // --- ฟังก์ชันอ่านค่าจาก AI ---
  function scanAIResponse(text) {
    if (!text) return;

    // Regex หา [LOVE: +10] หรือ [AFFINITY: -5]
    const regex = /\[\s*(?:LOVE|AFFINITY)\s*[:=]\s*([+-]?\s*\d+)\s*\]/i;
    const match = text.match(regex);

    if (match) {
      // แปลงข้อความ "+ 10" เป็นตัวเลข 10
      const numStr = match[1].replace(/\s/g, '');
      const points = parseInt(numStr, 10);

      if (!isNaN(points)) {
        console.log(`[Popko] AI Points Found: ${points}`);

        let current = getScore();
        setScore(current + points);
        updateDisplay();

        if (typeof toastr !== 'undefined') {
          toastr.success(`Love Updated: ${points > 0 ? '+' : ''}${points}%`);
        }
      }
    }
  }

  // --- เริ่มต้นทำงาน (Init) ---
  function init() {
    // 1. ล้างของเก่าทิ้งให้หมด (Clean up)
    $('#popko-root').remove();
    $('#popko-settings-panel').remove();

    // 2. สร้าง Overlay ใหม่
    $('body').append(HTML_TEMPLATE);

    // 3. สร้าง Menu Panel (ถ้า ST โหลดเสร็จแล้ว)
    if ($('#extensions_settings').length) {
      $('#extensions_settings').append(SETTINGS_PANEL_HTML);
    }

    // --- ผูก Event (Click Listeners) ---

    // ปุ่มหัวใจลอย (เปิด/ปิด Overlay)
    $('#love-toggle-btn').on('click', function () {
      $('#love-overlay').toggleClass('hidden');
    });

    // ปุ่ม Test +10
    $('#btn-test-add').on('click', function () {
      setScore(getScore() + 10);
      updateDisplay();
    });

    // ปุ่ม Test -10
    $('#btn-test-sub').on('click', function () {
      setScore(getScore() - 10);
      updateDisplay();
    });

    // ปุ่มใน Panel: ซ่อน/แสดง Widget ทั้งก้อน
    $('#menu-toggle-widget').on('click', function () {
      const btn = $('#love-toggle-btn');
      if (btn.is(':visible')) {
        btn.hide();
        $('#love-overlay').addClass('hidden'); // ปิดหน้าต่างด้วย
        $(this).text('🔴 แสดงปุ่มหัวใจ');
      } else {
        btn.show();
        $(this).text('👁️ ซ่อนปุ่มหัวใจ');
      }
    });

    // ปุ่มใน Panel: Reset
    $('#menu-reset').on('click', function () {
      if (confirm('รีเซ็ตค่าความรัก?')) {
        setScore(0);
        updateDisplay();
      }
    });

    // --- ระบบลากปุ่ม (Drag) ---
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

    // อัปเดตครั้งแรก
    updateDisplay();
  }

  // --- Listener รอฟัง AI ---
  function startListening() {
    if (!window.eventSource) {
      setTimeout(startListening, 1000);
      return;
    }
    // เมื่อข้อความเด้งเข้ามา
    window.eventSource.on(window.event_types.MESSAGE_RECEIVED, () => {
      setTimeout(() => {
        // อ่านข้อความล่าสุดจากตัวแปร
        if (window.chat && window.chat.length > 0) {
          // หาข้อความล่าสุดที่ไม่ใช่ของ User
          for (let i = window.chat.length - 1; i >= 0; i--) {
            if (!window.chat[i].is_user) {
              scanAIResponse(window.chat[i].mes);
              break;
            }
          }
        }
      }, 500);
    });
  }

  // --- Run ---
  $(document).ready(function () {
    setTimeout(() => {
      init();
      startListening();
      console.log('[Popko] Love Status Loaded (Clean Version)');
    }, 500);
  });
})();
