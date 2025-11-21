(function () {
  const EXT_ID = 'popko-love-status';

  // Namespace (ต้องใช้ global เท่านั้น)
  if (!window['extension_' + EXT_ID]) {
    window['extension_' + EXT_ID] = {};
  }

  const ext = window['extension_' + EXT_ID];

  // ต้องมี ไม่งั้น ST ไม่โชว์ panel
  ext.settings = {};

  // Load function ที่ ST เรียกแบบ legacy
  ext.load = function () {
    console.log('[Popko Love Status] Loaded (legacy mode)');

    if (typeof addExtensionMenu !== 'function') {
      console.warn('addExtensionMenu not found, ST version mismatch!');
      return;
    }

    addExtensionMenu({
      id: EXT_ID,
      title: 'Popko Love Status',
      description: 'Love Status Overlay Control Panel',
      html: `
                <div style="padding: 10px;">
                    <h3>Popko Love Status</h3>

                    <button id="love-reset-btn">รีเซ็ตค่าความรัก</button><br><br>
                    <button id="love-toggle-btn">ซ่อน/แสดง Overlay</button>
                </div>
            `,
    });
  };

  // Event handlers
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
