const KINDS = {
  staff: { line: "Staff access", role: "Role", unit: "Desk" },
  visitor: { line: "Visitor", role: "Host", unit: "Reception" },
  contractor: { line: "Contractor", role: "Trade", unit: "Site" },
  member: { line: "Member", role: "Tier", unit: "Club" },
  event: { line: "Event", role: "Pass", unit: "Gate" },
  campus: { line: "Campus", role: "Year", unit: "Faculty" }
};
const SIZES = {
  "cr80-land": { w: 1012, h: 638, label: "CR80 landscape 300 dpi" },
  "cr80-port": { w: 638, h: 1012, label: "CR80 portrait 300 dpi" }
};
const state = {
  kind: "staff",
  format: "cr80-land",
  template: "brass",
  side: "front",
  company: { name: "Northline Facilities", tag: "Staff access", color: "#2f4634", logo: null },
  staff: [{ name: "Ada Lopez", role: "Floor editor", dept: "Desk", no: "NL-1044", photo: null }],
  active: 0,
  selected: "name",
  offsets: {},
  drag: null
};
const canvas = document.querySelector("#card");
const ctx = canvas.getContext("2d");
const person = () => state.staff[state.active];

function baseBlocks() {
  const p = person();
  const land = state.format === "cr80-land";
  const photo = land ? { x: 48, y: 78, w: 250, h: 430 } : { x: 70, y: 250, w: 498, h: 560 };
  if (state.side === "back") {
    return [
      { id: "back-name", type: "text", field: "name", text: p.name, x: 48, y: 80, size: 42, weight: 620, color: "#171910", font: "Fraunces" },
      { id: "back-note", type: "text", field: "note", text: "Property of " + state.company.name + ". Return if found.", x: 48, y: 160, size: 22, weight: 400, color: "#3c4036", font: "Outfit" },
      { id: "back-no", type: "text", field: "no", text: p.no, x: 48, y: 240, size: 28, weight: 600, color: state.company.color, font: "Outfit" },
      { id: "barcode", type: "barcode", value: p.no, x: 48, y: 420, w: 520, h: 90 }
    ];
  }
  return [
    { id: "company", type: "text", field: "company", text: state.company.name, x: land ? 330 : 48, y: 72, size: 34, weight: 620, color: "#171910", font: "Fraunces" },
    { id: "tag", type: "text", field: "tag", text: state.company.tag, x: land ? 330 : 48, y: 122, size: 20, weight: 600, color: state.company.color, font: "Outfit" },
    { id: "name", type: "text", field: "name", text: p.name, x: land ? 330 : 48, y: land ? 220 : 156, size: 40, weight: 620, color: "#171910", font: "Fraunces" },
    { id: "role", type: "text", field: "role", text: p.role, x: land ? 330 : 48, y: land ? 276 : 210, size: 24, weight: 500, color: "#3c4036", font: "Outfit" },
    { id: "dept", type: "text", field: "dept", text: p.dept, x: land ? 330 : 48, y: land ? 316 : 248, size: 22, weight: 400, color: "#3c4036", font: "Outfit" },
    { id: "no", type: "text", field: "no", text: p.no, x: land ? 330 : 48, y: land ? 410 : 860, size: 26, weight: 600, color: state.company.color, font: "Outfit" },
    { id: "photo", type: "photo", x: photo.x, y: photo.y, w: photo.w, h: photo.h },
    { id: "barcode", type: "barcode", value: p.no, x: land ? 330 : 48, y: land ? 490 : 920, w: 420, h: 70 }
  ];
}

function blocks() {
  return baseBlocks().map((block) => {
    const moved = state.offsets[state.side + ":" + block.id];
    return moved ? Object.assign({}, block, moved) : block;
  });
}

function paper() {
  return { brass: "#f7f1e4", moss: "#eef3ee", ink: "#eceae4", paper: "#fbf7f0" }[state.template];
}

