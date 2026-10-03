const SIZES = {
  "cr80-land": { w: 1012, h: 638, label: "CR80 landscape · 85.6 × 54 mm · 300 dpi" },
  "cr80-port": { w: 638, h: 1012, label: "CR80 portrait · 54 × 85.6 mm · 300 dpi" }
};

const state = {
  format: "cr80-land",
  template: "brass",
  side: "front",
  company: { name: "Northline Facilities", tag: "Staff access", color: "#2f4634", logo: null },
  staff: [
    { id: "s1", name: "Ada Lopez", role: "Floor editor", dept: "Desk", no: "NL-1044", photo: null },
    { id: "s2", name: "Ibrahim Cole", role: "Site lead", dept: "Works", no: "NL-1088", photo: null }
  ],
  active: 0,
  selected: "name",
  importUrl: null,
  drawing: null,
  drag: null
};

const canvas = document.querySelector("#card");
const ctx = canvas.getContext("2d");

function person() { return state.staff[state.active]; }

function blocks() {
  const p = person();
  const land = state.format === "cr80-land";
  const photo = land ? { x: 48, y: 78, w: 250, h: 430 } : { x: 70, y: 250, w: 498, h: 560 };
  if (state.side === "back") {
    return [
      { id: "back-name", type: "text", text: p.name, x: 48, y: land ? 80 : 120, size: 42, weight: 620, color: "#171910", font: "Fraunces" },
      { id: "back-note", type: "text", text: "If found, return to the company desk.", x: 48, y: land ? 160 : 200, size: 24, weight: 400, color: "#3c4036", font: "Outfit" },
      { id: "back-no", type: "text", text: p.no, x: 48, y: land ? 240 : 280, size: 28, weight: 600, color: state.company.color, font: "Outfit" },
      { id: "barcode", type: "barcode", value: p.no, x: 48, y: land ? 420 : 760, w: land ? 520 : 520, h: 90 }
    ];
  }
  return [
    { id: "company", type: "text", text: state.company.name, x: land ? 330 : 48, y: land ? 78 : 78, size: land ? 36 : 34, weight: 620, color: "#171910", font: "Fraunces" },
    { id: "tag", type: "text", text: state.company.tag, x: land ? 330 : 48, y: land ? 128 : 124, size: 20, weight: 500, color: state.company.color, font: "Outfit" },
    { id: "name", type: "text", text: p.name, x: land ? 330 : 48, y: land ? 230 : 160, size: 40, weight: 620, color: "#171910", font: "Fraunces" },
    { id: "role", type: "text", text: p.role, x: land ? 330 : 48, y: land ? 286 : 214, size: 24, weight: 500, color: "#3c4036", font: "Outfit" },
    { id: "dept", type: "text", text: p.dept, x: land ? 330 : 48, y: land ? 326 : 252, size: 22, weight: 400, color: "#3c4036", font: "Outfit" },
    { id: "no", type: "text", text: p.no, x: land ? 330 : 48, y: land ? 420 : 860, size: 26, weight: 600, color: state.company.color, font: "Outfit" },
    { id: "photo", type: "photo", x: photo.x, y: photo.y, w: photo.w, h: photo.h },
    { id: "barcode", type: "barcode", value: p.no, x: land ? 330 : 48, y: land ? 500 : 920, w: land ? 420 : 520, h: 70 }
  ];
}

function paint(target, sideState) {
  const prev = state.side;
  if (sideState) state.side = sideState;
  const list = blocks();
  const { w, h } = SIZES[state.format];
  target.width = w;
  target.height = h;
  const c = target.getContext("2d");
  c.fillStyle = templatePaper();
  c.fillRect(0, 0, w, h);
  if (state.importUrl && state.side === "front") {
    // drawn later by caller if image ready; fallback paper
  }
  c.fillStyle = state.company.color;
  c.fillRect(0, 0, w, 18);
  c.fillRect(0, h - 18, w, 18);
  if (state.company.logo) {
    c.drawImage(state.company.logo, w - 120, 32, 72, 72);
  }
  list.forEach((block) => drawBlock(c, block, false));
  state.side = prev;
  return list;
}

function templatePaper() {
  return { brass: "#f7f1e4", moss: "#eef3ee", ink: "#eceae4", paper: "#fbf7f0" }[state.template] || "#f7f1e4";
}

