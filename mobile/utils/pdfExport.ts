import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function generateAccountDataPdf(data: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  const text = JSON.stringify(data, null, 2);
  const lines = text.split("\n");
  let y = height - 40;
  for (const line of lines) {
    page.drawText(line, {
      x: 40,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    y -= fontSize + 2;
    if (y < 40) break;
  }
  return pdfDoc.save();
}