function drawBlock(c, b, sel) {
  if (b.type === "text") {
    c.fillStyle = b.color;
    c.font = b.weight + " " + b.size + "px " + b.font + ", sans-serif";
    c.textBaseline = "top";
    c.fillText(b.text || "", b.x, b.y);
    if (sel) {
      c.strokeStyle = "#9c4a2c";
      c.strokeRect(b.x - 4, b.y - 4, Math.max(40, c.measureText(b.text || "").width + 8), b.size + 8);
    }
  }
  if (b.type === "photo") {
    c.fillStyle = "#243028";
    c.fillRect(b.x, b.y, b.w, b.h);
    if (person().photo) c.drawImage(GGSkills.photo.cover(person().photo, b.w, b.h), b.x, b.y);
    c.strokeStyle = "#a68445";
    c.lineWidth = 4;
    c.strokeRect(b.x, b.y, b.w, b.h);
    if (sel) {
      c.strokeStyle = "#9c4a2c";
      c.strokeRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6);
    }
  }
  if (b.type === "barcode") {
    let x = b.x;
    const seed = b.value || "NL";
    for (let i = 0; i < 48; i++) {
      const n = seed.charCodeAt(i % seed.length) + i;
      const bw = 3 + (n % 4);
      if (n % 3) {
        c.fillStyle = "#171910";
        c.fillRect(x, b.y, bw, b.h);
      }
      x += bw + 2;
    }
  }
}

function paint() {
  const list = blocks();
  const size = SIZES[state.format];
  canvas.width = size.w;
  canvas.height = size.h;
  ctx.fillStyle = paper();
  ctx.fillRect(0, 0, size.w, size.h);
  if (state.importImage && state.side === "front") ctx.drawImage(state.importImage, 0, 0, size.w, size.h);
  ctx.fillStyle = state.company.color;
  ctx.fillRect(0, 0, size.w, 18);
  ctx.fillRect(0, size.h - 18, size.w, 18);
  if (state.company.logo) ctx.drawImage(state.company.logo, size.w - 120, 32, 72, 72);
  list.forEach((b) => drawBlock(ctx, b, b.id === state.selected));
  (state.ocrWords || []).forEach((w) => {
    if (state.side !== "front") return;
    ctx.fillStyle = paper();
    ctx.fillRect(w.x, w.y, w.w + 4, w.h + 2);
    drawBlock(ctx, w, w.id === state.selected);
  });
  document.querySelector("#stageLabel").textContent = KINDS[state.kind].line + " / " + size.label;
  const photo = list.find((b) => b.id === "photo");
  document.querySelector("#frameLabel").textContent = photo ? "Frame " + photo.w + " x " + photo.h : "No portrait on back";
  document.querySelector("#photoMeta").textContent = photo
    ? "Replacement fills " + photo.w + " x " + photo.h + " at the same origin."
    : "Switch to the front to swap the portrait.";
  document.querySelector("#roster").innerHTML = state.staff.map((s, i) =>
    '<button type="button" class="staff' + (i === state.active ? " active" : "") + '" data-i="' + i + '"><strong>' + s.name + "</strong><br>" + s.no + "</button>"
  ).join("");
}

function writeField(field, value) {
  const p = person();
  if (field === "company") state.company.name = value;
  else if (field === "tag") state.company.tag = value;
  else if (field === "note") state.note = value;
  else if (field) p[field] = value;
  document.querySelector("#companyName").value = state.company.name;
  document.querySelector("#companyTag").value = state.company.tag;
  paint();
}

