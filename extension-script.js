(function () {
  const EXT_ID = 'popko-love-status';

  // Namespace ของ extension (จำเป็น)
  if (!window['extension_' + EXT_ID]) {
    window['extension_' + EXT_ID] = {};
  }

  const ext = window['extension_' + EXT_ID];

  // ต้องมี! ถึงจะขึ้น Panel
  ext.settings = {};

  // ฟังก์ชัน load() ถูก SillyTavern เรียกตอนเริ่มโหลด extension
  ext.load = function () {
    console.log('[Popko Love Status] Extension Loaded');

    // เพิ่มเมนูเข้า Extension Panel
    addExtensionMenu({
      id: EXT_ID,
      title: 'Popko Love Status',
      description: 'Love Status Overlay Control Panel',
      html: createPanelHTML(),
    });
  };

  // HTML ของ Panel
  function createPanelHTML() {
    return `
            <div style="padding: 10px;">
                <h3 style="margin-top: 0;">Popko Love Status</h3>

                <button id="love-reset-btn" class="menu-btn">รีเซ็ตความสัมพันธ์</button>
                <br><br>

                <button id="love-toggle-btn" class="menu-btn">แสดง / ซ่อน Overlay</button>
            </div>
        `;
  }

  // Event ให้ปุ่มใน Panel
  document.addEventListener('click', e => {
    if (e.target.id === 'love-reset-btn') {
      if (window.resetLoveAffinity) {
        window.resetLoveAffinity();
        console.log('[Popko] Reset affinity');
      }
    }

    if (e.target.id === 'love-toggle-btn') {
      const box = document.querySelector('.love-status-box');
      if (box) {
        const hidden = box.style.display === 'none';
        box.style.display = hidden ? 'block' : 'none';
      }
    }
  });
})();
