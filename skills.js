window.GGSkills = {
  font: {
    async capture(file) {
      const url = URL.createObjectURL(file);
      const result = await Tesseract.recognize(url, "eng");
      URL.revokeObjectURL(url);
      return (result.data.words || []).filter((w) => w.text && w.confidence > 40).map((w, i) => ({
        id: "ocr-" + i, type: "text", text: w.text.trim(), x: w.bbox.x0, y: w.bbox.y0,
        w: w.bbox.x1 - w.bbox.x0, h: w.bbox.y1 - w.bbox.y0,
        size: Math.max(12, Math.round((w.bbox.y1 - w.bbox.y0) * 0.86)),
        weight: 600, color: "#171910", font: "Outfit"
      }));
    }
  },
  photo: {
    cover(img, w, h) {
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const x = c.getContext("2d");
      const s = Math.max(w / img.width, h / img.height);
      x.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s);
      return c;
    }
  },
  finish: {
    upscale(source, scale) {
      const out = document.createElement("canvas");
      out.width = source.width * scale;
      out.height = source.height * scale;
      const c = out.getContext("2d");
      c.imageSmoothingEnabled = true;
      c.imageSmoothingQuality = "high";
      c.drawImage(source, 0, 0, out.width, out.height);
      const img = c.getImageData(0, 0, out.width, out.height);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.max(0, Math.min(255, (d[i] - 128) * 1.06 + 128));
        d[i + 1] = Math.max(0, Math.min(255, (d[i + 1] - 128) * 1.06 + 128));
        d[i + 2] = Math.max(0, Math.min(255, (d[i + 2] - 128) * 1.06 + 128));
      }
      c.putImageData(img, 0, 0);
      return out;
    }
  }
};
