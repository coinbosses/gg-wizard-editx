const KINDS = {
  staff: { line: "Staff access", role: "Role", unit: "Desk" },
  visitor: { line: "Visitor", role: "Host", unit: "Reception" },
  contractor: { line: "Contractor", role: "Trade", unit: "Site" },
  member: { line: "Member", role: "Tier", unit: "Club" },
  event: { line: "Event", role: "Pass", unit: "Gate" },
  campus: { line: "Campus", role: "Year", unit: "Faculty" }
};
const SIZES = { "cr80-land": { w: 1012, h: 638, label: "CR80 landscape · 300 dpi" }, "cr80-port": { w: 638, h: 1012, label: "CR80 portrait · 300 dpi" } };
const state = {
  kind: "staff", format: "cr80-land", template: "brass", side: "front",
  company: { name: "Northline Facilities", tag: "Staff access", color: "#2f4634", logo: null },
  staff: [{ name: "Ada Lopez", role: "Floor editor", dept: "Desk", no: "NL-1044", photo: null }],
  active: 0, selected: "name"
};
const canvas = document.querySelector("#card");
const ctx = canvas.getContext("2d");
const person = () => state.staff[state.active];
function blocks() {
  const p = person();
  const land = state.format === "cr80-land";
  const photo = land ? { x: 48, y: 78, w: 250, h: 430 } : { x: 70, y: 250, w: 498, h: 560 };
  if (state.side === "back") return [
    { id: "back-name", type: "text", text: p.name, x: 48, y: 80, size: 42, weight: 620, color: "#171910", font: "Fraunces" },
    { id: "back-note", type: "text", text: "Property of " + state.company.name + ". Return if found.", x: 48, y: 160, size: 22, weight: 400, color: "#3c4036", font: "Outfit" },
    { id: "barcode", type: "barcode", value: p.no, x: 48, y: 420, w: 520, h: 90 }
  ];
  return [
    { id: "company", type: "text", text: state.company.name, x: land ? 330 : 48, y: 72, size: 34, weight: 620, color: "#171910", font: "Fraunces" },
    { id: "tag", type: "text", text: state.company.tag, x: land ? 330 : 48, y: 122, size: 20, weight: 600, color: state.company.color, font: "Outfit" },
    { id: "name", type: "text", text: p.name, x: land ? 330 : 48, y: land ? 220 : 156, size: 40, weight: 620, color: "#171910", font: "Fraunces" },
    { id: "role", type: "text", text: p.role, x: land ? 330 : 48, y: land ? 276 : 210, size: 24, weight: 500, color: "#3c4036", font: "Outfit" },
    { id: "dept", type: "text", text: p.dept, x: land ? 330 : 48, y: land ? 316 : 248, size: 22, weight: 400, color: "#3c4036", font: "Outfit" },
    { id: "no", type: "text", text: p.no, x: land ? 330 : 48, y: land ? 410 : 860, size: 26, weight: 600, color: state.company.color, font: "Outfit" },
    { id: "photo", type: "photo", x: photo.x, y: photo.y, w: photo.w, h: photo.h },
    { id: "barcode", type: "barcode", value: p.no, x: land ? 330 : 48, y: land ? 490 : 920, w: 420, h: 70 }
  ];
}
function paper() { return { brass: "#f7f1e4", moss: "#eef3ee", ink: "#eceae4", paper: "#fbf7f0" }[state.template]; }
function drawBlock(c, b, sel) {
  if (b.type === "text") {
    c.fillStyle = b.color; c.font = b.weight + " " + b.size + "px " + b.font + ",sans-serif"; c.textBaseline = "top";
    c.fillText(b.text, b.x, b.y);
    if (sel) { c.strokeStyle = "#9c4a2c"; c.strokeRect(b.x - 4, b.y - 4, c.measureText(b.text).width + 8, b.size + 8); }
  }
  if (b.type === "photo") {
    c.fillStyle = "#243028"; c.fillRect(b.x, b.y, b.w, b.h);
    if (person().photo) c.drawImage(GGSkills.photo.cover(person().photo, b.w, b.h), b.x, b.y);
    c.strokeStyle = "#a68445"; c.lineWidth = 4; c.strokeRect(b.x, b.y, b.w, b.h);
  }
  if (b.type === "barcode") {
    let x = b.x; const seed = b.value || "NL";
    for (let i = 0; i < 48; i++) { const n = seed.charCodeAt(i % seed.length) + i; const bw = 3 + (n % 4); if (n % 3) { c.fillStyle = "#171910"; c.fillRect(x, b.y, bw, b.h); } x += bw + 2; }
  }
}
function render() {
  const list = blocks(); const size = SIZES[state.format];
  canvas.width = size.w; canvas.height = size.h;
  ctx.fillStyle = paper(); ctx.fillRect(0, 0, size.w, size.h);
  if (state.importImage && state.side === "front") ctx.drawImage(state.importImage, 0, 0, size.w, size.h);
  ctx.fillStyle = state.company.color; ctx.fillRect(0, 0, size.w, 18); ctx.fillRect(0, size.h - 18, size.w, 18);
  if (state.company.logo) ctx.drawImage(state.company.logo, size.w - 120, 32, 72, 72);
  list.forEach((b) => drawBlock(ctx, b, b.id === state.selected));
  (state.ocrWords || []).forEach((w) => { if (state.side !== "front") return; ctx.fillStyle = paper(); ctx.fillRect(w.x, w.y, w.w + 4, w.h + 2); drawBlock(ctx, w, w.id === state.selected); });
  document.querySelector("#stageLabel").textContent = KINDS[state.kind].line + " · " + size.label;
  const photo = list.find((b) => b.id === "photo");
  document.querySelector("#frameLabel").textContent = photo ? "Frame " + photo.w + " × " + photo.h : "No portrait on back";
  document.querySelector("#photoMeta").textContent = photo ? "Replacement fills " + photo.w + " × " + photo.h + " at the same origin." : "Switch to the front to swap the portrait.";
  document.querySelector("#roster").innerHTML = state.staff.map((s, i) => '<button type="button" class="staff' + (i === state.active ? " active" : "") + '" data-i="' + i + '"><strong>' + s.name + '</strong><br>' + s.no + "</button>").join("");
  const block = list.find((b) => b.id === state.selected) || (state.ocrWords || []).find((b) => b.id === state.selected);
  const el = document.querySelector("#inspector");
  if (!block || block.type !== "text") { el.textContent = block && block.type === "photo" ? "Portrait frame is fixed. Upload replaces it at the same size." : "Select a text block."; return; }
  el.innerHTML = '<label>Text <input id="editText" value="' + block.text.replace(/"/g, "") + '"></label><label>Size <input id="editSize" type="number" value="' + block.size + '"></label><label>Weight <input id="editWeight" type="number" value="' + block.weight + '"></label>';
  el.querySelector("#editText").oninput = (e) => { if (String(block.id).startsWith("ocr")) block.text = e.target.value; else writeText(block.id, e.target.value); render(); };
  el.querySelector("#editSize").oninput = (e) => { block.size = Number(e.target.value); render(); };
  el.querySelector("#editWeight").oninput = (e) => { block.weight = Number(e.target.value); render(); };
}
function writeText(id, value) {
  const p = person();
  if (id === "company") state.company.name = value;
  else if (id === "tag") state.company.tag = value;
  else if (id === "name" || id === "back-name") p.name = value;
  else if (id === "role") p.role = value;
  else if (id === "dept") p.dept = value;
  else if (id === "no") p.no = value;
  render();
}
canvas.addEventListener("pointerdown", (e) => {
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * (canvas.width / r.width);
  const y = (e.clientY - r.top) * (canvas.height / r.height);
  const list = blocks();
  for (let i = list.length - 1; i >= 0; i--) {
    const b = list[i];
    if ((b.type === "photo" && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) || (b.type === "text" && x >= b.x && y >= b.y && y <= b.y + b.size + 8)) { state.selected = b.id; render(); return; }
  }
});
document.querySelector("#roster").addEventListener("click", (e) => { const btn = e.target.closest(".staff"); if (!btn) return; state.active = Number(btn.dataset.i); render(); });
document.querySelector("#addStaff").onclick = () => { state.staff.push({ name: "New person", role: KINDS[state.kind].role, dept: KINDS[state.kind].unit, no: "NL-" + (1100 + state.staff.length), photo: null }); state.active = state.staff.length - 1; render(); };
document.querySelector("#kind").onchange = (e) => { state.kind = e.target.value; state.company.tag = KINDS[state.kind].line; document.querySelector("#companyTag").value = state.company.tag; render(); };
["companyName", "companyTag", "brandColor", "format", "template", "side"].forEach((id) => {
  document.querySelector("#" + id).oninput = document.querySelector("#" + id).onchange = (e) => {
    if (id === "companyName") state.company.name = e.target.value;
    if (id === "companyTag") state.company.tag = e.target.value;
    if (id === "brandColor") state.company.color = e.target.value;
    if (id === "format") state.format = e.target.value;
    if (id === "template") state.template = e.target.value;
    if (id === "side") state.side = e.target.value;
    render();
  };
});
function loadImage(file) { return new Promise((res) => { const img = new Image(); img.onload = () => res(img); img.src = URL.createObjectURL(file); }); }
document.querySelector("#logoInput").onchange = async (e) => { state.company.logo = await loadImage(e.target.files[0]); render(); };
document.querySelector("#photoInput").onchange = async (e) => { person().photo = await loadImage(e.target.files[0]); state.selected = "photo"; render(); };
document.querySelector("#importInput").onchange = async (e) => {
  const file = e.target.files[0];
  state.importImage = await loadImage(file); state.importFile = file; document.querySelector("#ocrBtn").disabled = false; document.querySelector("#ocrStatus").textContent = "Artwork loaded."; render();
};
document.querySelector("#ocrBtn").onclick = async () => {
  document.querySelector("#ocrStatus").textContent = "Reading words...";
  try { state.ocrWords = await GGSkills.font.capture(state.importFile); document.querySelector("#ocrStatus").textContent = state.ocrWords.length + " words captured."; render(); }
  catch (err) { document.querySelector("#ocrStatus").textContent = err.message; }
};
function download(c, name) { const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = name; a.click(); }
document.querySelector("#exportPng").onclick = () => { render(); download(canvas, person().no + "-" + state.kind + ".png"); };
document.querySelector("#exportUp").onclick = () => { render(); download(GGSkills.finish.upscale(canvas, 2), person().no + "-" + state.kind + "-2x.png"); };
render();
