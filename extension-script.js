(function () {
  console.log('[Popko Love Status] Loaded!');

  // โหลด UI iframe
  function loadUI() {
    const iframe = document.createElement('iframe');
    iframe.src = 'index.html';
    iframe.style = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            height: 160px;
            border: none;
            z-index: 99999;
        `;
    document.body.appendChild(iframe);

    // ฟังข้อความจาก LLM
    window.addEventListener('st-message', ev => {
      const msg = ev.detail.message;

      const match = msg.match(/LOVE_CHANGE\s*([+-]?\d+)/i);
      if (match) {
        iframe.contentWindow.postMessage(
          {
            type: 'LOVE_CHANGE',
            value: Number(match[1]),
          },
          '*',
        );
      }
    });

    console.log('[Popko Love Status] UI Loaded');
  }

  // รอจน DOM โหลดครบ
  document.addEventListener('DOMContentLoaded', loadUI);
})();

(function () {
  // ชื่อ extension (ต้องไม่ซ้ำกับของคนอื่น)
  const EXT_ID = 'popko-love-status';

  // รอจน ST โหลดเสร็จ
  function waitForReady() {
    if (!window.addExtensionMenu) {
      return setTimeout(waitForReady, 300);
    }
    init();
  }

  function init() {
    console.log('[Popko Love Status] Extension Loaded');

    // เพิ่มเมนูในหน้า Extensions Panel
    window.addExtensionMenu({
      id: EXT_ID,
      title: 'Popko Love Status',
      type: 'custom',
      html: createMenuHTML(),
    });

    bindMenuEvents();
  }

  function createMenuHTML() {
    return `
            <div style="padding: 10px;">
                <h3 style="margin: 0 0 10px 0;">Popko Love Status</h3>

                <button id="love-reset-btn" class="menu-btn">รีเซ็ตค่า Love</button><br><br>

                <button id="love-toggle-btn" class="menu-btn">แสดง / ซ่อน overlay</button>
            </div>
        `;
  }

  function bindMenuEvents() {
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
  }

  waitForReady();
})();
