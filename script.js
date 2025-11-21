let affinity = 0;

// อัปเดตหลอด
function updateLove() {
  const bar = document.getElementById('love-progress');
  const level = document.getElementById('love-level-text');
  const score = document.getElementById('love-score-text');

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

// ปุ่มทดสอบเดี๋ยวเอาออกทีหลัง
function changeAffinity(amount) {
  affinity += amount;
  updateLove();
}

// toggle overlay
const toggleBtn = document.getElementById('love-toggle-btn');
const overlay = document.getElementById('love-overlay');

toggleBtn.addEventListener('click', () => {
  overlay.classList.toggle('hidden');
});

// รองรับ LLM → postMessage
window.addEventListener('message', ev => {
  if (ev.data?.type === 'LOVE_CHANGE') {
    affinity += ev.data.value;
    updateLove();
  }
});

updateLove();

/* ========== ระบบลากปุ่มลอย (Drag Floating Button) ========== */
const dragBtn = document.getElementById('love-toggle-btn');

let offsetX = 0;
let offsetY = 0;
let isDragging = false;

dragBtn.addEventListener('mousedown', e => {
  isDragging = true;

  // ค่าที่เมาส์กดบนปุ่ม (เพื่อให้ปุ่มไม่กระโดด)
  offsetX = e.clientX - dragBtn.getBoundingClientRect().left;
  offsetY = e.clientY - dragBtn.getBoundingClientRect().top;
});

document.addEventListener('mousemove', e => {
  if (!isDragging) return;

  const x = e.clientX - offsetX;
  const y = e.clientY - offsetY;

  dragBtn.style.left = `${x}px`;
  dragBtn.style.top = `${y}px`;
  dragBtn.style.right = 'auto';
  dragBtn.style.bottom = 'auto';

  dragBtn.style.position = 'fixed';
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

// ===========================
//  SETTINGS UI FOR EXTENSION
// ===========================

// 1) สร้าง UI Settings
function createSettingsHTML() {
    return `
        <div class="extension-root">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>Popko Love Status</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>

                <div class="inline-drawer-content">
                    <div class="extension-content flex flexFlowColumn gap10px">

                        <div class="extension-content-item box-container">
                            <div class="flex flexFlowColumn">
                                <div class="settings-title-text">รีเซ็ตค่าความสัมพันธ์</div>
                                <div class="settings-title-description">ตั้งค่า affinity กลับไปเป็น 0</div>
                            </div>
                            <button class="menu-reset-btn">รีเซ็ต</button>
                        </div>

                        <div class="extension-content-item box-container">
                            <div class="flex flexFlowColumn">
                                <div class="settings-title-text">แสดง/ซ่อน Love Status</div>
                                <div class="settings-title-description">เปิดการแสดง Overlay Status</div>
                            </div>
                            <button class="menu-toggle-overlay">Toggle</button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    `;
}

// 2) นำ HTML ไปใส่ในหน้าต่าง Extensions
function createSettingsInterface() {
    if (document.getElementById("popko-love-status-settings")) return;

    const root = document.getElementById("extensions_settings");
    if (!root) return;

    const wrapper = document.createElement("div");
    wrapper.id = "popko-love-status-settings";
    wrapper.innerHTML = createSettingsHTML();

    root.appendChild(wrapper);
}

// 3) ฟังก์ชันเปิด/ปิด เมนูแบบ accordion
function bindCollapsibleEvents() {
    const drawer = document.querySelector("#popko-love-status-settings .inline-drawer-toggle");
    const content = document.querySelector("#popko-love-status-settings .inline-drawer-content");
    const icon = document.querySelector("#popko-love-status-settings .inline-drawer-icon");

    if (!drawer || !content) return;

    drawer.addEventListener("click", () => {
        const isOpen = content.style.display !== "none";
        if (isOpen) {
            content.style.display = "none";
            icon.classList.remove("down");
            icon.classList.add("right");
        } else {
            content.style.display = "block";
            icon.classList.remove("right");
            icon.classList.add("down");
        }
    });
}

// 4) Event เมนู
function bindMenuEvents() {
    // reset button
    const resetBtn = document.querySelector(".menu-reset-btn");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            affinity = 0;
            updateLoveBar();
            alert("รีเซ็ตสำเร็จ!");
        });
    }

    // toggle overlay
    const toggleOverlayBtn = document.querySelector(".menu-toggle-overlay");
    if (toggleOverlayBtn) {
        toggleOverlayBtn.addEventListener("click", () => {
            const box = document.querySelector(".love-status-box");
            if (!box) return;

            const isHidden = box.style.display === "none";
            box.style.display = isHidden ? "block" : "none";
        });
    }
}

// 5) init plugin
function initLoveStatusPlugin() {
    createSettingsInterface();
    bindCollapsibleEvents();
    bindMenuEvents();
}

// 6) ให้มันทำงานเมื่อเปิด SillyTavern
document.addEventListener("DOMContentLoaded", () => {
    initLoveStatusPlugin();
});