function showInspector() {
  const list = blocks();
  const block = list.find((b) => b.id === state.selected) || (state.ocrWords || []).find((b) => b.id === state.selected);
  const el = document.querySelector("#inspector");
  if (!block || block.type !== "text") {
    el.textContent = block && block.type === "photo" ? "Portrait frame is fixed. Upload replaces it at the same size. Drag it to move the frame." : "Select a text block on the card.";
    return;
  }
  el.innerHTML = '<label>Text <input id="editText" value="' + String(block.text).replace(/"/g, "") + '"></label><label>Size <input id="editSize" type="number" value="' + block.size + '"></label><label>Weight <input id="editWeight" type="number" step="100" value="' + block.weight + '"></label><label>Color <input id="editColor" type="color" value="' + (String(block.color).startsWith("#") ? block.color : "#171910") + '"></label>';
  el.querySelector("#editText").oninput = (e) => {
    if (String(block.id).startsWith("ocr")) block.text = e.target.value;
    else writeField(block.field, e.target.value);
  };
  el.querySelector("#editSize").oninput = (e) => {
    state.offsets[state.side + ":" + block.id] = Object.assign({}, state.offsets[state.side + ":" + block.id], { size: Number(e.target.value) });
    paint();
  };
  el.querySelector("#editWeight").oninput = (e) => {
    state.offsets[state.side + ":" + block.id] = Object.assign({}, state.offsets[state.side + ":" + block.id], { weight: Number(e.target.value) });
    paint();
  };
  el.querySelector("#editColor").oninput = (e) => {
    state.offsets[state.side + ":" + block.id] = Object.assign({}, state.offsets[state.side + ":" + block.id], { color: e.target.value });
    paint();
  };
}

function render() {
  paint();
  showInspector();
}

function point(event) {
  const rect = canvas.getBoundingClientRect();
  return [
    (event.clientX - rect.left) * (canvas.width / rect.width),
    (event.clientY - rect.top) * (canvas.height / rect.height)
  ];
}

function hit(x, y) {
  const list = blocks();
  for (let i = list.length - 1; i >= 0; i--) {
    const b = list[i];
    if (b.type === "photo" && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
    if (b.type === "text" && x >= b.x && x <= b.x + 460 && y >= b.y && y <= b.y + b.size + 10) return b;
  }
  return null;
}

canvas.addEventListener("pointerdown", (event) => {
  const [x, y] = point(event);
  const block = hit(x, y);
  if (!block) return;
  state.selected = block.id;
  state.drag = { id: block.id, dx: x - block.x, dy: y - block.y };
  canvas.setPointerCapture(event.pointerId);
  showInspector();
  paint();
});
canvas.addEventListener("pointermove", (event) => {
  if (!state.drag) return;
  const [x, y] = point(event);
  state.offsets[state.side + ":" + state.drag.id] = Object.assign({}, state.offsets[state.side + ":" + state.drag.id], {
    x: Math.round(x - state.drag.dx),
    y: Math.round(y - state.drag.dy)
  });
  paint();
});
canvas.addEventListener("pointerup", () => { state.drag = null; });

document.querySelector("#roster").addEventListener("click", (event) => {
  const btn = event.target.closest(".staff");
  if (!btn) return;
  state.active = Number(btn.dataset.i);
  render();
});
document.querySelector("#addStaff").onclick = () => {
  const kind = KINDS[state.kind];
  state.staff.push({ name: "New person", role: kind.role, dept: kind.unit, no: "NL-" + (1100 + state.staff.length), photo: null });
  state.active = state.staff.length - 1;
  render();
};
document.querySelector("#removeStaff").onclick = () => {
  if (state.staff.length === 1) return;
  state.staff.splice(state.active, 1);
  state.active = Math.max(0, state.active - 1);
  render();
};
document.querySelector("#kind").onchange = (event) => {
  state.kind = event.target.value;
  state.company.tag = KINDS[state.kind].line;
  document.querySelector("#companyTag").value = state.company.tag;
  render();
};
document.querySelector("#companyName").oninput = (event) => { state.company.name = event.target.value; paint(); };
document.querySelector("#companyTag").oninput = (event) => { state.company.tag = event.target.value; paint(); };
document.querySelector("#brandColor").oninput = (event) => { state.company.color = event.target.value; paint(); };
document.querySelector("#format").onchange = (event) => { state.format = event.target.value; render(); };
document.querySelector("#template").onchange = (event) => { state.template = event.target.value; paint(); };
document.querySelector("#side").onchange = (event) => { state.side = event.target.value; render(); };

function loadImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = URL.createObjectURL(file);
  });
}
document.querySelector("#logoInput").onchange = async (event) => {
  state.company.logo = await loadImage(event.target.files[0]);
  paint();
};
document.querySelector("#photoInput").onchange = async (event) => {
  person().photo = await loadImage(event.target.files[0]);
  state.selected = "photo";
  render();
};
document.querySelector("#importInput").onchange = async (event) => {
  const file = event.target.files[0];
  state.importImage = await loadImage(file);
  state.importFile = file;
  document.querySelector("#ocrBtn").disabled = false;
  document.querySelector("#ocrStatus").textContent = "Artwork loaded.";
  paint();
};
document.querySelector("#ocrBtn").onclick = async () => {
  document.querySelector("#ocrStatus").textContent = "Reading words...";
  try {
    state.ocrWords = await GGSkills.font.capture(state.importFile);
    document.querySelector("#ocrStatus").textContent = state.ocrWords.length + " words captured. Select one on the card to edit it.";
    paint();
  } catch (err) {
    document.querySelector("#ocrStatus").textContent = err.message;
  }
};
function download(target, name) {
  const a = document.createElement("a");
  a.href = target.toDataURL("image/png");
  a.download = name;
  a.click();
}
document.querySelector("#exportPng").onclick = () => { paint(); download(canvas, person().no + "-" + state.kind + ".png"); };
document.querySelector("#exportUp").onclick = () => { paint(); download(GGSkills.finish.upscale(canvas, 2), person().no + "-" + state.kind + "-2x.png"); };
render();
