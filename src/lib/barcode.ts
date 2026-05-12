import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";

export function renderBarcodeSvg(value: string): string {
  // Render to a detached SVG node then return its outerHTML
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svg, value, {
    format: "CODE128",
    displayValue: true,
    fontSize: 14,
    height: 60,
    margin: 6,
  });
  return new XMLSerializer().serializeToString(svg);
}

function renderToCanvas(value: string, scale = 3): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, value, {
    format: "CODE128",
    displayValue: true,
    fontSize: 16,
    height: 80,
    margin: 8,
    width: scale,
  });
  return canvas;
}

export function downloadBarcodePng(sku: string, label?: string) {
  const canvas = renderToCanvas(sku, 3);
  // Add the product label above the barcode
  if (label) {
    const w = canvas.width;
    const h = canvas.height + 28;
    const wrap = document.createElement("canvas");
    wrap.width = w;
    wrap.height = h;
    const ctx = wrap.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#000";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label.slice(0, 60), w / 2, 20);
    ctx.drawImage(canvas, 0, 28);
    wrap.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `barcode-${sku}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
    return;
  }
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barcode-${sku}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

export function downloadBarcodePdf(sku: string, label?: string) {
  const canvas = renderToCanvas(sku, 3);
  const dataUrl = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [80, 50] });
  if (label) {
    pdf.setFontSize(10);
    pdf.text(label.slice(0, 40), 40, 8, { align: "center" });
  }
  // image position
  pdf.addImage(dataUrl, "PNG", 5, label ? 12 : 5, 70, 30);
  pdf.save(`barcode-${sku}.pdf`);
}

export function printBarcodes(items: { sku: string; name: string }[]) {
  const win = window.open("", "_blank", "width=800,height=600");
  if (!win) return;
  const blocks = items
    .map((it) => {
      const svg = renderBarcodeSvg(it.sku);
      return `<div class="lbl"><div class="nm">${it.name}</div>${svg}</div>`;
    })
    .join("");
  win.document.write(`<!doctype html><html><head><title>Barcodes</title>
    <style>
      @media print { @page { margin: 8mm; } }
      body { font-family: sans-serif; margin: 0; padding: 12px; }
      .lbl { display:inline-block; border:1px solid #ddd; padding:8px 10px; margin:6px; text-align:center; vertical-align:top; page-break-inside: avoid; }
      .nm { font-size: 12px; font-weight:600; margin-bottom:4px; max-width:220px; word-wrap:break-word; }
      svg { display:block; margin:0 auto; }
    </style></head><body>${blocks}
    <script>window.onload = () => setTimeout(() => window.print(), 250);</script>
    </body></html>`);
  win.document.close();
}
