import { registerExtension } from '../../extensions.js';

registerExtension({
  name: 'popko-love-status',
  async setup() {
    console.log('Popko Love Status Loaded!');

    // โหลด UI เป็น iframe
    const iframe = document.createElement('iframe');
    iframe.src = '/extensions/popko-love-status/index.html';
    iframe.style = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0;
            height: 0;
            border: none;
            opacity: 0;
            pointer-events: none;
            z-index: -1;
        `;
    document.body.appendChild(iframe);

    // ฟังข้อความจาก LLM
    window.addEventListener('st-message', ev => {
      const msg = ev.detail.message;

      // ตรวจหา LOVE_CHANGE +XX
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
  },
});
