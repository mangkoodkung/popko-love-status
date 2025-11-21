(function () {
  // ตั้งค่าคะแนนเต็ม
  const MAX_SCORE = 200;

  // --- 1. CSS STYLE (สีม่วงอ่อน แบ๊วๆ + แก้ไขปุ่มหาย) ---
  const CSS_STYLE = `
        #popko-root {
            position: fixed;
            z-index: 2147483647 !important; /* อยู่บนสุดเสมอ */
            top: 0;
            left: 0;
            width: 0;
            height: 0;
        }
        
        /* ปุ่มหัวใจ (Toggle Button) */
        #love-toggle-btn {
            position: fixed;
            bottom: 80px; /* อยู่มุมขวาล่าง */
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #E0BBE4; /* ม่วงอ่อน */
            display: flex !important;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            border: 3px solid #957DAD; /* ขอบม่วงเข้ม */
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            z-index: 2147483647 !important;
            transition: transform 0.2s;
            user-select: none;
        }
        #love-toggle-btn:hover {
            transform: scale(1.1);
        }

        /* กล่องแสดงผล (Overlay) */
        #love-overlay {
            position: fixed;
            top: 100px;
            right: 20px;
            width: 240px;
            background: rgba(243, 230, 255, 0.95); /* ม่วงพาสเทลจางๆ */
            border: 3px solid #C3A7D6; /* ขอบม่วงกลาง */
            border-radius: 20px;
            padding: 15px;
            box-shadow: 0 8px 20px rgba(100, 80, 120, 0.4);
            z-index: 2147483646 !important;
            font-family: sans-serif;
        }

        /* กล่องหลอดพลัง */
        .love-bar-container {
            position: relative;
            height: 28px;
            background: #FFFFFF;
            border: 2px solid #D6B6E0;
            border-radius: 14px;
            overflow: hidden;
            margin: 10px 0;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }

        /* ตัวหลอดสี (Progress Bar) */
        #love-progress {
            height: 100%;
            background: linear-gradient(90deg, #FFC0CB, #D8BFD8, #9370DB); /* ชมพู -> ม่วง */
            width: 0%;
            transition: width 0.5s ease-out;
        }

        /* ตัวเลขเปอร์เซ็นต์ */
        #love-score-text {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            color: #5e4b8b; /* ม่วงเข้มอ่านง่าย */
            text-shadow: 0 0 2px #fff;
            z-index: 2;
        }

        /* ข้อความระดับความรัก */
        #love-level-text {
            text-align: center;
            font-size: 20px;
            font-weight: 900;
            color: #8A2BE2; /* BlueViolet */
            text-shadow: 1px 1px 0px #fff;
            margin-bottom: 5px;
        }

        /* สถานะ Auto-Scan */
        .status-text {
            font-size: 11px;
            color: #7B68EE;
            text-align: center;
            margin-top: 5px;
        }

        /* ปุ่ม Manual Check */
        #btn-force-scan {
            background: #F8F0FF !important;
            color: #8A2BE2 !important;
            border: 1px solid #C3A7D6 !important;
            border-radius: 10px;
            padding: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.2s;
        }
        #btn-force-scan:hover {
            background: #E6E6FA !important;
        }

        .hidden {
            display: none !important;
        }
    `;

  // --- 2. HELPER FUNCTIONS ---

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
  }

  // --- 3. HTML UI TEMPLATES ---

  const HTML_TEMPLATE = `
        <div id="popko-root">
            <div id="love-toggle-btn">💜</div>
            <div id="love-overlay" class="hidden">
                <div id="love-status-box">
                    <div id="love-level-text">...</div>
                    <div class="love-bar-container">
                        <div id="love-progress"></div>
                        <div id="love-score-text">0%</div>
                    </div>
                    <div class="status-text">
                        Auto-Scan: <span id="auto-status" style="font-weight:bold;">Active</span>
                    </div>
                    <div style="margin-top:10px;">
                        <button id="btn-force-scan" class="menu_button" style="width:100%;">
                            🔍 Check Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

  const SETTINGS_HTML = `
        <div id="popko-settings-panel" class="extension_block">
            <div class="extension_name">
                Popko Love Status (V4.6)
                <span style="float:right; cursor:pointer;" onclick="$(this).parent().next().slideToggle()">▼</span>
            </div>
            <div class="extension_content" style="display:none; padding: 10px;">
                <button id="menu-toggle-widget" class="menu_button" style="width:100%; margin-bottom:5px;">👁️ ซ่อน/แสดง Widget</button>
                <button id="menu-reset" class="menu_button" style="width:100%; background:#ffcccc; margin-bottom:5px;">🗑️ รีเซ็ตค่าตัวนี้</button>
                <button id="menu-show-history" class="menu_button" style="width:100%; background:#e0bbec;">📊 ดูประวัติคะแนน</button>
                <div id="score-history-list" style="display:none; margin-top:10px; max-height:200px; overflow-y:auto; background:rgba(0,0,0,0.2); padding:5px; border-radius:5px;"></div>
            </div>
        </div>
    `;

  // --- 4. CORE LOGIC ---

  function updateDisplay() {
    const score = getScore();
    const percent = Math.min(100, Math.max(0, (score / MAX_SCORE) * 100));

    const bar = document.getElementById('love-progress');
    const text = document.getElementById('love-score-text');
    const label = document.getElementById('love-level-text');

    if (bar) bar.style.width = `${percent}%`;
    if (text) text.innerText = `${Math.round(percent)}%`;

    if (label) {
      if (percent >= 90) label.innerHTML = `💍 คู่ชีวิต 💖`;
      else if (percent >= 70) label.innerHTML = `💖 คลั่งรัก 😍`;
      else if (percent >= 50) label.innerHTML = `💞 คนรัก ✨`;
      else if (percent >= 30) label.innerHTML = `😊 จีบ 💕`;
      else if (percent >= 10) label.innerHTML = `🤝 เพื่อน 😉`;
      else label.innerHTML = `😐 คนรู้จัก 💬`;
    }
  }

  function tryParseText(text) {
    if (!text) return false;
    // Regex รองรับ [LOVE: +10], [LOVE: -5], [AFFINITY: 20]
    const regex = /\[\s*(?:LOVE|AFFINITY)\s*[:=]\s*([+\-]?\s*\d+)\s*\]/i;
    const match = text.match(regex);

    if (match) {
      const points = parseInt(match[1].replace(/\s/g, ''), 10);
      if (!isNaN(points)) {
        console.log(`[Popko] Found points: ${points}`);
        setScore(getScore() + points);
        updateDisplay();
        if (typeof toastr !== 'undefined') {
          toastr.success(`Love Updated: ${points > 0 ? '+' : ''}${points}`);
        }
        return true;
      }
    }
    return false;
  }

  function performScan(manual = false) {
    let found = false;
    // 1. Scan DOM
    const msgs = document.querySelectorAll('.mes_text');
    if (msgs.length > 0) {
      found = tryParseText(msgs[msgs.length - 1].innerText);
    }
    // 2. Scan Variable (Fallback)
    if (!found && window.chat && window.chat.length > 0) {
      for (let i = window.chat.length - 1; i >= 0; i--) {
        if (!window.chat[i].is_user) {
          if (tryParseText(window.chat[i].mes)) {
            found = true;
            break;
          }
        }
      }
    }

    if (manual) alert(found ? '✅ เจอและอัปเดตแล้ว' : '❌ ไม่พบ Tag');
    return found;
  }

  // --- 5. HISTORY FEATURE ---
  function showHistory() {
    const list = $('#score-history-list');
    if (list.is(':visible')) {
      list.slideUp();
      return;
    }

    let html = '<ul style="list-style:none; padding:0; color:white; font-size:12px;">';
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('popko_love_')) {
        const name = key.replace('popko_love_', '').replace(/_/g, ' ');
        const val = parseInt(localStorage.getItem(key));
        const p = Math.round((val / MAX_SCORE) * 100);
        html += `<li style="border-bottom:1px solid #555; padding:3px;"><b>${name}</b>: ${p}%</li>`;
        count++;
      }
    }
    if (count === 0) html += '<li>ไม่พบประวัติ</li>';
    html += '</ul>';
    list.html(html).slideDown();
  }

  // --- 6. INITIALIZATION ---

  function init() {
    // Cleanup old elements
    $('#popko-root').remove();
    $('#popko-settings-panel').remove();
    $('#popko-style-tag').remove();

    // Inject CSS
    $('head').append(`<style id="popko-style-tag">${CSS_STYLE}</style>`);

    // Inject HTML
    $('body').append(HTML_TEMPLATE);

    // Inject Settings
    const settingsArea = $('#extensions_settings');
    if (settingsArea.length) {
      settingsArea.append(SETTINGS_HTML);
    }

    // Bind Events
    $('#love-toggle-btn').on('click', () => $('#love-overlay').toggleClass('hidden'));
    $('#btn-force-scan').on('click', () => {
      performScan(true);
      $('#auto-status').css('color', '#8A2BE2');
    });

    $('#menu-toggle-widget').on('click', () => {
      $('#love-toggle-btn').toggle();
      $('#love-overlay').addClass('hidden');
    });
    $('#menu-reset').on('click', () => {
      if (confirm('ล้างค่าตัวนี้?')) {
        setScore(0);
        updateDisplay();
      }
    });
    $('#menu-show-history').on('click', showHistory);

    // Drag Logic
    const btn = document.getElementById('love-toggle-btn');
    let isDown = false,
      offset = [0, 0];
    if (btn) {
      btn.addEventListener('mousedown', e => {
        isDown = true;
        offset = [btn.offsetLeft - e.clientX, btn.offsetTop - e.clientY];
      });
      document.addEventListener('mouseup', () => {
        isDown = false;
      });
      document.addEventListener('mousemove', e => {
        if (isDown) {
          btn.style.left = e.clientX + offset[0] + 'px';
          btn.style.top = e.clientY + offset[1] + 'px';
          btn.style.bottom = 'auto';
          btn.style.right = 'auto';
        }
      });
      // Touch support
      btn.addEventListener(
        'touchstart',
        e => {
          isDown = true;
          offset = [btn.offsetLeft - e.touches[0].clientX, btn.offsetTop - e.touches[0].clientY];
        },
        { passive: false },
      );
      document.addEventListener('touchend', () => {
        isDown = false;
      });
      document.addEventListener(
        'touchmove',
        e => {
          if (isDown) {
            e.preventDefault();
            btn.style.left = e.touches[0].clientX + offset[0] + 'px';
            btn.style.top = e.touches[0].clientY + offset[1] + 'px';
            btn.style.bottom = 'auto';
            btn.style.right = 'auto';
          }
        },
        { passive: false },
      );
    }

    // Start Observer
    startListening();
    updateDisplay();
    console.log('[Popko] V4.6 Loaded Successfully');
  }

  function startListening() {
    const chat = document.getElementById('chat');
    if (!chat) {
      setTimeout(startListening, 1000);
      return;
    }

    const observer = new MutationObserver(mutations => {
      $('#auto-status').text('Scanning...').css('color', 'orange');
      setTimeout(() => {
        performScan(false);
        $('#auto-status').text('Active').css('color', '#8A2BE2');
      }, 500);
    });

    observer.observe(chat, { childList: true, subtree: true });

    if (window.eventSource) {
      window.eventSource.on(window.event_types.CHAT_CHANGED, () => setTimeout(updateDisplay, 500));
    }
  }

  // Boot
  $(document).ready(() => setTimeout(init, 1000));
})();
