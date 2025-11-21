(function () {
  // ตั้งชื่อ ID ให้ไม่ซ้ำใคร
  const PLUGIN_ID = 'popko-love-status';

  // 1. HTML ของ Overlay (ปุ่มหัวใจลอย + แถบเลือด)
  // เราเขียนเป็น String ใส่ตัวแปรไว้เลย ไม่ต้องแยกไฟล์
  const OVERLAY_HTML = `
        <div id="love-toggle-btn" title="Toggle Love Status">💗</div>
        <div id="love-overlay" class="hidden">
            <div class="love-status-box">
                <div id="love-level-text">Loading…</div>
                <div class="love-bar">
                    <div id="love-progress"></div>
                </div>
                <div id="love-score-text">0</div>
                <div class="test-buttons">
                    <button id="btn-love-add" class="menu_button">+10</button>
                    <button id="btn-love-sub" class="menu_button">-10</button>
                </div>
            </div>
        </div>
    `;

  // ตัวแปรเก็บค่าความรัก
  let affinity = 0;

  // ฟังก์ชันอัปเดตหน้าจอ
  function updateLoveUI() {
    const bar = document.getElementById('love-progress');
    const level = document.getElementById('love-level-text');
    const score = document.getElementById('love-score-text');

    if (!bar) return;

    let percent = Math.min(Math.max((affinity / 2000) * 100, 0), 100);
    bar.style.width = percent + '%';
    score.textContent = affinity;

    if (affinity >= 2000) level.textContent = '💍 คู่ครอง';
    else if (affinity >= 500) level.textContent = '🌹 คนรัก';
    else if (affinity >= 100) level.textContent = '💞 แอบชอบ';
    else if (affinity >= 20) level.textContent = '🧑‍🤝‍🧑 เพื่อน';
    else if (affinity >= 0) level.textContent = '😊 รู้จัก';
    else level.textContent = '😞 ลดลง';
  }

  // ฟังก์ชันสร้างหน้าต่างลอย (Overlay)
  function initOverlay() {
    if ($('#love-toggle-btn').length > 0) return; // ถ้ามีแล้วไม่ต้องสร้างซ้ำ

    $('body').append(OVERLAY_HTML); // ยัด HTML ลง body

    // ผูก Event ปุ่มต่างๆ
    $('#love-toggle-btn').on('click', function () {
      $('#love-overlay').toggleClass('hidden');
    });

    $('#btn-love-add').on('click', function () {
      affinity += 10;
      updateLoveUI();
    });

    $('#btn-love-sub').on('click', function () {
      affinity -= 10;
      updateLoveUI();
    });

    updateLoveUI();

    // ทำให้ปุ่มลากได้ (Drag logic)
    const btn = document.getElementById('love-toggle-btn');
    let isDragging = false,
      offsetX,
      offsetY;

    btn.addEventListener('mousedown', e => {
      isDragging = true;
      offsetX = e.clientX - btn.getBoundingClientRect().left;
      offsetY = e.clientY - btn.getBoundingClientRect().top;
      btn.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', e => {
      if (!isDragging) return;
      btn.style.left = e.clientX - offsetX + 'px';
      btn.style.top = e.clientY - offsetY + 'px';
      btn.style.right = 'auto'; // ล้างค่า right/bottom
      btn.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      btn.style.cursor = 'grab';
    });
  }

  // ฟังก์ชันสร้างเมนูในหน้า Extension (เลียนแบบ kencuo)
  function createSettingsMenu() {
    // เช็คว่ามีกล่อง Extension Settings ของ ST หรือยัง
    const extensionsSettings = $('#extensions_settings');
    if (extensionsSettings.length === 0) return;

    // เช็คว่าเมนูของเราเคยสร้างไปหรือยัง
    if ($('#popko-love-settings').length > 0) return;

    // HTML ของเมนู
    const menuHTML = `
            <div id="popko-love-settings" class="extension_block">
                <div class="extension_name">
                    Popko Love Status
                    <span style="float:right; cursor:pointer;" onclick="$(this).parent().next().slideToggle()">▼</span>
                </div>
                <div class="extension_content" style="display:none; padding: 10px;">
                    <p>ควบคุมสถานะความรัก</p>
                    <button id="popko-reset-btn" class="menu_button">รีเซ็ตค่าเป็น 0</button>
                </div>
            </div>
        `;

    // ยัดเมนูเข้าไปต่อท้าย
    extensionsSettings.append(menuHTML);

    // ผูกปุ่มรีเซ็ต
    $(document).on('click', '#popko-reset-btn', function () {
      affinity = 0;
      updateLoveUI();
      alert('รีเซ็ตค่าความรักแล้ว!');
    });
  }

  // --- จุดเริ่มต้นการทำงาน (Entry Point) ---
  $(document).ready(function () {
    console.log('[Popko] Extension Loading...');
    initOverlay(); // สร้างหน้าต่างลอย
    createSettingsMenu(); // สร้างเมนู
  });
})();