function drawBlock(c, block, selected) {
  if (block.type === "text") {
    c.fillStyle = block.color;
    c.font = `${block.weight} ${block.size}px ${block.font}, sans-serif`;
    c.textBaseline = "top";
    c.fillText(block.text, block.x, block.y);
    if (selected) box(c, block.x - 6, block.y - 4, c.measureText(block.text).width + 12, block.size + 10);
  }
  if (block.type === "photo") {
    const p = person();
    c.fillStyle = "#243028";
    c.fillRect(block.x, block.y, block.w, block.h);
    if (p.photo) {
      const patch = GGSkills.photo.cover(p.photo, block.w, block.h);
      c.drawImage(patch, block.x, block.y);
    } else {
      c.fillStyle = "#c49a78";
      c.beginPath();
      c.ellipse(block.x + block.w / 2, block.y + block.h * 0.38, block.w * 0.22, block.h * 0.16, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.strokeStyle = "#a68445";
    c.lineWidth = 4;
    c.strokeRect(block.x, block.y, block.w, block.h);
    if (selected) box(c, block.x, block.y, block.w, block.h);
  }
  if (block.type === "barcode") {
    let x = block.x;
    const seed = block.value || "NL";
    for (let i = 0; i < 48; i++) {
      const n = seed.charCodeAt(i % seed.length) + i;
      const bw = 3 + (n % 4);
      if (n % 3 !== 0) {
        c.fillStyle = "#171910";
        c.fillRect(x, block.y, bw, block.h);
      }
      x += bw + 2;
    }
  }
}

function box(c, x, y, w, h) {
  c.save();
  c.strokeStyle = "#9c4a2c";
  c.lineWidth = 2;
  c.strokeRect(x, y, w, h);
  c.restore();
}

function render() {
  const list = blocks();
  const { w, h, label } = SIZES[state.format];
  canvas.width = w;
  canvas.height = h;
  ctx.fillStyle = templatePaper();
  ctx.fillRect(0, 0, w, h);
  if (state.importImage && state.side === "front") {
    ctx.drawImage(state.importImage, 0, 0, w, h);
  }
  ctx.fillStyle = state.company.color;
  ctx.fillRect(0, 0, w, 18);
  ctx.fillRect(0, h - 18, w, 18);
  if (state.company.logo) ctx.drawImage(state.company.logo, w - 120, 32, 72, 72);
  list.forEach((block) => drawBlock(ctx, block, block.id === state.selected));
  if (state.ocrWords && state.side === "front" && state.importImage) {
    state.ocrWords.forEach((word) => {
      ctx.fillStyle = templatePaper();
      ctx.fillRect(word.x, word.y, word.w + 4, word.h + 2);
      drawBlock(ctx, word, word.id === state.selected);
    });
  }
  document.querySelector("#stageLabel").textContent = label;
  const photo = list.find((b) => b.id === "photo");
  document.querySelector("#frameLabel").textContent = photo ? `Frame ${photo.w} × ${photo.h}px` : "Back has no portrait frame";
  document.querySelector("#photoMeta").textContent = photo
    ? `exact-photo-swap · ${photo.w} × ${photo.h} at ${photo.x},${photo.y}. Replacement fills this box only.`
    : "Switch to the front to swap the portrait.";
  renderRoster();
  renderInspector(list);
}

function renderRoster() {
  document.querySelector("#roster").innerHTML = state.staff.map((s, i) =>
    `<button type="button" class="staff${i === state.active ? " active" : ""}" data-i="${i}"><strong>${s.name}</strong><br>${s.no} · ${s.role}</button>`
  ).join("");
}

function renderInspector(list) {
  const block = list.find((b) => b.id === state.selected) || (state.ocrWords || []).find((b) => b.id === state.selected);
  const el = document.querySelector("#inspector");
  if (!block) {
    el.className = "empty";
    el.textContent = "Select a block on the card.";
    return;
  }
  el.className = "";
  if (block.type === "text") {
    el.innerHTML = `<label>Text <input id="editText" value="${escapeAttr(block.text)}" /></label>
      <label>Size <input id="editSize" type="number" value="${block.size}" /></label>
      <label>Weight <input id="editWeight" type="number" step="100" value="${block.weight}" /></label>
      <label>Color <input id="editColor" type="color" value="${toHex(block.color)}" /></label>
      <p class="meta">${block.font} · exact-font-ocr-edit keeps this craft on rewrite.</p>`;
    el.querySelector("#editText").oninput = (e) => {
      if (String(block.id).startsWith("ocr-")) {
        block.text = e.target.value;
        render();
      } else writeText(block.id, e.target.value);
    };
    el.querySelector("#editSize").oninput = (e) => { block.size = Number(e.target.value); render(); };
    el.querySelector("#editWeight").oninput = (e) => { block.weight = Number(e.target.value); render(); };
    el.querySelector("#editColor").oninput = (e) => { block.color = e.target.value; render(); };
  } else if (block.type === "photo") {
    el.innerHTML = `<p class="meta">Portrait frame ${block.w} × ${block.h}. Upload a replacement to remove the current image and fill the same box.</p>`;
  } else {
    el.innerHTML = `<p class="meta">Barcode follows the staff number.</p>`;
  }
}

function writeText(id, value) {
  const p = person();
  const map = { name: "name", role: "role", dept: "dept", no: "no", "back-name": "name", "back-no": "no" };
  if (id === "company") state.company.name = value;
  else if (id === "tag") state.company.tag = value;
  else if (map[id]) p[map[id]] = value;
  render();
}

function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
function toHex(color) {
  return color.startsWith("#") && color.length === 7 ? color : "#171910";
}

function hit(list, x, y) {
  for (let i = list.length - 1; i >= 0; i--) {
    const b = list[i];
    if (b.type === "photo" && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
    if (b.type === "text" && x >= b.x && x <= b.x + 420 && y >= b.y && y <= b.y + b.size + 8) return b;
  }
  return null;
}

canvas.addEventListener("pointerdown", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (canvas.width / rect.width);
  const y = (event.clientY - rect.top) * (canvas.height / rect.height);
  if (state.drawing) {
    state.drawing = { x, y };
    return;
  }
  const block = hit(blocks(), x, y);
  if (!block) return;
  state.selected = block.id;
  state.drag = { id: block.id, dx: x - block.x, dy: y - block.y };
  render();
});
canvas.addEventListener("pointerup", () => { state.drag = null; state.drawing = null; });

document.querySelector("#roster").addEventListener("click", (event) => {
  const btn = event.target.closest(".staff");
  if (!btn) return;
  state.active = Number(btn.dataset.i);
  render();
});
document.querySelector("#addStaff").onclick = () => {
  const n = state.staff.length + 1;
  state.staff.push({ id: `s${n}`, name: "New staff", role: "Role", dept: "Dept", no: `NL-${1100 + n}`, photo: null });
  state.active = state.staff.length - 1;
  render();
};
document.querySelector("#companyName").oninput = (e) => { state.company.name = e.target.value; render(); };
document.querySelector("#companyTag").oninput = (e) => { state.company.tag = e.target.value; render(); };
document.querySelector("#brandColor").oninput = (e) => { state.company.color = e.target.value; render(); };
document.querySelector("#format").onchange = (e) => { state.format = e.target.value; render(); };
document.querySelector("#template").onchange = (e) => { state.template = e.target.value; render(); };
document.querySelector("#side").onchange = (e) => { state.side = e.target.value; render(); };

function loadImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = URL.createObjectURL(file);
  });
}
document.querySelector("#logoInput").onchange = async (e) => {
  state.company.logo = await loadImage(e.target.files[0]);
  render();
};
document.querySelector("#photoInput").onchange = async (e) => {
  person().photo = await loadImage(e.target.files[0]);
  state.selected = "photo";
  render();
};
document.querySelector("#importInput").onchange = async (e) => {
  state.importImage = await loadImage(e.target.files[0]);
  state.importFile = e.target.files[0];
  document.querySelector("#ocrBtn").disabled = false;
  document.querySelector("#ocrStatus").textContent = "Artwork loaded. Capture words to edit them in place.";
  render();
};
document.querySelector("#ocrBtn").onclick = async () => {
  document.querySelector("#ocrStatus").textContent = "exact-font-ocr-edit is reading the card…";
  try {
    const words = await GGSkills.font.capture(state.importFile);
    state.ocrWords = words;
    document.querySelector("#ocrStatus").textContent = `${words.length} words captured. Edit a word in the inspector after selecting it.`;
    if (words[0]) state.selected = words[0].id;
    render();
  } catch (err) {
    document.querySelector("#ocrStatus").textContent = err.message;
  }
};

function download(canvasEl, name) {
  const a = document.createElement("a");
  a.href = canvasEl.toDataURL("image/png");
  a.download = name;
  a.click();
}
document.querySelector("#exportPng").onclick = () => {
  render();
  download(canvas, `${person().no}-${state.side}.png`);
};
document.querySelector("#exportSheet").onclick = () => {
  const sheet = document.createElement("canvas");
  const cols = 2;
  const { w, h } = SIZES[state.format];
  const rows = Math.ceil(state.staff.length * 2 / cols);
  sheet.width = cols * w + 40;
  sheet.height = rows * h + 40;
  const c = sheet.getContext("2d");
  c.fillStyle = "#f3eee4";
  c.fillRect(0, 0, sheet.width, sheet.height);
  let i = 0;
  state.staff.forEach((s, index) => {
    state.active = index;
    ["front", "back"].forEach((side) => {
      const tile = document.createElement("canvas");
      state.side = side;
      paint(tile);
      const col = i % cols;
      const row = Math.floor(i / cols);
      c.drawImage(tile, 20 + col * w, 20 + row * h);
      i++;
    });
  });
  download(sheet, "gg-wizard-editx-batch.png");
  render();
};

render();
