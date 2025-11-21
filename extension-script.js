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
