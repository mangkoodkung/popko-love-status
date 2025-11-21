(function () {
  const MAX_SCORE = 100; // คะแนนเต็ม

  // --- 1. ระบบจัดการข้อมูล (Data Manager) ---
  // ฟังก์ชันดึงค่าคะแนน (กันเหนียว: ถ้าค่าเพี้ยน ให้กลับเป็น 0 ทันที)
  function getAffinity() {
    let val = localStorage.getItem('popko_love_affinity');
    let num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  }

  function setAffinity(val) {
    // ล็อกค่าให้อยู่ระหว่าง 0 - 100
    if (val > MAX_SCORE) val = MAX_SCORE;
    if (val < 0) val = 0;
    localStorage.setItem('popko_love_affinity', val);
    return val;
  }

  // ฟังก์ชันดึงค่าการโชว์ปุ่ม (Visible State)
  function getWidgetVisible() {
    return localStorage.getItem('popko_widget_visible') !== 'false'; // Default true
  }

  // --- 2. HTML Templates ---

  // ส่วน Overlay (หน้าต่างลอย)
  const OVERLAY_HTML = `
        <div id="popko-wrapper">
            <div id="love-toggle-btn" title="คลิกเพื่อเปิด/ปิดสถานะ" style="${
              getWidgetVisible() ? '' : 'display:none;'
            }">💗</div>
            
            <div id="love-overlay" class="hidden">
                <div class="love-status-box">
                    <div id="love-level-text">Status Check...</div>
                    
                    <div class="love-bar" style="position: relative; background: #ffd1dc; height: 24px; border-radius: 12px; overflow: hidden; border: 2px solid #ff85b3; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                        <div id="love-progress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #ff9a9e 0%, #ff6a88 100%); transition: width 0.3s ease;"></div>
                        <div id="love-score-text" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; line-height: 22px; text-align: center; font-weight: bold; color: #fff; text-shadow: 1px 1px 2px #d6336c; font-size: 14px;">0%</div>
                    </div>

                    <div class="test-buttons" style="margin-top: 10px; display: flex; gap: 5px; justify-content: center;">
                        <button id="btn-love-add" class="menu_button" style="font-size: 10px; padding: 4px 10px;">+10</button>
                        <button id="btn-love-sub" class="menu_button" style="font-size: 10px; padding: 4px 10px;">-10</button>
                    </div>
                </div>
            </div>
        </div>
    `;

  // ส่วนเมนูใน Extension Panel
  const SETTINGS_HTML = `
        <div id="popko-love-settings" class="extension_block">
            <div class="extension_name">
                Popko Love Status
                <span style="float:right; cursor:pointer;" onclick="$(this).parent().next().slideToggle()">▼</span>
            </div>
            <div class="extension_content" style="display:none; padding: 10px;">
                <p style="margin-bottom: 10px; font-size: 14px;">ตั้งค่าการใช้งาน:</p>
                
                <button id="menu-toggle-widget" class="menu_button" style="width: 100%; margin-bottom: 5px; font-weight:bold;">
                    ${getWidgetVisible() ? '🔴 ซ่อนปุ่มหัวใจ' : '🟢 แสดงปุ่มหัวใจ'}
                </button>
                
                <button id="menu-reset-score" class="menu_button" style="width: 100%; background-color: #ffe6e6;">🗑️ รีเซ็ตค่าเป็น 0</button>
                
                <div style="margin-top:10px; font-size:12px; color:#888;">
                    วิธีใช้: ให้ AI พิมพ์ [LOVE: +10] หรือ [LOVE: -10] ท้ายประโยค
                </div>
            </div>
        </div>
    `;

  // --- 3. Core Logic (อัปเดตหน้าจอ) ---
  function updateUI() {
    let currentScore = getAffinity();

    // คำนวณ %
    let percent = (currentScore / MAX_SCORE) * 100;

    // อัปเดตหลอด
    const bar = document.getElementById('love-progress');
    const scoreText = document.getElementById('love-score-text');
    const levelText = document.getElementById('love-level-text');

    if (bar) {
      bar.style.width = percent + '%';
      scoreText.textContent = Math.round(percent) + '%';

      if (percent >= 100) levelText.textContent = '💍 คู่ชีวิต (Soulmate)';
      else if (percent >= 80) levelText.textContent = '💖 คลั่งรัก (Obsessed)';
      else if (percent >= 60) levelText.textContent = '🌹 คนรัก (Lover)';
      else if (percent >= 40) levelText.textContent = '💞 กำลังจีบ (Crush)';
      else if (percent >= 20) levelText.textContent = '😊 เพื่อน (Friend)';
      else levelText.textContent = '💔 เกลียด/เฉยๆ';
    }
  }

  // --- 4. Logic อ่านค่า AI (Regex + DOM) ---
  function parseTextAndAddScore(text, source) {
    // Regex แบบยืดหยุ่น: [LOVE: +10], [Affinity: -5], **[Love: +20]**
    const regex = /\[\s*(?:LOVE|AFFINITY)\s*[:=]\s*([+-]?\s*\d+)\s*\]/i;
    const match = text.match(regex);

    if (match) {
      // แปลงเป็นตัวเลขให้ชัวร์
      let rawNum = match[1].replace(/\s/g, '');
      let points = parseInt(rawNum, 10);

      if (!isNaN(points)) {
        console.log(`[Popko] AI Change: ${points} (Source: ${source})`);

        // คำนวณค่าใหม่
        let oldScore = getAffinity();
        let newScore = setAffinity(oldScore + points);

        updateUI();

        if (typeof toastr !== 'undefined') {
          toastr.success(`ความสัมพันธ์เปลี่ยน: ${points > 0 ? '+' : ''}${points}%`);
        }
        return true;
      }
    }
    return false;
  }

  function scanLastMessage() {
    let textToScan = '';
    let source = '';

    // 1. อ่านจากตัวแปร chat
    if (window.chat && window.chat.length > 0) {
      for (let i = window.chat.length - 1; i >= 0; i--) {
        if (!window.chat[i].is_user) {
          textToScan = window.chat[i].mes;
          source = 'Chat Variable';
          break;
        }
      }
    }

    // 2. ถ้าไม่มี อ่านจากหน้าจอ (DOM)
    if (!textToScan) {
      const els = document.querySelectorAll('.mes_text');
      if (els.length > 0) {
        textToScan = els[els.length - 1].innerText;
        source = 'DOM Element';
      }
    }

    if (textToScan) {
      parseTextAndAddScore(textToScan, source);
    }
  }

  // --- 5. Initialization (สร้างปุ่มและ Event) ---
  function initExtension() {
    // ล้างของเก่าทิ้ง
    $('#popko-wrapper').remove();
    $('#popko-love-settings').remove();

    // สร้าง UI ใหม่
    $('body').append(OVERLAY_HTML);

    // สร้าง Panel Menu (ถ้ามี container)
    const settingsContainer = $('#extensions_settings');
    if (settingsContainer.length > 0) {
      settingsContainer.append(SETTINGS_HTML);
    }

    // *** ผูก Event แบบ Global (แก้ปัญหาปุ่มกดไม่ติด) ***

    // 1. ปุ่มหัวใจลอย (Toggle Overlay)
    $(document)
      .off('click', '#love-toggle-btn')
      .on('click', '#love-toggle-btn', function () {
        $('#love-overlay').toggleClass('hidden');
      });

    // 2. ปุ่ม +10 (Manual Add)
    $(document)
      .off('click', '#btn-love-add')
      .on('click', '#btn-love-add', function () {
        let current = getAffinity();
        setAffinity(current + 10);
        updateUI();
      });

    // 3. ปุ่ม -10 (Manual Sub)
    $(document)
      .off('click', '#btn-love-sub')
      .on('click', '#btn-love-sub', function () {
        let current = getAffinity();
        setAffinity(current - 10);
        updateUI();
      });

    // 4. ปุ่มใน Extension Panel: ซ่อน/แสดง Widget
    $(document)
      .off('click', '#menu-toggle-widget')
      .on('click', '#menu-toggle-widget', function () {
        const btn = $('#love-toggle-btn');
        const isHidden = btn.is(':hidden');

        if (isHidden) {
          // สั่งเปิด
          btn.show();
          localStorage.setItem('popko_widget_visible', 'true');
          $(this).text('🔴 ซ่อนปุ่มหัวใจ');
        } else {
          // สั่งปิด
          btn.hide();
          $('#love-overlay').addClass('hidden'); // ปิดหน้าต่างด้วย
          localStorage.setItem('popko_widget_visible', 'false');
          $(this).text('🟢 แสดงปุ่มหัวใจ');
        }
      });

    // 5. ปุ่ม Reset
    $(document)
      .off('click', '#menu-reset-score')
      .on('click', '#menu-reset-score', function () {
        if (confirm('ยืนยันรีเซ็ตค่าความรัก?')) {
          setAffinity(0);
          updateUI();
        }
      });

    // ระบบลากปุ่ม (Drag)
    const dragBtn = document.getElementById('love-toggle-btn');
    if (dragBtn) {
      let isDragging = false,
        offsetX,
        offsetY;
      dragBtn.addEventListener('mousedown', e => {
        isDragging = true;
        const rect = dragBtn.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        dragBtn.style.cursor = 'grabbing';
      });
      document.addEventListener('mousemove', e => {
        if (!isDragging) return;
        e.preventDefault();
        dragBtn.style.left = e.clientX - offsetX + 'px';
        dragBtn.style.top = e.clientY - offsetY + 'px';
        dragBtn.style.right = 'auto';
        dragBtn.style.bottom = 'auto';
      });
      document.addEventListener('mouseup', () => {
        isDragging = false;
        dragBtn.style.cursor = 'grab';
      });
    }

    // โหลดค่าครั้งแรก
    updateUI();
  }

  // --- 6. AI Listener Start ---
  function startAIListener() {
    if (!window.eventSource) {
      setTimeout(startAIListener, 1000);
      return;
    }

    window.eventSource.on(window.event_types.MESSAGE_RECEIVED, () => {
      // รอ 1 วินาที แล้วสแกน
      setTimeout(scanLastMessage, 1000);
    });
  }

  // --- Entry Point ---
  $(document).ready(function () {
    // รอแป๊บนึงให้ ST โหลดเสร็จ
    setTimeout(() => {
      initExtension();
      startAIListener();
      console.log('[Popko] Extension Ready (Fixed Version)');
    }, 500);
  });
})();
