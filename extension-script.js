(function () {
  const MAX_SCORE = 100;
  const AUTO_SCAN_INTERVALS = [500, 1500, 3000, 5000]; // รอบการสแกนอัตโนมัติ (เป็นมิลลิวินาที) // --- 1. ระบบจัดการชื่อตัวละครและเซฟ --- // ฟังก์ชันดึงชื่อตัวละครปัจจุบัน

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
  } // --- 2. HTML Templates (ลบปุ่มทดสอบ +10/-10) ---

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
                        <button id="btn-force-scan" style="width:100%; background:#888; color:white; font-size:11px; padding:3px; border:none; border-radius:5px; cursor:pointer;">
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
    `; // --- 3. Display Logic ---

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
  } // --- 4. Scanning Logic (The Improved Scanner) ---

  function tryParseText(text) {
    if (!text) return false; // Regex หา [LOVE: +10]
    const regex = /\[\s*(?:LOVE|AFFINITY)\s*[:=]\s*([+\-]?\s*\d+)\s*\]/i;
    const match = text.match(regex);

    if (match) {
      const numStr = match[1].replace(/\s/g, '');
      const points = parseInt(numStr, 10);

      if (!isNaN(points)) {
        console.log(`[Popko] ✅ Auto-detected: ${points}`);

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
  } // ฟังก์ชันสแกนหาข้อความ

  function performScan(isManual = false) {
    let found = false; // 1. อ่านจาก DOM (หน้าจอ)

    const domMsgs = document.querySelectorAll('.mes_text');
    if (domMsgs.length > 0) {
      // อ่านข้อความล่าสุด
      const lastMsg = domMsgs[domMsgs.length - 1].innerText;
      found = tryParseText(lastMsg); // ถ้ายังไม่เจอ ลองอ่านข้อความรองสุดท้าย

      if (!found && domMsgs.length > 1) {
        const prevMsg = domMsgs[domMsgs.length - 2].innerText;
        found = tryParseText(prevMsg);
      }
    } // 2. ถ้าไม่เจอ ลองอ่านจาก Variable (เผื่อข้อความยังไม่ขึ้นจอ)

    if (!found && window.chat && window.chat.length > 0) {
      for (let i = window.chat.length - 1; i >= 0; i--) {
        if (!window.chat[i].is_user) {
          found = tryParseText(window.chat[i].mes);
          break;
        }
      }
    }

    if (isManual) {
      alert(found ? '✅ เจอและอัปเดตแล้ว!' : '❌ ไม่พบ Tag [LOVE]');
    }

    // Debugging: แสดงว่าสแกนไปแล้วและเจอหรือไม่เจอ
    if (!isManual) {
      console.log(`[Popko] Auto-Scan complete. Found tag: ${found}`);
    }

    return found; // คืนค่าเพื่อให้รู้ว่าสแกนเจอหรือไม่
  } // --- 5. Init ---

  function init() {
    $('#popko-root').remove();
    $('#popko-settings-panel').remove();

    $('body').append(HTML_TEMPLATE);
    if ($('#extensions_settings').length) $('#extensions_settings').append(SETTINGS_PANEL_HTML); // Events

    $('#love-toggle-btn').on('click', () => $('#love-overlay').toggleClass('hidden')); // ลบ Event ของปุ่มทดสอบ (+10 / -10) ออกไปแล้ว
    $('#btn-force-scan').on('click', () => performScan(true));

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
    }); // Drag Logic (เหมือนเดิม)

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
        element.style.left = `${initialLeft + (x - startX)}px`;
        element.style.top = `${initialTop + (y - startY)}px`;
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
  } // --- 6. Event Listeners (Auto-Scan & Switch Char) ---

  function startListening() {
    if (!window.eventSource) {
      setTimeout(startListening, 1000);
      return;
    } // 1. เมื่อมีข้อความเข้า (Auto Scan - ตื๊อ 4 รอบ)

    window.eventSource.on(window.event_types.MESSAGE_RECEIVED, () => {
      $('#auto-status').text('Scanning...').css('color', 'orange');

      let foundInScan = false;

      // วนลูปเพื่อเรียก performScan ตามช่วงเวลาที่กำหนด
      AUTO_SCAN_INTERVALS.forEach((delay, index) => {
        setTimeout(() => {
          // จะทำการสแกนต่อเมื่อยังไม่เจอ tag ก่อนหน้านี้
          if (!foundInScan) {
            const isFound = performScan(false);
            if (isFound) {
              foundInScan = true; // หยุดสแกนต่อหากเจอแล้ว
            }
          }
          // เมื่อถึงรอบสุดท้าย ให้เปลี่ยนสถานะกลับเป็น Active
          if (index === AUTO_SCAN_INTERVALS.length - 1) {
            $('#auto-status').text('Active').css('color', 'green');
          }
        }, delay);
      });
    }); // 2. เมื่อเปลี่ยนตัวละคร (CHAT_CHANGED) - ให้โหลดค่าเซฟใหม่ทันที

    window.eventSource.on(window.event_types.CHAT_CHANGED, () => {
      console.log('[Popko] Character changed, reloading score...');
      setTimeout(() => {
        updateDisplay(); // โหลดคะแนนของตัวใหม่มาโชว์
      }, 500);
    });
  }

  $(document).ready(function () {
    setTimeout(() => {
      init();
      startListening();
      console.log('[Popko] V3.1 Loaded (Auto-scan enhanced)');
    }, 500);
  });
})();
