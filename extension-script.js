(function () {
  // *** ปรับค่า MAX_SCORE เป็น 200 (ความรักจะขึ้นยากขึ้น 2 เท่า) ***
  const MAX_SCORE = 200; // --- 1. CSS Style (ฟรุ้งฟริ้ง แบ๊วกรุบ) ---

  const CSS_STYLE = `
        #popko-root {
            position: fixed;
            z-index: 9999;
            top: 50px;
            right: 10px;
            touch-action: none;
        }
        #love-toggle-btn {
            width: 40px; /* เพิ่มขนาดปุ่ม */
            height: 40px;
            border-radius: 50%;
            background: #FFB3D9; /* ชมพูอ่อน */
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            cursor: grab;
            border: 2px solid #FF80A6; /* ขอบเข้มขึ้น */
            box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        }
        #love-overlay {
            position: absolute;
            right: 0;
            top: 50px;
            width: 220px; 
            background: rgba(255, 255, 255, 0.9); /* พื้นหลังขาวกึ่งโปร่งใส */
            border: 3px solid #FF80A6; /* ขอบชมพูเข้ม */
            border-radius: 15px; /* โค้งมนมากขึ้น */
            padding: 12px;
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
        }
        .love-bar-container {
            position: relative;
            height: 25px; /* เพิ่มความหนา */
            background: #FDEEF4; /* พื้นหลังหลอดสีชมพูอ่อนมาก */
            border: 1px solid #FFC0CB;
            border-radius: 12px; 
            overflow: hidden;
            margin: 8px 0; /* เพิ่มระยะห่าง */
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.1); 
        }
        #love-progress {
            height: 100%;
            background: linear-gradient(90deg, #FF99CC, #FF5C99); /* ไล่สีชมพูสดใส */
            transition: width 0.8s ease-out; /* ทำให้แถบเลื่อนดู Smooth มากขึ้น */
        }
        #love-score-text {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            text-align: center;
            line-height: 25px;
            color: white; /* ตัวเลขเปอร์เซ็นต์สีขาว */
            font-weight: bold;
            text-shadow: 1px 1px 2px #FF5C99; /* เพิ่มเงาสีชมพู */
            font-size: 14px;
        }
        #love-level-text {
            text-align: center;
            font-size: 18px;
            font-weight: 800; /* เน้นความหนา */
            color: #FF69B4; /* สีชมพู Hot Pink */
            text-shadow: 0 0 5px rgba(255, 105, 180, 0.5); /* เพิ่มเงาฟรุ้งฟริ้ง */
            margin-bottom: 5px;
        }
        .status-text {
            color: #888; /* สีเทาอ่อนสำหรับสถานะ */
            font-size: 11px;
            margin-top: 5px;
            text-align: center;
        }
        #btn-force-scan {
            background: #FFD9EB !important; /* พื้นหลังปุ่มชมพูอ่อน */
            color: #FF5C99 !important; /* ตัวอักษรสีชมพูเข้ม */
            border: 1px solid #FF80A6 !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            font-weight: bold;
        }
        .hidden {
            display: none !important;
        }
    `; // --- 2. ระบบจัดการชื่อตัวละครและเซฟ (เหมือน V4.1) --- // ... getCurrentCharKey(), getScore(), setScore() เหมือนเดิม

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
  } // --- 3. HTML Templates (ปรับปรุงเพื่อให้ UI สวยขึ้น) ---

  const HTML_TEMPLATE = `
        <div id="popko-root">
            <div id="love-toggle-btn">💖</div>
            <div id="love-overlay" class="hidden">
                <div class="love-status-box">
                    <div id="love-level-text">...</div>
                    <div class="love-bar-container">
                        <div id="love-progress"></div>
                        <div id="love-score-text">0%</div>
                    </div>
                    <div class="status-text">
                        Auto-Scan: <span id="auto-status" style="color:#FF5C99;">Active</span>
                    </div>
                    <div style="margin-top:8px;">
                        <button id="btn-force-scan" class="menu_button" style="width:100%; padding: 6px;">
                            🔍 Manual Check
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `; // Settings Panel (ใช้ HTML เดิมของ V4.1)
  const SETTINGS_PANEL_HTML = `
        <div id="popko-settings-panel" class="extension_block">
            <div class="extension_name">
                Popko Love Status (V4.2)
                <span style="float:right; cursor:pointer;" onclick="$(this).parent().next().slideToggle()">▼</span>
            </div>
            <div class="extension_content" style="display:none; padding: 10px;">
                <button id="menu-toggle-widget" class="menu_button" style="width:100%; margin-bottom:5px;">👁️ ซ่อน/แสดง ปุ่ม</button>
                <button id="menu-reset" class="menu_button" style="width:100%; background:#ffcccc; margin-bottom:10px;">🗑️ รีเซ็ตค่า (ตัวนี้)</button>
                <button id="menu-show-history" class="menu_button" style="width:100%; background:#cceeff; margin-bottom:10px;">📊 ดูประวัติคะแนน</button>
                <div id="score-history-list" style="display:none;"></div>
            </div>
        </div>
    `; // --- 4. Display Logic (ปรับเกณฑ์ระดับความรักให้ขึ้นยากขึ้น) ---

  function updateDisplay() {
    const score = getScore();
    const percent = (score / MAX_SCORE) * 100;

    const bar = document.getElementById('love-progress');
    const text = document.getElementById('love-score-text');
    const label = document.getElementById('love-level-text');

    if (bar && text && label) {
      bar.style.width = `${percent}%`;
      text.innerText = `${Math.round(percent)}%`; // ปรับเกณฑ์ระดับความรักใหม่ (ใช้ MAX_SCORE = 200) // ถ้าค่า MAX_SCORE เปลี่ยน เปอร์เซ็นต์ตรงนี้จะยังคงทำงานได้

      if (percent >= 90) label.innerHTML = `💍 **คู่ชีวิต** 💖`;
      else if (percent >= 70) label.innerHTML = `💖 **คลั่งรัก** 🌹`;
      else if (percent >= 50) label.innerHTML = `💞 **คนรัก** ✨`;
      else if (percent >= 30) label.innerHTML = `😊 **จีบ** 💕`;
      else if (percent >= 10) label.innerHTML = `🤝 **เพื่อน** 😉`;
      else label.innerHTML = `😐 **คนรู้จัก** 💬`;
    }
  } // --- 5. Scanning Logic (เหมือน V4.1) --- // ... tryParseText() และ performScan() เหมือนเดิม (รองรับค่าบวกและลบอยู่แล้ว)

  function tryParseText(text) {
    if (!text) return false; // Regex นี้รองรับทั้ง +10 และ -5 อยู่แล้ว
    const regex = /\[\s*(?:LOVE|AFFINITY)\s*[:=]\s*([+\-]?\s*\d+)\s*\]/i;
    const match = text.match(regex);

    if (match) {
      const numStr = match[1].replace(/\s/g, '');
      const points = parseInt(numStr, 10); // ถ้าเป็น -5, points จะเป็น -5

      if (!isNaN(points)) {
        console.log(`[Popko] ✅ Auto-detected: ${points}. Updating score.`);

        let current = getScore();
        setScore(current + points);
        updateDisplay();

        if (typeof toastr !== 'undefined') {
          // แสดงแจ้งเตือนชัดเจนว่าเพิ่มหรือลด
          const icon = points > 0 ? '💖' : '💔';
          toastr.success(`${icon} Love Updated: ${points > 0 ? '+' : ''}${points} Points`);
        }
        return true;
      }
    }
    return false;
  }
  function performScan(isManual = false) {
    let found = false;
    const domMsgs = document.querySelectorAll('.mes_text');
    if (domMsgs.length > 0) {
      const lastMsg = domMsgs[domMsgs.length - 1].innerText;
      found = tryParseText(lastMsg);
    }
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
  } // --- 6. Init และ History Logic (เหมือน V4.1) ---

  function getSavedCharacterScores() {
    const scores = [];
    const prefix = 'popko_love_';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const charNameKey = key.substring(prefix.length);
        const charName = charNameKey.replace(/_/g, ' ');
        const scoreValue = parseInt(localStorage.getItem(key), 10);
        const percent = Math.round((scoreValue / MAX_SCORE) * 100);
        scores.push({ name: charName, score: scoreValue, percent: percent, key: key });
      }
    }
    scores.sort((a, b) => b.percent - a.percent);
    return scores;
  }

  function displayScoreHistory() {
    const historyContainer = $('#score-history-list');
    const scores = getSavedCharacterScores();
    if (historyContainer.is(':visible')) {
      historyContainer.slideUp();
      $('#menu-show-history').text('📊 ดูประวัติคะแนน');
      return;
    }
    let html = '';
    if (scores.length === 0) {
      html = '<p style="font-size:12px; color:#aaa; text-align:center;">ยังไม่มีคะแนนตัวละครที่บันทึกไว้</p>';
    } else {
      html += '<ul style="list-style:none; padding:0; margin-top:5px;">';
      scores.forEach(item => {
        html += `
            <li style="border-bottom: 1px solid #ffc0cb; padding: 5px 0;">
                <div style="font-weight: bold; font-size: 13px; color: #FF69B4;">${item.name}</div>
                <div style="font-size: 11px; color: #333;">
                    💖 ${item.percent}% (${item.score}/${MAX_SCORE})
                </div>
            </li>
        `;
      });
      html += '</ul>';
    }
    historyContainer.html(html).slideDown();
    $('#menu-show-history').text('❌ ปิดประวัติคะแนน');
  }

  function init() {
    $('#popko-root').remove();
    $('#popko-settings-panel').remove();
    $('head').append('<style id="popko-style">' + CSS_STYLE + '</style>');
    $('body').append(HTML_TEMPLATE);
    if ($('#extensions_settings').length) $('#extensions_settings').append(SETTINGS_PANEL_HTML); // Events

    $('#love-toggle-btn').on('click', () => $('#love-overlay').toggleClass('hidden'));
    $('#btn-force-scan').on('click', () => {
      performScan(true);
      $('#auto-status').css('color', '#FF5C99'); // ให้กลับมาเป็นสีชมพู
    });
    $('#menu-show-history').on('click', displayScoreHistory); // ... (ส่วน Event อื่นๆ และ Drag Logic เหมือนเดิม)
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
  } // --- 7. Event Listeners (Mutation Observer) --- // ... startListening() เหมือน V4.1

  function startListening() {
    const chatContainer = document.getElementById('chat');
    if (!chatContainer) {
      setTimeout(startListening, 1000);
      return;
    }
    let scanTimeout = null;
    const observer = new MutationObserver((mutationsList, observer) => {
      if (scanTimeout) clearTimeout(scanTimeout);
      $('#auto-status').text('Scanning...').css('color', 'orange');
      scanTimeout = setTimeout(() => {
        performScan(false);
        $('#auto-status').text('Active').css('color', '#FF5C99'); // สีชมพูแทนสีเขียว
      }, 300);
    });
    observer.observe(chatContainer, {
      childList: true,
      subtree: true,
    });
    if (window.eventSource) {
      window.eventSource.on(window.event_types.CHAT_CHANGED, () => {
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
      console.log('[Popko] V4.2 Loaded (Cute UI, Harder Love Logic)');
    }, 500);
  });
})();
