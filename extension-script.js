// ใช้ระบบ Extension API แบบใหม่ของ SillyTavern

export function getSettings() {
  return {
    name: 'Popko Love Status',
    id: 'popko-love-status',
    description: 'Love Status Overlay Control Panel',
    version: '1.0.0',
  };
}

export function onLoad() {
  console.log('[Popko Love Status] Loaded!');

  addExtensionMenu({
    id: 'popko-love-status',
    title: 'Popko Love Status',
    description: 'Love Status Overlay Control Panel',
    html: `
            <div style="padding: 10px;">
                <h3 style="margin-top: 0;">Popko Love Status</h3>

                <button id="love-reset-btn" class="menu-btn">รีเซ็ตความสัมพันธ์</button>
                <br><br>

                <button id="love-toggle-btn" class="menu-btn">แสดง / ซ่อน Overlay</button>
            </div>
        `,
  });

  // Event ให้ปุ่มใน Panel
  document.addEventListener('click', e => {
    if (e.target.id === 'love-reset-btn') {
      if (window.resetLoveAffinity) window.resetLoveAffinity();
    }
    if (e.target.id === 'love-toggle-btn') {
      const box = document.querySelector('.love-status-box');
      if (box) {
        const hidden = box.style.display === 'none';
        box.style.display = hidden ? 'block' : 'none';
      }
    }
  });
}
