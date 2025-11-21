(function () {
  const MAX_SCORE = 100; // เพิ่มช่วงเวลาสแกนเป็น 4 รอบ เน้นรอบสุดท้ายนานขึ้น
  const AUTO_SCAN_INTERVALS = [500, 1500, 3000, 5000]; // --- 1. CSS Style (แก้ไขปัญหา UI เพี้ยนและหลอดไม่เต็ม) ---

  const CSS_STYLE = `
        #popko-root {
            position: fixed;
            z-index: 9999;
            top: 50px;
            right: 10px;
            /* กำหนดให้ลากง่ายขึ้นบนมือถือ */
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
        }
        #love-overlay {
            position: absolute;
            right: 0;
            top: 40px;
            width: 200px; /* กำหนดความกว้างของ Box */
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
            border-radius: 4px;
            overflow: hidden;
            margin-top: 5px;
        }
        #love-progress {
            height: 100%;
            background: linear-gradient(90deg, #ff99aa, #ff4466);
            transition: width 0.5s ease-out; /* ทำให้แถบเลื่อนดู Smooth */
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
        .hidden {
            display: none !important;
        }
    `; // --- 2. ระบบจัดการชื่อตัวละครและเซฟ (เหมือนเดิม) --- // ฟังก์ชันดึงชื่อตัวละครปัจจุบัน

  function getCurrentCharKey() {
    if (typeof window.this_chid !== 'undefined' && window.characters && window.characters[window.this_chid]) {
      let charName = window.characters[window.this_chid].name;
      return 'popko_love_' + charName.replace(/[^a-zA-Z0-9]/g, '_');
    }
    return 'popko_love_Unknown';
  } // ดึงคะแนน

  function getScore() {
    const key = getCurrentCharKey();
    const val = localStorage.getItem(key);
    return val ? parseInt(val, 10) : 0;
  } // บันทึกคะแนน

  function setScore(val) {
    if (val > MAX_SCORE) val = MAX_SCORE;
    if (val < 0) val = 0;

    const key = getCurrentCharKey();
    localStorage.setItem(key, val);
    return val;
  } // --- 3. HTML Templates (ลบปุ่มทดสอบ +10/-10) ---

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
                        <button id="btn-force-scan" class="menu_button" style="width:100%;">
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
                Popko Love Status
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
  } // --- 5. Scanning Logic (มีการเพิ่ม console.log เพื่อ Debug) ---

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
  }

  function performScan(isManual = false) {
    let found = false; // 1. อ่านจาก Variable (เร็วที่สุด อาจจะเจอก่อนขึ้นจอ)

    if (window.chat && window.chat.length > 0) {
      for (let i = window.chat.length - 1; i >= 0; i--) {
        if (!window.chat[i].is_user) {
          console.log(`[Popko] Scanning window.chat[${i}]`);
          found = tryParseText(window.chat[i].mes);
          if (found) break;
        }
      }
    } // 2. ถ้าไม่เจอ ลองอ่านจาก DOM (เผื่อ SillyTavern อัปเดต DOM ก่อนตัวแปร)

    if (!found) {
      const domMsgs = document.querySelectorAll('.mes_text');
      if (domMsgs.length > 0) {
        // อ่านข้อความล่าสุด
        const lastMsg = domMsgs[domMsgs.length - 1].innerText;
        console.log(`[Popko] Scanning DOM (Last Message)`);
        found = tryParseText(lastMsg); // ถ้ายังไม่เจอ ลองอ่านข้อความรองสุดท้าย

        if (!found && domMsgs.length > 1) {
          const prevMsg = domMsgs[domMsgs.length - 2].innerText;
          console.log(`[Popko] Scanning DOM (Previous Message)`);
          found = tryParseText(prevMsg);
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
    $('#popko-settings-panel').remove(); // ********************************** // เพิ่ม CSS เข้าไปใน <head> เพื่อแก้ไข UI
    $('head').append('<style id="popko-style">' + CSS_STYLE + '</style>'); // **********************************
    $('body').append(HTML_TEMPLATE);
    if ($('#extensions_settings').length) $('#extensions_settings').append(SETTINGS_PANEL_HTML); // Events

    $('#love-toggle-btn').on('click', () => $('#love-overlay').toggleClass('hidden'));
    $('#btn-force-scan').on('click', () => performScan(true)); // ... ส่วนของ Menu และ Drag Logic เหมือนเดิม

    // (ส่วน Menu และ Drag Logic เหมือนเดิม)
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
    }); // Drag Logic (Touch & Mouse) - เพื่อให้ใช้บนมือถือได้หากเบราว์เซอร์รองรับ

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
        element.style.position = 'fixed'; // ต้องใส่ Math.max/min เพื่อป้องกันการลากหลุดจอไป
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
  } // --- 7. Event Listeners (Auto-Scan Enhanced) ---

  function startListening() {
    if (!window.eventSource) {
      setTimeout(startListening, 1000);
      return;
    } // 1. เมื่อมีข้อความเข้า (Auto Scan - ตื๊อ 4 รอบ)

    window.eventSource.on(window.event_types.MESSAGE_RECEIVED, () => {
      $('#auto-status').text('Scanning...').css('color', 'orange'); // **ใช้ตัวแปรภายนอกเพื่อติดตามว่าสแกนเจอแล้วหรือยัง**

      let foundInScan = false;

      AUTO_SCAN_INTERVALS.forEach((delay, index) => {
        setTimeout(() => {
          // สแกนต่อเมื่อยังไม่เจอเท่านั้น
          if (!foundInScan) {
            const isFound = performScan(false);
            if (isFound) {
              foundInScan = true; // เจอแล้ว หยุดสแกนต่อ
            }
          }
          // เมื่อถึงรอบสุดท้าย ให้เปลี่ยนสถานะกลับเป็น Active ไม่ว่าจะเจอหรือไม่ก็ตาม
          if (index === AUTO_SCAN_INTERVALS.length - 1) {
            $('#auto-status').text('Active').css('color', 'green');
            if (!foundInScan) {
              console.log('[Popko] Auto-Scan completed (4 rounds). Tag not found.');
            }
          }
        }, delay);
      });
    }); // 2. เมื่อเปลี่ยนตัวละคร (CHAT_CHANGED)

    window.eventSource.on(window.event_types.CHAT_CHANGED, () => {
      console.log('[Popko] Character changed, reloading score...');
      setTimeout(() => {
        updateDisplay();
      }, 500);
    });
  }

  $(document).ready(function () {
    setTimeout(() => {
      init();
      startListening();
      console.log('[Popko] V3.2 Loaded (CSS fixed, Scan enhanced)');
    }, 500);
  });
})();
