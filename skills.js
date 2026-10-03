/* Injected skills. Browser ports of exact-font-ocr-edit and exact-photo-swap. */
window.GGSkills = {
  font: {
    name: "exact-font-ocr-edit",
    sampleColor(ctx, box) {
      const [x, y, w, h] = box;
      const data = ctx.getImageData(Math.max(0, x), Math.max(0, y), Math.max(1, w), Math.max(1, h)).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 16) {
        r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
      }
      const hex = (v) => Math.round(v / Math.max(n, 1)).toString(16).padStart(2, "0");
      return `#${hex(r)}${hex(g)}${hex(b)}`;
    },
    async capture(file) {
      if (!window.Tesseract) throw new Error("OCR engine is still loading");
      const url = URL.createObjectURL(file);
      const result = await Tesseract.recognize(url, "eng");
      URL.revokeObjectURL(url);
      return (result.data.words || [])
        .filter((word) => word.text && word.text.trim() && word.confidence > 40)
        .map((word, index) => ({
          id: `ocr-${index}`,
          type: "text",
          text: word.text.trim(),
          x: word.bbox.x0,
          y: word.bbox.y0,
          w: word.bbox.x1 - word.bbox.x0,
          h: word.bbox.y1 - word.bbox.y0,
          size: Math.max(12, Math.round((word.bbox.y1 - word.bbox.y0) * 0.86)),
          weight: 600,
          color: "#171910",
          font: "Outfit",
          locked: true
        }));
    }
  },
  photo: {
    name: "exact-photo-swap",
    cover(img, w, h) {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      const scale = Math.max(w / img.width, h / img.height);
      const nw = img.width * scale;
      const nh = img.height * scale;
      ctx.drawImage(img, (w - nw) / 2, (h - nh) / 2, nw, nh);
      return canvas;
    }
  }
};
