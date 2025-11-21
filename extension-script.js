(function () {
  const MAX_SCORE = 100;

  // --- 1. Helper Functions ---
  function getScore() {
    const val = localStorage.getItem('popko_love_score');
    return val ? parseInt(val, 10) : 0;
  }

  function setScore(val) {
    // ป้องกันค่าเกินขอบเขต
    if (val > MAX_SCORE) val = MAX_SCORE;
    if (val < 0) val = 0;
    localStorage.setItem('popko_love_score', val);
    return val;
  }

  // --- 2. HTML Templates ---
  const HTML_TEMPLATE = `
        <div id="popko-root">
            <div id="love-toggle-btn">💗</div>

            <div id="love-overlay" class="hidden">
                <div class="love-status-box">
                    <div id="love-level-text">Ready</div>
                    
                    <div class="love-bar-container">
                        <div id="love-progress"></div>
                        <div id="love-score-text">0%</div>
                    </div>

                    <div class="test-buttons">
                        <button id="btn-test-add">+10</button>
                        <button id="btn-test-sub">-10</button>
                    </div>
                    
                    <div style="margin-top:8px;">
                        <button id="btn-force-scan" style="width:100%; background:#666; color:white; font-size:11px; padding:5px; border:none; border-radius:5px; cursor:pointer;">
                            🔍 Force Scan (ตรวจสอบ)
                        </button>
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
                <button id="menu-toggle-widget" class="menu_button" style="width:100%; margin-bottom:5px;">👁️ ซ่อน/แสดง ปุ่มหัวใจ</button>
                <button id="menu-reset" class="menu_button" style="width:100%; background:#ffcccc;">🗑️ รีเซ็ตค่าเป็น 0</button>
            </div>
        </div>
    `;

  // --- 3. Display Logic ---
  function updateDisplay() {
    const score = getScore();
    const percent = (score / MAX_SCORE) * 100;

    const bar = document.getElementById('love-progress');
    const text = document.getElementById('love-score-text');
    const label = document.getElementById('love-level-text');

    if (bar && text && label) {
      bar.style.width = `${percent}%`;
      text.innerText = `${Math.round(percent)}%`;

      if (percent >= 100) label.innerText = '💍 คู่ชีวิต (Soulmate)';
      else if (percent >= 80) label.innerText = '💖 คลั่งรัก (Obsessed)';
      else if (percent >= 60) label.innerText = '🌹 คนรัก (Lover)';
      else if (percent >= 40) label.innerText = '💞 จีบ (Crush)';
      else if (percent >= 20) label.innerText = '😊 เพื่อน (Friend)';
      else label.innerText = '😐 คนรู้จัก (Neutral)';
    }
  }

  // --- 4. Scanning Logic (The Detective) ---

  function tryParseText(text, sourceName) {
    if (!text) return false;

    // Regex แบบครอบจักรวาล:
    // - รับทั้ง LOVE และ AFFINITY (ตัวเล็ก/ใหญ่)
    // - รับ : หรือ =
    // - รับเว้นวรรคกี่ตัวก็ได้
    // - รับเครื่องหมาย + หรือ - หรือไม่มีก็ได้
    // - รับตัวเลข
    const regex = /\[\s*(?:LOVE|AFFINITY)\s*[:=]\s*([+\-]?\s*\d+)\s*\]/i;

    const match = text.match(regex);

    if (match) {
      const numStr = match[1].replace(/\s/g, ''); // ลบเว้นวรรคทิ้งให้หมด
      const points = parseInt(numStr, 10);

      if (!isNaN(points)) {
        console.log(`[Popko] ✅ Match Found! Points: ${points} Source: ${sourceName}`);

        let current = getScore();
        setScore(current + points);
        updateDisplay();

        if (typeof toastr !== 'undefined') {
          toastr.success(`Love Updated: ${points > 0 ? '+' : ''}${points}%`);
        }
        return true; // เจอแล้ว!
      }
    }
    return false; // ไม่เจอ
  }

  // ฟังก์ชันหลักที่ใช้อ่านหน้าจอ
  function performScan(isManual = false) {
    let found = false;
    let debugText = '';

    // วิธีที่ 1: อ่านจาก DOM (หน้าจอ) - แม่นยำสุดเพราะคือสิ่งที่ตาเห็น
    // หา element ที่ชื่อ class "mes_text" ตัวสุดท้าย
    const domMsgs = document.querySelectorAll('.mes_text');
    if (domMsgs.length > 0) {
      const lastMsg = domMsgs[domMsgs.length - 1];
      const textContent = lastMsg.innerText; // ใช้ innerText จะได้ข้อความเพียวๆ

      debugText = textContent.substring(0, 100) + '...'; // เก็บไว้ดูตอน debug
      found = tryParseText(textContent, 'DOM (Screen)');
    }

    // วิธีที่ 2: ถ้าหน้าจอหาไม่เจอ ลองไปดูในตัวแปรระบบ (Backup)
    if (!found && window.chat && window.chat.length > 0) {
      // วนหาข้อความล่าสุดที่ไม่ใช่ของ User
      for (let i = window.chat.length - 1; i >= 0; i--) {
        if (!window.chat[i].is_user) {
          found = tryParseText(window.chat[i].mes, 'Variable (Chat)');
          if (!debugText) debugText = window.chat[i].mes.substring(0, 50);
          break;
        }
      }
    }

    // ถ้ากดปุ่ม Scan แล้วยังไม่เจอ ให้ฟ้องผู้ใช้
    if (isManual && !found) {
      alert(
        `❌ สแกนไม่พบ Tag [LOVE: +/-N]\n\nข้อความล่าสุดที่สแกนเจอคือ:\n"${debugText}"\n\n(ถ้ามี Tag แต่สแกนไม่เจอ แปลว่ารูปแบบผิด หรือมีอักขระแปลกปลอม)`,
      );
    } else if (isManual && found) {
      alert(`✅ สแกนเจอและอัปเดตแล้ว!`);
    }
  }

  // --- 5. Initialization ---
  function init() {
    $('#popko-root').remove();
    $('#popko-settings-panel').remove();

    $('body').append(HTML_TEMPLATE);
    if ($('#extensions_settings').length) $('#extensions_settings').append(SETTINGS_PANEL_HTML);

    // Events
    $('#love-toggle-btn').on('click', () => $('#love-overlay').toggleClass('hidden'));
    $('#btn-test-add').on('click', () => {
      setScore(getScore() + 10);
      updateDisplay();
    });
    $('#btn-test-sub').on('click', () => {
      setScore(getScore() - 10);
      updateDisplay();
    });

    // ปุ่ม Manual Scan (พระเอกของเรา)
    $('#btn-force-scan').on('click', () => {
      performScan(true); // true = manual mode (โชว์ alert)
    });

    // Menu Panel Events
    $('#menu-toggle-widget').on('click', function () {
      const btn = $('#love-toggle-btn');
      if (btn.is(':visible')) {
        btn.hide();
        $('#love-overlay').addClass('hidden');
        $(this).text('🔴 แสดงปุ่มหัวใจ');
      } else {
        btn.show();
        $(this).text('👁️ ซ่อนปุ่มหัวใจ');
      }
    });
    $('#menu-reset').on('click', () => {
      if (confirm('รีเซ็ตค่า?')) {
        setScore(0);
        updateDisplay();
      }
    });

    // Drag Logic
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

    updateDisplay();
  }

  // --- 6. Auto Listener ---
  function startListening() {
    if (!window.eventSource) {
      setTimeout(startListening, 1000);
      return;
    }

    window.eventSource.on(window.event_types.MESSAGE_RECEIVED, () => {
      // Delay 2 วินาที (เพิ่มเวลาให้ชัวร์ว่าข้อความขึ้นจอครบแล้ว)
      setTimeout(() => {
        console.log('[Popko] Auto-scanning message...');
        performScan(false); // false = auto mode (ไม่โชว์ alert พร่ำเพรื่อ)
      }, 2000);
    });
  }

  $(document).ready(function () {
    setTimeout(() => {
      init();
      startListening();
      console.log('[Popko] Ready.');
    }, 500);
  });
})();
