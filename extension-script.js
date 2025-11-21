(function () {
  const EXT_ID = 'popko-love-status';

  // สร้าง namespace ของ extension
  if (!window['extension_' + EXT_ID]) {
    window['extension_' + EXT_ID] = {};
  }

  const ext = window['extension_' + EXT_ID];

  // =============================
  // ส่วนที่ต้องมี! สำคัญมาก!
  // =============================
  ext.settings = {}; // ถ้าไม่ใส่ Panel จะไม่ขึ้น
  // =============================

  // ฟังก์ชัน load() ถูกเรียกโดย SillyTavern
  ext.load = function () {
    console.log('[Popko Love Status] Loaded!');

    addExtensionMenu({
      id: EXT_ID,
      title: 'Popko Love Status',
      description: 'Love Status Overlay',
      html: settingsUI(),
    });
  };

  // UI Panel HTML
  function settingsUI() {
    return `
            <div style="padding: 10px;">
                <h4>Popko Love Status</h4>
                <button id="love-reset-btn">รีเซ็ต</button><br><br>
                <button id="love-toggle-btn">ซ่อน/แสดง Overlay</button>
            </div>
        `;
  }

  // จัดการปุ่มใน Panel
  document.addEventListener('click', e => {
    if (e.target.id === 'love-reset-btn') {
      if (window.resetLoveAffinity) window.resetLoveAffinity();
    }
    if (e.target.id === 'love-toggle-btn') {
      const box = document.querySelector('.love-status-box');
      if (box) {
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
      }
    }
  });
})();
