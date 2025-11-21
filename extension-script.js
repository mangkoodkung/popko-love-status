(function () {
  const PLUGIN_ID = 'popko-love-status';
  const MAX_SCORE = 100; // คะแนนเต็ม

  // 1. ดึงค่าความรักเดิม (ถ้ามี)
  let storedAffinity = localStorage.getItem('popko_love_affinity');
  let affinity = storedAffinity ? parseInt(storedAffinity) : 0;

  // 2. HTML ใหม่ (มีปุ่ม Scan แล้ว)
  const OVERLAY_HTML = `
        <div id="love-toggle-btn" title="Toggle Love Status">💗</div>
        <div id="love-overlay" class="hidden">
            <div class="love-status-box">
                <div id="love-level-text">Loading…</div>
                
                <div class="love-bar" style="position: relative; background: #ffd1dc; height: 24px; border-radius: 12px; overflow: hidden; border: 2px solid #ff85b3; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                    <div id="love-progress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #ff9a9e 0%, #ff6a88 100%); transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);"></div>
                    <div id="love-score-text" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; line-height: 22px; text-align: center; font-weight: bold; color: #fff; text-shadow: 1px 1px 2px #d6336c; font-size: 14px;">0%</div>
                </div>

                <div class="test-buttons" style="margin-top: 10px; display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">
                    <button id="btn-love-add" class="menu_button" style="font-size: 10px; padding: 2px 8px;">+10</button>
                    <button id="btn-love-sub" class="menu_button" style="font-size: 10px; padding: 2px 8px;">-10</button>
                    <button id="btn-love-reset" class="menu_button" style="font-size: 10px; padding: 2px 8px;">Reset</button>
                </div>
                
                <div style="margin-top:5px;">
                     <button id="btn-love-scan" class="menu_button" style="width:100%; font-size: 11px; background: #666; color:white; padding: 4px;">🔍 Force Scan Last Msg</button>
                </div>
            </div>
        </div>
    `;

  // --- ฟังก์ชันอัปเดตหน้าจอ ---
  function updateLoveUI() {
    const bar = document.getElementById('love-progress');
    const level = document.getElementById('love-level-text');
    const score = document.getElementById('love-score-text');
    if (!bar) return;

    localStorage.setItem('popko_love_affinity', affinity); // Save

    let percent = (affinity / MAX_SCORE) * 100;
    percent = Math.min(Math.max(percent, 0), 100);

    bar.style.width = percent + '%';
    score.textContent = Math.round(percent) + '%';

    if (percent >= 100) level.textContent = '💍 คู่ชีวิต (Soulmate)';
    else if (percent >= 80) level.textContent = '💖 คลั่งรัก (Obsessed)';
    else if (percent >= 60) level.textContent = '🌹 คนรัก (Lover)';
    else if (percent >= 40) level.textContent = '💞 กำลังจีบ (Crush)';
    else if (percent >= 20) level.textContent = '😊 เพื่อน (Friend)';
    else if (percent >= 0) level.textContent = '😐 คนรู้จัก (Neutral)';
    else level.textContent = '💔 เกลียด (Hated)';
  }

  // --- Logic แปลงข้อความ ---
  function parseAndChangeLove(text) {
    if (!text) return false;
    // Regex ที่ยืดหยุ่นขึ้น (รับเว้นวรรค และตัวใหญ่ตัวเล็ก)
    const regex = /\[\s*(?:LOVE|AFFINITY)\s*[:=]\s*([+-]?\s*\d+)\s*\]/i;
    const match = text.match(regex);

    if (match) {
      const points = parseInt(match[1].replace(/\s/g, ''));
      if (!isNaN(points)) {
        console.log(`[Popko] Found: ${points}%`);
        affinity += points;
        if (affinity > MAX_SCORE) affinity = MAX_SCORE;
        if (affinity < 0) affinity = 0;
        updateLoveUI();
        if (typeof toastr !== 'undefined') toastr.success(`Status Updated: ${points > 0 ? '+' : ''}${points}%`);
        return true;
      }
    }
    return false;
  }

  // --- ฟังก์ชันสร้างหน้าจอ (แก้ใหม่: ลบของเก่าทิ้งก่อนสร้าง) ---
  function initOverlay() {
    // ⚠️ ล้างของเก่าทิ้งให้หมดก่อน (สำคัญมาก)
    $('#love-toggle-btn').remove();
    $('#love-overlay').remove();
    $('#popko-love-wrapper').remove();

    // สร้างใหม่
    $('body').append(OVERLAY_HTML);

    // ผูกปุ่ม Toggle
    $('#love-toggle-btn').on('click', () => $('#love-overlay').toggleClass('hidden'));

    // ผูกปุ่ม Test
    $('#btn-love-add').on('click', () => {
      affinity = Math.min(affinity + 10, MAX_SCORE);
      updateLoveUI();
    });
    $('#btn-love-sub').on('click', () => {
      affinity = Math.max(affinity - 10, 0);
      updateLoveUI();
    });
    $('#btn-love-reset').on('click', () => {
      affinity = 0;
      updateLoveUI();
    });

    // ผูกปุ่ม SCAN (ตัวใหม่)
    $('#btn-love-scan').on('click', function () {
      // เอฟเฟกต์กดปุ่ม
      $(this).text('Scanning...');
      setTimeout(() => $(this).text('🔍 Force Scan Last Msg'), 1000);

      if (window.chat && window.chat.length > 0) {
        // หาข้อความล่าสุดที่ไม่ใช่ของ User
        let lastBotMsg = null;
        for (let i = window.chat.length - 1; i >= 0; i--) {
          if (!window.chat[i].is_user) {
            lastBotMsg = window.chat[i];
            break;
          }
        }

        if (lastBotMsg) {
          const found = parseAndChangeLove(lastBotMsg.mes);
          if (!found) {
            alert(`❌ ไม่เจอ Tag [LOVE: +/-N] ในข้อความล่าสุด:\n\n"${lastBotMsg.mes.substring(0, 100)}..."`);
          } else {
            alert(`✅ เจอแล้ว! อัปเดตค่าเรียบร้อย`);
          }
        } else {
          alert('❌ ไม่พบข้อความตอบกลับจากบอท');
        }
      } else {
        alert('❌ ไม่พบประวัติการแชท');
      }
    });

    // ระบบลากปุ่ม (Drag)
    const btn = document.getElementById('love-toggle-btn');
    let isDragging = false,
      offsetX,
      offsetY;
    if (btn) {
      btn.addEventListener('mousedown', e => {
        isDragging = true;
        const rect = btn.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        btn.style.cursor = 'grabbing';
      });
      document.addEventListener('mousemove', e => {
        if (!isDragging) return;
        e.preventDefault();
        btn.style.left = e.clientX - offsetX + 'px';
        btn.style.top = e.clientY - offsetY + 'px';
        btn.style.right = 'auto';
        btn.style.bottom = 'auto';
      });
      document.addEventListener('mouseup', () => {
        isDragging = false;
        btn.style.cursor = 'grab';
      });
    }

    updateLoveUI();
  }

  // --- เริ่มต้น ---
  function initAIListener() {
    if (!window.eventSource) {
      setTimeout(initAIListener, 1000);
      return;
    }
    window.eventSource.on(window.event_types.MESSAGE_RECEIVED, () => {
      setTimeout(() => {
        $('#btn-love-scan').click(); // สั่งกดปุ่ม Scan อัตโนมัติเมื่อมีข้อความเข้า
      }, 500);
    });
  }

  $(document).ready(function () {
    initOverlay();
    initAIListener();
    console.log('[Popko Love] Interface Force-Reloaded!');
  });
})();
