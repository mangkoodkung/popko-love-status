(function () {
  const MAX_SCORE = 100;

  // --- Helper Functions ---
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

  // --- HTML Templates ---
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
                        <button id="btn-force-scan" style="width:100%; background:#888;">🔍 Check</button>
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
                <button id="menu-reset" class="menu_button" style="width:100%; background:#ffcccc;">🗑️ รีเซ็ต 0</button>
            </div>
        </div>
    `;

  // --- Display ---
  function updateDisplay() {
    const score = getScore();
    const percent = (score / MAX_SCORE) * 100;
    const bar = document.getElementById('love-progress');
    const text = document.getElementById('love-score-text');
    const label = document.getElementById('love-level-text');

    if (bar && text && label) {
      bar.style.width = `${percent}%`;
      text.innerText = `${Math.round(percent)}%`;

      if (percent >= 100) label.innerText = '💍 คู่ชีวิต';
      else if (percent >= 80) label.innerText = '💖 คลั่งรัก';
      else if (percent >= 60) label.innerText = '🌹 คนรัก';
      else if (percent >= 40) label.innerText = '💞 จีบ';
      else if (percent >= 20) label.innerText = '😊 เพื่อน';
      else label.innerText = '😐 คนรู้จัก';
    }
  }

  // --- Scanner ---
  function tryParseText(text) {
    if (!text) return false;
    const regex = /\[\s*(?:LOVE|AFFINITY)\s*[:=]\s*([+\-]?\s*\d+)\s*\]/i;
    const match = text.match(regex);
    if (match) {
      const points = parseInt(match[1].replace(/\s/g, ''), 10);
      if (!isNaN(points)) {
        console.log(`[Popko] Points: ${points}`);
        setScore(getScore() + points);
        updateDisplay();
        if (typeof toastr !== 'undefined') toastr.success(`Love: ${points > 0 ? '+' : ''}${points}%`);
        return true;
      }
    }
    return false;
  }

  function performScan(isManual = false) {
    let found = false;
    // 1. DOM
    const domMsgs = document.querySelectorAll('.mes_text');
    if (domMsgs.length > 0) {
      found = tryParseText(domMsgs[domMsgs.length - 1].innerText);
    }
    // 2. Variable
    if (!found && window.chat && window.chat.length > 0) {
      for (let i = window.chat.length - 1; i >= 0; i--) {
        if (!window.chat[i].is_user) {
          found = tryParseText(window.chat[i].mes);
          break;
        }
      }
    }
    if (isManual) alert(found ? '✅ เจอแล้ว!' : '❌ ไม่พบ Tag [LOVE]');
  }

  // --- Drag System (Mouse + Touch) ---
  function makeDraggable(element) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    // 1. Mouse Events
    element.addEventListener('mousedown', e => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = element.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      element.style.cursor = 'grabbing';
    });

    // 2. Touch Events (สำหรับมือถือ)
    element.addEventListener(
      'touchstart',
      e => {
        isDragging = true;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        const rect = element.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;
      },
      { passive: false },
    );

    // Move Handler (Shared)
    const onMove = (clientX, clientY) => {
      if (!isDragging) return;
      const dx = clientX - startX;
      const dy = clientY - startY;

      // ใช้ Fixed Position แบบคำนวณจาก Top/Left แทน Bottom/Right
      element.style.position = 'fixed';
      element.style.left = `${initialLeft + dx}px`;
      element.style.top = `${initialTop + dy}px`;
      element.style.right = 'auto';
      element.style.bottom = 'auto';
    };

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
          e.preventDefault(); // กันหน้าจอเลื่อน
          const touch = e.touches[0];
          onMove(touch.clientX, touch.clientY);
        }
      },
      { passive: false },
    );

    // End Handler
    const onEnd = () => {
      isDragging = false;
      element.style.cursor = 'grab';
    };
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);
  }

  // --- Init ---
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
    $('#btn-force-scan').on('click', () => performScan(true));

    // Menu Panel
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
      if (confirm('Reset?')) {
        setScore(0);
        updateDisplay();
      }
    });

    // Apply Dragging
    const btn = document.getElementById('love-toggle-btn');
    if (btn) makeDraggable(btn);

    updateDisplay();
  }

  // --- Listener ---
  function startListening() {
    if (!window.eventSource) {
      setTimeout(startListening, 1000);
      return;
    }
    window.eventSource.on(window.event_types.MESSAGE_RECEIVED, () => {
      setTimeout(() => performScan(false), 2000);
    });
  }

  $(document).ready(function () {
    setTimeout(() => {
      init();
      startListening();
      console.log('[Popko] Mobile Ready.');
    }, 500);
  });
})();
