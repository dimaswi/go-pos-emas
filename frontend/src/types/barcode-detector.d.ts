// Type declarations for the BarcodeDetector API
// https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector

interface BarcodeDetectorOptions {
  formats?: BarcodeFormat[];
}

type BarcodeFormat =
  | "aztec"
  | "code_128"
  | "code_39"
  | "code_93"
  | "codabar"
  | "data_matrix"
  | "ean_13"
  | "ean_8"
  | "itf"
  | "pdf417"
  | "qr_code"
  | "upc_a"
  | "upc_e";

interface DetectedBarcode {
  boundingBox: DOMRectReadOnly;
  cornerPoints: { x: number; y: number }[];
  format: BarcodeFormat;
  rawValue: string;
}

interface BarcodeDetector {
  detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
}

declare var BarcodeDetector: {
  prototype: BarcodeDetector;
  new (options?: BarcodeDetectorOptions): BarcodeDetector;
  getSupportedFormats(): Promise<BarcodeFormat[]>;
};
