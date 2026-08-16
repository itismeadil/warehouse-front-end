import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Camera,
  Upload,
  X,
  Check,
  AlertCircle,
  Loader2,
  Edit2,
  RotateCcw,
} from "lucide-react";
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
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState(null);
  const [imageQuality, setImageQuality] = useState(null);
  const [ocrConfidence, setOcrConfidence] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setExtractedData(null);
      setError("");
      setImageQuality(null);
      setOcrConfidence(null);
      setIsEditing(false);
      setEditableData(null);
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
      setImageQuality(null);
      setOcrConfidence(null);
      setIsEditing(false);
      setEditableData(null);
    }
  };

  const assessImageQuality = (imgElement) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;
      ctx.drawImage(imgElement, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Calculate brightness and contrast
      let totalBrightness = 0;
      let maxBrightness = 0;
      let minBrightness = 255;

      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        totalBrightness += brightness;
        maxBrightness = Math.max(maxBrightness, brightness);
        minBrightness = Math.min(minBrightness, brightness);
      }

      const avgBrightness = totalBrightness / (data.length / 4);
      const contrast = maxBrightness - minBrightness;

      // Calculate resolution score
      const resolution = canvas.width * canvas.height;
      const resolutionScore = Math.min(resolution / (1920 * 1080), 1);

      // Calculate overall quality score
      const brightnessScore = 1 - Math.abs(avgBrightness - 128) / 128;
      const contrastScore = Math.min(contrast / 200, 1);
      const overallScore =
        brightnessScore * 0.3 + contrastScore * 0.4 + resolutionScore * 0.3;

      resolve({
        score: overallScore,
        brightness: avgBrightness,
        contrast: contrast,
        resolution: resolution,
        recommendation:
          overallScore < 0.5 ? "low" : overallScore < 0.7 ? "medium" : "high",
      });
    });
  };

  const processImage = async () => {
    if (!image) return;

    setProcessing(true);
    setProgress(0);
    setError("");

    try {
      // Assess image quality first
      const img = new Image();
      img.src = preview;
      await new Promise((resolve) => {
        if (img.complete) resolve();
        else img.onload = resolve;
      });

      const quality = await assessImageQuality(img);
      setImageQuality(quality);

      // Enhanced OCR configuration based on image quality
      const ocrConfig = {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      };

      // Adaptive preprocessing based on quality
      if (quality.recommendation === "low") {
        // For low quality images, use more aggressive preprocessing
        ocrConfig.preprocess = ["invert", "grayscale", "normalize"];
      }

      const result = await Tesseract.recognize(
        preview,
        "eng+ara", // Support both English and Arabic
        ocrConfig,
      );

      const extractedText = result.data.text;
      const confidence = result.data.confidence;
      setOcrConfidence(confidence);

      const parsedData = parseInvoiceText(extractedText, confidence);

      setExtractedData(parsedData);
      setEditableData(JSON.parse(JSON.stringify(parsedData))); // Deep copy for editing
    } catch (err) {
      console.error("OCR Error:", err);
      setError("Failed to process image. Please try a clearer image.");
    } finally {
      setProcessing(false);
    }
  };

  const parseInvoiceText = (text, confidence = 0) => {
    // Enhanced parsing logic with confidence-based validation
    const lines = text.split("\n").filter((line) => line.trim());

    const data = {
      invoiceNumber: "",
      date: "",
      total: "",
      lineItems: [],
      rawText: text,
      confidence: confidence,
      warnings: [],
    };

    // Enhanced invoice number patterns
    const invoicePatterns = [
      /invoice\s*[:#]?\s*([a-zA-Z0-9-]+)/i,
      /inv\s*[:#]?\s*([a-zA-Z0-9-]+)/i,
      /فاتورة\s*[:#]?\s*([a-zA-Z0-9-]+)/i,
      /bill\s*[:#]?\s*([a-zA-Z0-9-]+)/i,
      /رقم\s*الفاتورة\s*[:#]?\s*([a-zA-Z0-9-]+)/i,
      /#\s*([a-zA-Z0-9-]+)/i,
    ];

    for (const pattern of invoicePatterns) {
      const match = text.match(pattern);
      if (match) {
        data.invoiceNumber = match[1];
        break;
      }
    }

    // Enhanced date patterns with multiple formats
    const datePatterns = [
      /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/,
      /(\d{1,2}[-/]\d{1,2}[-/]\d{4})/,
      /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
      /(\d{1,2}\s+(?:يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s+\d{4})/,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        data.date = match[1];
        break;
      }
    }

    // Enhanced total amount patterns with currency symbols
    const totalPatterns = [
      /total\s*[:]?\s*[$€£₹]?\s*([0-9.,]+)/i,
      /الإجمالي\s*[:]?\s*[$€£₹]?\s*([0-9.,]+)/i,
      /amount\s*[:]?\s*[$€£₹]?\s*([0-9.,]+)/i,
      /المبلغ\s*[:]?\s*[$€£₹]?\s*([0-9.,]+)/i,
      /grand\s*total\s*[:]?\s*[$€£₹]?\s*([0-9.,]+)/i,
      /[$€£₹]\s*([0-9.,]+)/,
    ];

    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.total = match[1].replace(/,/g, "");
        break;
      }
    }

    // Enhanced line item extraction with better patterns
    const detailedPattern =
      /([a-zA-Z\u0600-\u06FF\s][a-zA-Z\u0600-\u06FF0-9\s\-\.]*)\s+(\d+)\s*[x×]\s*[$€£₹]?\s*([0-9.,]+)/g;
    let match;
    while ((match = detailedPattern.exec(text)) !== null) {
      const description = match[1].trim();
      const quantity = match[2];
      const price = match[3].replace(/,/g, "");

      // Only add if it looks like a valid item
      if (description.length > 2 && !isNaN(quantity) && !isNaN(price)) {
        data.lineItems.push({
          description: description,
          quantity: parseInt(quantity),
          price: parseFloat(price),
        });
      }
    }

    // Alternative pattern: Price first, then quantity
    const priceFirstPattern =
      /[$€£₹]?\s*([0-9.,]+)\s*[x×]\s*(\d+)\s*([a-zA-Z\u0600-\u06FF\s][a-zA-Z\u0600-\u06FF0-9\s\-\.]*)/g;
    while ((match = priceFirstPattern.exec(text)) !== null) {
      const price = match[1].replace(/,/g, "");
      const quantity = match[2];
      const description = match[3].trim();

      if (description.length > 2 && !isNaN(quantity) && !isNaN(price)) {
        // Avoid duplicates
        const isDuplicate = data.lineItems.some(
          (item) =>
            item.description === description &&
            item.quantity === parseInt(quantity) &&
            item.price === parseFloat(price),
        );

        if (!isDuplicate) {
          data.lineItems.push({
            description: description,
            quantity: parseInt(quantity),
            price: parseFloat(price),
          });
        }
      }
    }

    // If no detailed items found, fall back to simple quantity × price patterns
    if (data.lineItems.length === 0) {
      const simplePattern = /(\d+)\s*[x×]\s*[$€£₹]?\s*([0-9.,]+)/g;
      while ((match = simplePattern.exec(text)) !== null) {
        data.lineItems.push({
          description: "",
          quantity: parseInt(match[1]),
          price: parseFloat(match[2].replace(/,/g, "")),
        });
      }
    }

    // Enhanced tax/VAT extraction
    const taxPatterns = [
      /(?:tax|vat|الضريبة|ضريبة)\s*[:#]?\s*([0-9.,]+)%?/i,
      /(?:tax|vat|الضريبة|ضريبة)\s*[:#]?\s*[$€£₹]?\s*([0-9.,]+)/i,
      /(?:vat|ضريبة\s*القيمة\s*المضافة)\s*[:#]?\s*([0-9.,]+)%?/i,
    ];

    for (const pattern of taxPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.taxRate = match[1].replace(/,/g, "");
        break;
      }
    }

    // Add confidence-based warnings (using translation keys)
    if (confidence < 60) {
      data.warnings.push("lowOcrConfidence");
    }
    if (data.lineItems.length === 0) {
      data.warnings.push("noLineItemsDetected");
    }
    if (!data.total) {
      data.warnings.push("totalAmountNotFound");
    }
    if (!data.invoiceNumber) {
      data.warnings.push("invoiceNumberNotFound");
    }

    return data;
  };

  const handleApplyData = () => {
    const dataToApply = isEditing ? editableData : extractedData;
    if (dataToApply && onScanComplete) {
      onScanComplete(dataToApply);
      onClose();
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      setExtractedData(JSON.parse(JSON.stringify(editableData)));
      setIsEditing(false);
    } else {
      // Start editing
      setEditableData(JSON.parse(JSON.stringify(extractedData)));
      setIsEditing(true);
    }
  };

  const handleEditableChange = (field, value) => {
    setEditableData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLineItemChange = (index, field, value) => {
    setEditableData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addLineItem = () => {
    setEditableData((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { description: "", quantity: 1, price: 0 },
      ],
    }));
  };

  const removeLineItem = (index) => {
    setEditableData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }));
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
                {t("invoiceScannerTitle")}
              </h2>
              <p className="text-sm text-graphite-500">
                {t("invoiceScannerDescription")}
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
                {t("uploadInvoice")}
              </p>
              <p className="mt-1 text-xs text-graphite-500">
                {t("uploadInvoiceHint")}
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
                      {t("processingImage")}
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
              {extractedData && !isEditing && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-900">
                        Data extracted successfully
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleEditToggle}
                      className="text-xs font-medium text-green-700 hover:text-green-900 flex items-center gap-1"
                    >
                      <Edit2 className="h-3 w-3" />
                      {t("editExtractedData")}
                    </button>
                  </div>

                  {/* Quality Indicators */}
                  {(imageQuality || ocrConfidence) && (
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      {imageQuality && (
                        <div className="rounded bg-green-100 px-2 py-1 text-xs">
                          <span className="text-green-700">
                            {t("imageQuality")}:{" "}
                          </span>
                          <span
                            className={`font-medium ${
                              imageQuality.recommendation === "high"
                                ? "text-green-900"
                                : imageQuality.recommendation === "medium"
                                  ? "text-amber-700"
                                  : "text-red-700"
                            }`}
                          >
                            {imageQuality.recommendation}
                          </span>
                        </div>
                      )}
                      {ocrConfidence && (
                        <div className="rounded bg-green-100 px-2 py-1 text-xs">
                          <span className="text-green-700">
                            {t("ocrConfidence")}:{" "}
                          </span>
                          <span
                            className={`font-medium ${
                              ocrConfidence > 80
                                ? "text-green-900"
                                : ocrConfidence > 60
                                  ? "text-amber-700"
                                  : "text-red-700"
                            }`}
                          >
                            {Math.round(ocrConfidence)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Warnings */}
                  {extractedData.warnings &&
                    extractedData.warnings.length > 0 && (
                      <div className="mb-3 rounded bg-amber-100 px-3 py-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <p className="font-medium text-amber-900">
                              {t("warnings")}:
                            </p>
                            <ul className="mt-1 space-y-1 text-amber-800">
                              {extractedData.warnings.map((warning, idx) => (
                                <li key={idx}>• {t(warning)}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                  <div className="space-y-2 text-sm">
                    {extractedData.invoiceNumber && (
                      <div className="flex justify-between">
                        <span className="text-green-700">
                          {t("invoiceScannerInvoiceNumber")}:
                        </span>
                        <span className="font-medium text-green-900">
                          {extractedData.invoiceNumber}
                        </span>
                      </div>
                    )}
                    {extractedData.date && (
                      <div className="flex justify-between">
                        <span className="text-green-700">
                          {t("invoiceScannerDate")}:
                        </span>
                        <span className="font-medium text-green-900">
                          {extractedData.date}
                        </span>
                      </div>
                    )}
                    {extractedData.total && (
                      <div className="flex justify-between">
                        <span className="text-green-700">
                          {t("invoiceScannerTotal")}:
                        </span>
                        <span className="font-medium text-green-900">
                          {extractedData.total}
                        </span>
                      </div>
                    )}
                    {extractedData.taxRate && (
                      <div className="flex justify-between">
                        <span className="text-green-700">
                          {t("invoiceScannerTaxRate")}:
                        </span>
                        <span className="font-medium text-green-900">
                          {extractedData.taxRate}%
                        </span>
                      </div>
                    )}
                    {extractedData.lineItems.length > 0 && (
                      <div>
                        <span className="text-green-700">
                          {t("lineItems")}:
                        </span>
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
                                <span>
                                  {t("invoiceScannerQuantity")}: {item.quantity}
                                </span>
                                <span>
                                  {t("invoiceScannerPrice")}: {item.price}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Editable Form */}
              {isEditing && editableData && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Edit2 className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-900">
                        {t("editExtractedData")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleEditToggle}
                      className="text-xs font-medium text-blue-700 hover:text-blue-900 flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      {t("invoiceScannerSaveChanges")}
                    </button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-blue-700 mb-1">
                          {t("invoiceScannerInvoiceNumber")}
                        </label>
                        <input
                          type="text"
                          value={editableData.invoiceNumber}
                          onChange={(e) =>
                            handleEditableChange(
                              "invoiceNumber",
                              e.target.value,
                            )
                          }
                          className="w-full rounded border border-blue-300 px-2 py-1 text-blue-900 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-blue-700 mb-1">
                          {t("invoiceScannerDate")}
                        </label>
                        <input
                          type="text"
                          value={editableData.date}
                          onChange={(e) =>
                            handleEditableChange("date", e.target.value)
                          }
                          placeholder="YYYY-MM-DD"
                          className="w-full rounded border border-blue-300 px-2 py-1 text-blue-900 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-blue-700 mb-1">
                          {t("invoiceScannerTotal")}
                        </label>
                        <input
                          type="text"
                          value={editableData.total}
                          onChange={(e) =>
                            handleEditableChange("total", e.target.value)
                          }
                          className="w-full rounded border border-blue-300 px-2 py-1 text-blue-900 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-blue-700 mb-1">
                          {t("invoiceScannerTaxRate")} (%)
                        </label>
                        <input
                          type="text"
                          value={editableData.taxRate || ""}
                          onChange={(e) =>
                            handleEditableChange("taxRate", e.target.value)
                          }
                          className="w-full rounded border border-blue-300 px-2 py-1 text-blue-900 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-medium text-blue-700">
                          {t("lineItems")}
                        </label>
                        <button
                          type="button"
                          onClick={addLineItem}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          + {t("invoiceScannerAddLineItem")}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {editableData.lineItems.map((item, idx) => (
                          <div key={idx} className="rounded bg-blue-100 p-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-blue-700">
                                Item {idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeLineItem(idx)}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                {t("remove")}
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-2">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) =>
                                    handleLineItemChange(
                                      idx,
                                      "description",
                                      e.target.value,
                                    )
                                  }
                                  placeholder={t(
                                    "invoiceScannerItemDescription",
                                  )}
                                  className="w-full rounded border border-blue-300 px-2 py-1 text-blue-900 focus:border-blue-500 focus:outline-none text-xs"
                                />
                              </div>
                              <div>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleLineItemChange(
                                      idx,
                                      "quantity",
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  placeholder={t("invoiceScannerQuantity")}
                                  className="w-full rounded border border-blue-300 px-2 py-1 text-blue-900 focus:border-blue-500 focus:outline-none text-xs"
                                />
                              </div>
                              <div className="col-span-3">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.price}
                                  onChange={(e) =>
                                    handleLineItemChange(
                                      idx,
                                      "price",
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  placeholder={t("invoiceScannerPrice")}
                                  className="w-full rounded border border-blue-300 px-2 py-1 text-blue-900 focus:border-blue-500 focus:outline-none text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
                    {t("extractData")}
                  </button>
                )}

                {extractedData && !isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex-1 rounded-lg border border-graphite-300 px-4 py-2.5 text-sm font-medium text-graphite-700 hover:bg-graphite-50 transition-colors"
                    >
                      {t("scanDifferent")}
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyData}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      {t("applyData")}
                    </button>
                  </>
                )}

                {isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditableData(
                          JSON.parse(JSON.stringify(extractedData)),
                        );
                        setIsEditing(false);
                      }}
                      className="flex-1 rounded-lg border border-graphite-300 px-4 py-2.5 text-sm font-medium text-graphite-700 hover:bg-graphite-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {t("cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={handleEditToggle}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      {t("invoiceScannerSaveChanges")}
                    </button>
                  </>
                )}
              </div>

              {/* Tips for better OCR */}
              {!processing && !extractedData && (
                <div className="mt-4 rounded-lg bg-graphite-50 px-4 py-3">
                  <p className="text-xs font-medium text-graphite-900 mb-2">
                    {t("tipsForBetterResults")}:
                  </p>
                  <ul className="text-xs text-graphite-600 space-y-1">
                    <li>• {t("tipHighResolution")}</li>
                    <li>• {t("tipGoodLighting")}</li>
                    <li>• {t("tipParallelCamera")}</li>
                    <li>• {t("tipAvoidBlurry")}</li>
                    <li>• {t("tipWellLit")}</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
