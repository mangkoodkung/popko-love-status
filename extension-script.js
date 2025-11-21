(function () {
  const MAX_SCORE = 100; // --- 1. CSS Style (แก้ไขปัญหา UI เพี้ยนและหลอดไม่เต็ม) ---

  const CSS_STYLE = `
        #popko-root {
            position: fixed;
            z-index: 9999;
            top: 50px;
            right: 10px;
            touch-action: none;
        }
        #love-toggle-btn {
            width: 35px;
            height: 35px;
            border-radius: 50%;
            background: #ff7799;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            cursor: grab;
            box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        }
        #love-overlay {
            position: absolute;
            right: 0;
            top: 40px;
            width: 200px; 
            background: rgba(30, 30, 30, 0.95);
            border: 1px solid #ff7799;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .love-bar-container {
            position: relative;
            height: 20px;
            background: #333;
            border-radius: 10px; /* ทำให้โค้งมากขึ้น */
            overflow: hidden;
            margin-top: 5px;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.5); /* เพิ่มมิติ */
        }
        #love-progress {
            height: 100%;
            background: linear-gradient(90deg, #ff99aa, #ff4466);
            transition: width 0.5s ease-out; 
        }
        #love-score-text {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            text-align: center;
            line-height: 20px;
            color: white;
            font-weight: bold;
            text-shadow: 1px 1px 2px #000;
        }
        #love-level-text {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            color: #ffcccc;
            margin-bottom: 5px;
        }
        .hidden {
            display: none !important;
        }
    `; // --- 2. ระบบจัดการชื่อตัวละครและเซฟ (เหมือนเดิม) ---

  function getCurrentCharKey() {
    if (typeof window.this_chid !== 'undefined' && window.characters && window.characters[window.this_chid]) {
      let charName = window.characters[window.this_chid].name;
      return 'popko_love_' + charName.replace(/[^a-zA-Z0-9]/g, '_');
    }
    return 'popko_love_Unknown';
  }
  function getScore() {
    const key = getCurrentCharKey();
    const val = localStorage.getItem(key);
    return val ? parseInt(val, 10) : 0;
  }
  function setScore(val) {
    if (val > MAX_SCORE) val = MAX_SCORE;
    if (val < 0) val = 0;
    const key = getCurrentCharKey();
    localStorage.setItem(key, val);
    return val;
  } // --- 3. HTML Templates (ปรับให้กระชับขึ้น) ---

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
                    <div style="margin-top:5px; font-size:10px; color:#888;">
                        Auto-Scan: <span id="auto-status" style="color:green;">Active</span>
                    </div>
                    <div style="margin-top:5px;">
                        <button id="btn-force-scan" class="menu_button" style="width:100%; padding: 5px;">
                            🔍 Manual Check
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

  const SETTINGS_PANEL_HTML = `
        <div id="popko-settings-panel" class="extension_block">
            <div class="extension_name">
                Popko Love Status (V4.0)
                <span style="float:right; cursor:pointer;" onclick="$(this).parent().next().slideToggle()">▼</span>
            </div>
            <div class="extension_content" style="display:none; padding: 10px;">
                <button id="menu-toggle-widget" class="menu_button" style="width:100%; margin-bottom:5px;">👁️ ซ่อน/แสดง ปุ่ม</button>
                <button id="menu-reset" class="menu_button" style="width:100%; background:#ffcccc;">🗑️ รีเซ็ตค่า (ตัวนี้)</button>
            </div>
        </div>
    `; // --- 4. Display Logic (เหมือนเดิม) ---

  function updateDisplay() {
    const score = getScore();
    const percent = (score / MAX_SCORE) * 100;

    const bar = document.getElementById('love-progress');
    const text = document.getElementById('love-score-text');
    const label = document.getElementById('love-level-text');

    if (bar && text && label) {
      bar.style.width = `${percent}%`;
      text.innerText = `${Math.round(percent)}%`; // อัปเดต Label ระดับความรัก

      if (percent >= 100) label.innerText = `💍 คู่ชีวิต`;
      else if (percent >= 80) label.innerText = `💖 คลั่งรัก`;
      else if (percent >= 60) label.innerText = `🌹 คนรัก`;
      else if (percent >= 40) label.innerText = `💞 จีบ`;
      else if (percent >= 20) label.innerText = `😊 เพื่อน`;
      else label.innerText = `😐 คนรู้จัก`;
    }
  } // --- 5. Scanning Logic (เหมือนเดิม) ---

  function tryParseText(text) {
    if (!text) return false;
    const regex = /\[\s*(?:LOVE|AFFINITY)\s*[:=]\s*([+\-]?\s*\d+)\s*\]/i;
    const match = text.match(regex);

    if (match) {
      const numStr = match[1].replace(/\s/g, '');
      const points = parseInt(numStr, 10);

      if (!isNaN(points)) {
        console.log(`[Popko] ✅ Auto-detected: ${points}. Updating score.`);
        let current = getScore();
        setScore(current + points);
        updateDisplay();

        if (typeof toastr !== 'undefined') {
          toastr.success(`Love Updated: ${points > 0 ? '+' : ''}${points}%`);
        }
        return true;
      }
    }
    return false;
  } // ฟังก์ชันสแกนหาข้อความ (ใช้ DOM เป็นหลัก)

  function performScan(isManual = false) {
    let found = false; // 1. อ่านจาก DOM (หน้าจอ)

    const domMsgs = document.querySelectorAll('.mes_text');
    if (domMsgs.length > 0) {
      // อ่านข้อความล่าสุด
      const lastMsg = domMsgs[domMsgs.length - 1].innerText;
      found = tryParseText(lastMsg);
    } // 2. ถ้าไม่เจอ ลองอ่านจาก Variable (เป็น Fallback)

    if (!found && window.chat && window.chat.length > 0) {
      for (let i = window.chat.length - 1; i >= 0; i--) {
        if (!window.chat[i].is_user) {
          found = tryParseText(window.chat[i].mes);
          if (found) break;
        }
      }
    }

    if (isManual) {
      alert(found ? '✅ เจอและอัปเดตแล้ว!' : '❌ ไม่พบ Tag [LOVE]');
    }
    return found;
  } // --- 6. Init ---

  function init() {
    $('#popko-root').remove();
    $('#popko-settings-panel').remove(); // เพิ่ม CSS เข้าไปใน <head> เพื่อแก้ไข UI
    $('head').append('<style id="popko-style">' + CSS_STYLE + '</style>');

    $('body').append(HTML_TEMPLATE);
    if ($('#extensions_settings').length) $('#extensions_settings').append(SETTINGS_PANEL_HTML); // Events & Drag Logic (เหมือนเดิม)

    $('#love-toggle-btn').on('click', () => $('#love-overlay').toggleClass('hidden'));
    $('#btn-force-scan').on('click', () => {
      performScan(true);
      // หลัง Manual Check ให้รอ 1 วินาทีแล้วเปลี่ยน Auto Status กลับ
      $('#auto-status').text('Active').css('color', 'green');
    });
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
      if (confirm('รีเซ็ตค่าของตัวละครนี้?')) {
        setScore(0);
        updateDisplay();
      }
    }); // Drag Logic (Touch & Mouse) - เหมือนเดิม
    const makeDraggable = element => {
      let isDragging = false,
        startX,
        startY,
        initialLeft,
        initialTop;
      const onStart = (x, y) => {
        isDragging = true;
        startX = x;
        startY = y;
        const rect = element.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;
        element.style.cursor = 'grabbing';
      };
      const onMove = (x, y) => {
        if (!isDragging) return;
        element.style.position = 'fixed';
        element.style.left = `${Math.max(
          0,
          Math.min(window.innerWidth - element.offsetWidth, initialLeft + (x - startX)),
        )}px`;
        element.style.top = `${Math.max(
          0,
          Math.min(window.innerHeight - element.offsetHeight, initialTop + (y - startY)),
        )}px`;
        element.style.right = 'auto';
        element.style.bottom = 'auto';
      };
      const onEnd = () => {
        isDragging = false;
        element.style.cursor = 'grab';
      };

      element.addEventListener('mousedown', e => onStart(e.clientX, e.clientY));
      element.addEventListener('touchstart', e => onStart(e.touches[0].clientX, e.touches[0].clientY), {
        passive: false,
      });
      window.addEventListener('mousemove', e => {
        if (isDragging) {
          e.preventDefault();
          onMove(e.clientX, e.clientY);
        }
      });
      window.addEventListener(
        'touchmove',
        e => {
          if (isDragging) {
            e.preventDefault();
            onMove(e.touches[0].clientX, e.touches[0].clientY);
          }
        },
        { passive: false },
      );
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);
    };
    const btn = document.getElementById('love-toggle-btn');
    if (btn) makeDraggable(btn);

    updateDisplay();
  } // --- 7. Event Listeners (ใช้ Mutation Observer แทน EventSource) ---

  function startListening() {
    const chatContainer = document.getElementById('chat'); // ID หลักของกล่องแชทใน SillyTavern

    if (!chatContainer) {
      console.warn('[Popko] Chat container not found. Retrying in 1s...');
      setTimeout(startListening, 1000);
      return;
    }

    let scanTimeout = null; // สร้าง Mutation Observer
    const observer = new MutationObserver((mutationsList, observer) => {
      // Clear timeout เก่า เพื่อให้เรียก performScan แค่ครั้งเดียวต่อข้อความ
      if (scanTimeout) clearTimeout(scanTimeout); // ตั้งสถานะเป็น Scanning

      $('#auto-status').text('Scanning...').css('color', 'orange'); // หน่วงเวลาสั้นๆ (300ms) เพื่อให้แน่ใจว่าข้อความถูกเพิ่มลงใน DOM สมบูรณ์แล้ว

      scanTimeout = setTimeout(() => {
        console.log('[Popko] Auto-Scan triggered by MutationObserver.');
        performScan(false); // ตั้งสถานะกลับเป็น Active
        $('#auto-status').text('Active').css('color', 'green');
      }, 300);
    }); // เริ่มสังเกตการณ์การเปลี่ยนแปลงของ Child Nodes ใน chatContainer

    observer.observe(chatContainer, {
      childList: true, // สังเกตการเพิ่ม/ลบ Node ลูก
      subtree: true, // สังเกตในทุกระดับ
    });
    console.log('[Popko] MutationObserver is now watching the chat container.'); // 2. เมื่อเปลี่ยนตัวละคร (ใช้ EventSource เดิมสำหรับการโหลดตัวละคร)

    if (window.eventSource) {
      window.eventSource.on(window.event_types.CHAT_CHANGED, () => {
        console.log('[Popko] Character changed, reloading score...');
        setTimeout(() => {
          updateDisplay();
        }, 500);
      });
    }
  }

  $(document).ready(function () {
    setTimeout(() => {
      init();
      startListening();
      console.log('[Popko] V4.0 Loaded (UI Fixed, MutationObserver for Auto-Scan)');
    }, 500);
  });
})();
