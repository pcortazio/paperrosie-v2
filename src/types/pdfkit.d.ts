declare module "pdfkit" {
  import type { Readable } from "node:stream";

  type PdfTextOptions = {
    align?: "left" | "center" | "right";
    continued?: boolean;
    width?: number;
  };

  export default class PDFDocument extends Readable {
    y: number;
    constructor(options?: { margin?: number; size?: string });
    fillColor(color: string): this;
    font(fontName: string): this;
    fontSize(size: number): this;
    moveDown(lines?: number): this;
    text(text: string, x?: number, y?: number, options?: PdfTextOptions): this;
    text(text: string, options?: PdfTextOptions): this;
    rect(x: number, y: number, width: number, height: number): this;
    stroke(color?: string): this;
    lineWidth(width: number): this;
    end(): void;
  }
}

declare module "pdfkit/js/pdfkit.standalone.js" {
  export { default } from "pdfkit";
}
