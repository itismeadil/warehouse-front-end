import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Upload, X, Check, AlertCircle, Loader2 } from "lucide-react";
import Tesseract from "tesseract.js";

const Spinner = () => (
  <div
    className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    style={{ color: "#45a1a1" }}
    aria-hidden
  />
);

export default function InvoiceScanner({ onScanComplete, onClose }) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState("");

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setExtractedData(null);
      setError("");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setExtractedData(null);
      setError("");
    }
  };

  const processImage = async () => {
    if (!image) return;

    setProcessing(true);
    setProgress(0);
    setError("");

    try {
      const result = await Tesseract.recognize(
        preview,
        "eng+ara", // Support both English and Arabic
        {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setProgress(Math.round(m.progress * 100));
            }
          },
        },
      );

      const extractedText = result.data.text;
      const parsedData = parseInvoiceText(extractedText);

      setExtractedData(parsedData);
    } catch (err) {
      console.error("OCR Error:", err);
      setError("Failed to process image. Please try a clearer image.");
    } finally {
      setProcessing(false);
    }
  };

  const parseInvoiceText = (text) => {
    // Simple parsing logic - can be enhanced based on your invoice format
    const lines = text.split("\n").filter((line) => line.trim());

    const data = {
      invoiceNumber: "",
      date: "",
      total: "",
      lineItems: [],
      rawText: text,
    };

    // Try to extract invoice number (common patterns)
    const invoicePatterns = [
      /invoice\s*[:#]?\s*([a-zA-Z0-9-]+)/i,
      /inv\s*[:#]?\s*([a-zA-Z0-9-]+)/i,
      /فاتورة\s*[:#]?\s*([a-zA-Z0-9-]+)/i,
    ];

    for (const pattern of invoicePatterns) {
      const match = text.match(pattern);
      if (match) {
        data.invoiceNumber = match[1];
        break;
      }
    }

    // Try to extract date
    const datePatterns = [
      /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/,
      /(\d{1,2}[-/]\d{1,2}[-/]\d{4})/,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        data.date = match[1];
        break;
      }
    }

    // Try to extract total amount
    const totalPatterns = [
      /total\s*[:]?\s*([0-9.,]+)/i,
      /الإجمالي\s*[:]?\s*([0-9.,]+)/i,
      /amount\s*[:]?\s*([0-9.,]+)/i,
    ];

    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.total = match[1].replace(/,/g, "");
        break;
      }
    }

    // Enhanced line item extraction - look for patterns with description, quantity, and price
    const lineItemPatterns = [
      // Pattern: Description followed by quantity and price
      /([a-zA-Z\u0600-\u06FF\s]+)\s+(\d+)\s*[x×]?\s*([0-9.,]+)/g,
      // Pattern: Item number/name, quantity, price
      /([a-zA-Z0-9-]+)\s+(\d+)\s*[x×]?\s*([0-9.,]+)/g,
      // Pattern: Just quantity and price
      /(\d+)\s*[x×]\s*([0-9.,]+)/g,
    ];

    // First try to extract detailed line items with descriptions
    const detailedPattern =
      /([a-zA-Z\u0600-\u06FF\s][a-zA-Z\u0600-\u06FF0-9\s]*)\s+(\d+)\s*[x×]?\s*([0-9.,]+)/g;
    let match;
    while ((match = detailedPattern.exec(text)) !== null) {
      const description = match[1].trim();
      const quantity = match[2];
      const price = match[3].replace(/,/g, "");

      // Only add if it looks like a valid item
      if (description.length > 2 && !isNaN(quantity) && !isNaN(price)) {
        data.lineItems.push({
          description: description,
          quantity: quantity,
          price: price,
        });
      }
    }

    // If no detailed items found, fall back to simple quantity × price patterns
    if (data.lineItems.length === 0) {
      const simplePattern = /(\d+)\s*[x×]\s*([0-9.,]+)/g;
      while ((match = simplePattern.exec(text)) !== null) {
        data.lineItems.push({
          description: "",
          quantity: match[1],
          price: match[2].replace(/,/g, ""),
        });
      }
    }

    // Try to extract tax/VAT information
    const taxPatterns = [
      /(?:tax|vat|الضريبة|ضريبة)\s*[:#]?\s*([0-9.,]+)%?/i,
      /(?:tax|vat|الضريبة|ضريبة)\s*[:#]?\s*([0-9.,]+)/i,
    ];

    for (const pattern of taxPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.taxRate = match[1].replace(/,/g, "");
        break;
      }
    }

    return data;
  };

  const handleApplyData = () => {
    if (extractedData && onScanComplete) {
      onScanComplete(extractedData);
      onClose();
    }
  };

  const handleReset = () => {
    setImage(null);
    setPreview(null);
    setExtractedData(null);
    setError("");
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite-900/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-graphite-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
              <Camera className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-graphite-900">
                Scan Invoice
              </h2>
              <p className="text-sm text-graphite-500">
                Upload an invoice image to extract data
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-graphite-400 hover:bg-graphite-100 hover:text-graphite-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {!preview ? (
            /* Upload Area */
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-graphite-300 rounded-xl p-8 text-center hover:border-primary-400 hover:bg-primary-50/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-graphite-100">
                <Upload className="h-6 w-6 text-graphite-500" />
              </div>
              <p className="text-sm font-medium text-graphite-900">
                Click to upload or drag and drop
              </p>
              <p className="mt-1 text-xs text-graphite-500">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          ) : (
            /* Preview & Processing */
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative">
                <img
                  src={preview}
                  alt="Invoice preview"
                  className="h-64 w-full rounded-lg object-contain bg-graphite-50"
                />
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute right-2 top-2 rounded-lg bg-white/90 p-2 text-graphite-600 shadow-sm hover:bg-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Processing Status */}
              {processing && (
                <div className="flex items-center gap-3 rounded-lg bg-primary-50 px-4 py-3">
                  <Spinner />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary-900">
                      Processing image...
                    </p>
                    <div className="mt-1 h-2 w-full rounded-full bg-primary-200">
                      <div
                        className="h-2 rounded-full bg-primary-600 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-primary-700">{progress}%</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-red-600 shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Extracted Data Preview */}
              {extractedData && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium text-green-900">
                      Data extracted successfully
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    {extractedData.invoiceNumber && (
                      <div className="flex justify-between">
                        <span className="text-green-700">Invoice Number:</span>
                        <span className="font-medium text-green-900">
                          {extractedData.invoiceNumber}
                        </span>
                      </div>
                    )}
                    {extractedData.date && (
                      <div className="flex justify-between">
                        <span className="text-green-700">Date:</span>
                        <span className="font-medium text-green-900">
                          {extractedData.date}
                        </span>
                      </div>
                    )}
                    {extractedData.total && (
                      <div className="flex justify-between">
                        <span className="text-green-700">Total:</span>
                        <span className="font-medium text-green-900">
                          {extractedData.total}
                        </span>
                      </div>
                    )}
                    {extractedData.taxRate && (
                      <div className="flex justify-between">
                        <span className="text-green-700">Tax Rate:</span>
                        <span className="font-medium text-green-900">
                          {extractedData.taxRate}%
                        </span>
                      </div>
                    )}
                    {extractedData.lineItems.length > 0 && (
                      <div>
                        <span className="text-green-700">Line Items:</span>
                        <div className="mt-1 space-y-1">
                          {extractedData.lineItems.map((item, idx) => (
                            <div
                              key={idx}
                              className="rounded bg-green-100 px-2 py-1"
                            >
                              {item.description && (
                                <div className="text-green-900 font-medium">
                                  {item.description}
                                </div>
                              )}
                              <div className="flex justify-between text-green-800">
                                <span>Qty: {item.quantity}</span>
                                <span>Price: {item.price}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!processing && !extractedData && (
                  <button
                    type="button"
                    onClick={processImage}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                    Extract Data
                  </button>
                )}

                {extractedData && (
                  <>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex-1 rounded-lg border border-graphite-300 px-4 py-2.5 text-sm font-medium text-graphite-700 hover:bg-graphite-50 transition-colors"
                    >
                      Scan Different
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyData}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      Apply Data
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
