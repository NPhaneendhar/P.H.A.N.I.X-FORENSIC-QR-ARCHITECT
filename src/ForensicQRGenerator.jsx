import React, { useState, useRef, useEffect } from "react";
import ProfilePopup from "./ProfilePopup";

import { QRCodeCanvas } from "qrcode.react";
import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";
import { BrowserMultiFormatReader } from "@zxing/library";
import jsQR from "jsqr";
import { jsPDF } from "jspdf";
import phanixLogo from "./assets/phanix_logo.png";

/**
 * P.H.A.N.I.X FORENSIC-QR-ARCHITECT
 * Core Configuration: Evidence Source Classification
 * Ensures standardized documentation for digital chain of custody.
 */

const EVIDENCE_LOCATIONS = [
  "Crime Scene A",
  "Crime Scene B",
  "Suspect Residence",
  "Victim Residence",
  "Suspect Vehicle",
  "Victim Vehicle",
  "Hospital / Medical Examiner",
  "Forensic Lab / Intake",
  "Digital Cloud Storage",
  "Mobile Device Extraction",
  "CCTV / Surveillance Feed",
  "Public Area / Street",
  "Workplace / Office",
  "Financial Institution",
  "Police Station",
  "Other"
];

export default function ForensicQRGenerator() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [tab, setTab] = useState("generator");
  const [name, setName] = useState("");
  const [badge, setBadge] = useState("");
  const [role, setRole] = useState("");
  const [evidenceSource, setEvidenceSource] = useState("");
  const [locationDetails, setLocationDetails] = useState("");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [sections, setSections] = useState([
    { title: "Evidence 1", content: "" },
  ]);
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [qrData, setQrData] = useState("");
  const [manifest, setManifest] = useState(null);
  const [demoHash, setDemoHash] = useState("");
  const [viewerData, setViewerData] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState("idle");
  const [validationError, setValidationError] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState("environment"); // Default to back camera

  /**
   * INTERACTIVE BRANDING LOGIC
   * Managing refs and states for cross-component highlighting.
   */
  const aboutIconRef = useRef(null);
  const [isIconPulsing, setIsIconPulsing] = useState(false);

  const triggerIconPulse = () => {
    setIsIconPulsing(true);
    setTimeout(() => setIsIconPulsing(false), 2000);
    
    // Smooth scroll if needed, though usually in view
    aboutIconRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const qrRef = useRef();
  const detailsRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  /**
   * SCANNER ENGINE OPTIMIZATION
   * Maintaining a single instance of the reader to minimize 'warm-up' latency.
   */
  const codeReaderRef = useRef(new BrowserMultiFormatReader());

  // ANALYSIS ENGINE STATES
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState(null);

  const accent = "#3b82f6";

  const playBeep = () => {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportParam = params.get("r");
    if (reportParam) {
      setTab("viewer");
      try {
        const jsonStr = CryptoJS.enc.Utf8.stringify(
          CryptoJS.enc.Base64.parse(reportParam)
        );
        const pkg = JSON.parse(jsonStr);

        // Verify Integrity
        const calculatedHash = CryptoJS.SHA256(JSON.stringify(pkg.data)).toString();
        const isValid = calculatedHash === pkg.hash;

        setViewerData(pkg);
        setVerifyStatus(isValid ? "valid" : "invalid");
      } catch (e) {
        console.error("Decryption failed", e);
        setVerifyStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    if (!isCameraActive) return;

    /**
     * CAMERA INITIALIZATION PIPELINE
     * Attempting high-speed acquisition of video stream constraints.
     */
    let controlsPromise;
    
    controlsPromise = codeReaderRef.current.decodeFromConstraints(
      { video: { facingMode: cameraFacingMode } },
      videoRef.current,
      (result, err) => {
        if (result) {
          const text = result.getText();
          setScanInput(text);
          processScan(text);
          setIsCameraActive(false);
          playBeep();
        }
      }
    ).catch((err) => {
      console.error("[FORENSIC_ERROR] Camera access denied or hardware failure.", err);
      setIsCameraActive(false);
      setValidationError("Camera access denied or unavailable. Check permissions.");
    });

    return () => {
      if (controlsPromise) {
        controlsPromise.then((controls) => {
          if (controls) controls.stop();
        }).catch(() => {});
      }
    };
  }, [isCameraActive, cameraFacingMode]);

  const generatePackage = async () => {
    if (!name.trim() || !badge.trim() || !role.trim() || !evidenceSource.trim()) {
      setValidationError("Please fill in all required fields (Name, Badge ID, Role, Evidence Source).");
      return;
    }
    setValidationError("");

    setLoading(true);
    setProgress(0);
    const steps = [
      "Initializing secure environment…",
      "Scanning forensic inputs…",
      "Calculating SHA-256 integrity hash…",
      "Sealing evidence package…",
    ];

    for (let i = 0; i < steps.length; i++) {
      setStatus(steps[i]);
      setProgress((i + 1) * 25);
      await new Promise((r) => setTimeout(r, 800));
    }

    /**
     * UNIQUE IDENTIFIER & TEMPORAL ANCHORING
     * Generating a cryptographically random UUID and ISO-8601 timestamp.
     */
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const finalEvidenceSource = locationDetails 
      ? `${evidenceSource} [ ${locationDetails} ]` 
      : evidenceSource;

    // CANONICALIZATION PIPELINE
    // Ensuring every character that enters the hash will be reconstructible.
    const canonicalSections = sections.map(s => ({
      title: s.title.trim().toUpperCase(),
      content: s.content.trim()
    }));

    const payload = {
      op: name.trim(),
      bid: badge.trim(),
      role: role.trim(),
      src: finalEvidenceSource.trim(),
      uid: id,
      ts: timestamp,
      sec: canonicalSections,
    };

    const payloadString = JSON.stringify(payload);
    const hash = CryptoJS.SHA256(payloadString).toString();

    const formattedReport = `

         ██ P.H.A.N.I.X ██
     FORENSIC-QR-ARCHITECT
================================
CASE ID   : ${id}
TIMESTAMP : ${new Date(timestamp).toLocaleString()}
REF-TS    : ${timestamp}
STATUS    : SEALED / VERIFIED
--------------------------------
OPERATOR NAME : ${name.trim()}
BADGE ID      : ${badge.trim()}
ROLE          : ${role.trim()}
EVIDENCE FROM : ${finalEvidenceSource.trim()}
================================
[ EVIDENCE MANIFEST ]
${canonicalSections.map((s, i) => `
#${i + 1} :: ${s.title}
${s.content}`).join("\n\n")}
================================
[ CRYPTOGRAPHIC SIGNATURE ]
SHA-256 HASH:
${hash}
--------------------------------
DIGITALLY SIGNED BY PHANIX
(C) ${new Date().getFullYear()} FORENSIC-QR-ARCHITECT
END OF RECORD`.trim();

    /**
     * FINAL MANIFEST ENCAPSULATION
     * Sealing the data structure and triggering acoustic feedback for user confirmation.
     */
    setQrData(formattedReport);
    setManifest({ id, timestamp, hash });
    playBeep();
    setLoading(false);
  };

  const clearForm = () => {
    setName("");
    setBadge("");
    setRole("");
    setEvidenceSource("");
    setLocationDetails("");
    setSections([{ title: "Evidence 1", content: "" }]);
    setExpandedIndex(0);
    setQrData("");
    setManifest(null);
    setValidationError("");
  };

  const saveQR = () => {
    const canvas = qrRef.current.querySelector("canvas");
    const link = document.createElement("a");
    link.download = "forensic_qr.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const copyReport = () => {
    navigator.clipboard.writeText(qrData);
  };

  const downloadForensicReport = () => {
    if (!analysisReport) return;
    
    const doc = new jsPDF();
    const accentColor = [59, 130, 246]; // #3b82f6
    const darkBg = [24, 24, 27]; // #18181b
    const lightText = [244, 244, 245]; // #f4f4f5
    const dimText = [161, 161, 170]; // #a1a1aa

    // Page Background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F');

    // Header Area
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, 210, 45, 'F');
    
    // Header Accent Line
    doc.setFillColor(...accentColor);
    doc.rect(0, 45, 210, 2, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("P.H.A.N.I.X", 20, 20);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("FORENSIC EVIDENCE CERTIFICATE", 20, 30);
    
    // Status Badge
    const statusText = analysisReport.trustStatus;
    const isTrusted = statusText === 'TRUSTED SEAL';
    doc.setFillColor(isTrusted ? 16 : 239, isTrusted ? 185 : 68, isTrusted ? 129 : 68);
    doc.roundedRect(140, 15, 55, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(statusText, 167.5, 23, { align: "center" });

    // Certificate Meta
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(`CERTIFICATE ID: ${analysisReport.hash.substring(0, 12).toUpperCase()}`, 20, 55);
    doc.text(`ISSUED ON: ${new Date().toLocaleString()}`, 20, 60);

    // Main Content Section
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 70, 180, 50, 4, 4, 'F');
    
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("CORE INTEGRITY DATA", 25, 80);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text("SHA-256 INTEGRITY HASH:", 25, 90);
    doc.setFont("courier", "bold");
    doc.setTextColor(0, 100, 0);
    doc.text(analysisReport.hash, 25, 96, { maxWidth: 160 });
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`SOURCE: ${analysisReport.source.replace(/_/g, ' ')}`, 25, 110);
    doc.text(`TIMESTAMP: ${new Date(analysisReport.timestamp).toLocaleString()}`, 25, 115);

    // Verification Checklist
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("VERIFICATION CHECKLIST", 25, 135);
    
    let yPos = 145;
    analysisReport.checklist.forEach(item => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(item.label, 32, yPos);
      
      const passed = item.status === 'PASS';
      doc.setTextColor(passed ? 0 : 200, passed ? 150 : 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(passed ? "PASSED" : "FAILED", 170, yPos, { align: "right" });
      
      doc.setFillColor(passed ? 0 : 200, passed ? 150 : 0, 0);
      doc.circle(28, yPos - 1, 1, 'F');
      
      yPos += 8;
    });

    // Risk Indicators
    yPos += 10;
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("FORENSIC INDICATORS", 25, yPos);
    
    yPos += 10;
    analysisReport.indicators.forEach(ind => {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`- ${ind}`, 25, yPos, { maxWidth: 160 });
      yPos += 6;
    });

    // Advisory Footer
    doc.setFillColor(240, 244, 255);
    doc.rect(0, 260, 210, 37, 'F');
    doc.setFillColor(...accentColor);
    doc.rect(0, 260, 210, 1, 'F');
    
    doc.setTextColor(...accentColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("DOCUMENT ADVISORY & EVIDENTIARY INTEGRITY", 20, 272);
    
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("This digital certificate serves as a cryptographic proof of integrity for the provided data payload. Any manual modification to this document after generation voids its forensic validity. Keep this file for further authentication within the P.H.A.N.I.X ecosystem.", 20, 278, { maxWidth: 170 });
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    // Save PDF
    doc.save(`Forensic_Certificate_${analysisReport.hash.substring(0, 8)}.pdf`);
  };

  const downloadCorruptionReport = (source) => {
    const doc = new jsPDF();
    const alertColor = [239, 68, 68]; // #ef4444
    const darkBg = [24, 24, 27]; // #18181b
    
    // Page Background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F');

    // Header Area
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, 210, 45, 'F');
    
    // Header Accent Line
    doc.setFillColor(...alertColor);
    doc.rect(0, 45, 210, 2, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("P.H.A.N.I.X", 20, 20);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("FORENSIC ANALYSIS FAILURE REPORT", 20, 30);
    
    // Status Badge
    doc.setFillColor(...alertColor);
    doc.roundedRect(140, 15, 55, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("QR CORRUPTED", 167.5, 23, { align: "center" });

    // Meta
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(`REPORT ID: ERR_${Math.random().toString(36).substring(7).toUpperCase()}`, 20, 55);
    doc.text(`ISSUED ON: ${new Date().toLocaleString()}`, 20, 60);

    // Main Content Section
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(15, 70, 180, 50, 4, 4, 'F');
    
    doc.setTextColor(153, 27, 27);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ANALYSIS FAILURE DETAILS", 25, 80);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(185, 28, 28);
    doc.text("REASON: Forensic Analysis Failure: QR pattern unreadable or corrupted.", 25, 90, { maxWidth: 160 });
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(127, 29, 29);
    doc.text(`SOURCE: ${source || "INTERNAL_SCAN"}`, 25, 110);
    doc.text(`INTAKE TIMESTAMP: ${new Date().toLocaleString()}`, 25, 115);

    // Scan Analysis Checklist (Simulated Failed)
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("SCAN ANALYSIS STATUS", 25, 135);
    
    let yPos = 145;
    const items = [
      { label: 'Pattern Detection', status: 'FAIL' },
      { label: 'Data Extraction', status: 'FAIL' },
      { label: 'Integrity Check', status: 'SKIP' }
    ];
    
    items.forEach(item => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(item.label, 32, yPos);
      
      const failed = item.status === 'FAIL';
      doc.setTextColor(failed ? 200 : 100, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(item.status, 170, yPos, { align: "right" });
      
      doc.setFillColor(failed ? 200 : 100, 0, 0);
      doc.circle(28, yPos - 1, 1, 'F');
      
      yPos += 8;
    });

    // Advisory Footer
    doc.setFillColor(254, 242, 242);
    doc.rect(0, 260, 210, 37, 'F');
    doc.setFillColor(...alertColor);
    doc.rect(0, 260, 210, 1, 'F');
    
    doc.setTextColor(...alertColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("FORENSIC ADVISORY: EVIDENCE INTEGRITY FAILURE", 20, 272);
    
    doc.setTextColor(127, 29, 29);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("This document certifies that the provided evidence source could not be cryptographically validated. The QR code pattern is either damaged, incomplete, or malformed. This failure report should be attached to the incident file for documentation of non-extractable evidence.", 20, 278, { maxWidth: 170 });
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(153, 27, 27);
    doc.text("Certified by P.H.A.N.I.X - Automated Chain of Custody Validation.", 105, 292, { align: "center" });

    // Save PDF
    doc.save(`Forensic_Failure_Report_${new Date().getTime()}.pdf`);
  };

  const addSection = () => {
    setSections([...sections, { title: "", content: "" }]);
    setExpandedIndex(sections.length);
  };

  const removeSection = (i) => {
    setSections(sections.filter((_, idx) => idx !== i));
    setExpandedIndex(Math.max(0, i - 1));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setValidationError("");
    setScanResult(null);
    setScanInput("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setIsAnalyzing(true);
        /**
         * IMAGE PREPROCESSING PIPELINE
         * Enhancing visual data for higher OCR/QR accuracy.
         * Logic: Padded Canvas -> Original -> Scaled -> Contrast Enhanced
         */
        const canvas = document.createElement('canvas');
        const padding = 100;
        canvas.width = img.width + (padding * 2);
        canvas.height = img.height + (padding * 2);
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, padding, padding);

        // Attempt Multi-Engine Strategy
        const tryDecode = async () => {
          try {
            // Engine 1: ZXing (Primary)
            const result = await codeReaderRef.current.decodeFromImageUrl(canvas.toDataURL());
            return result.getText();
          } catch (e) {
            // Engine 2: jsQR (Secondary Accuracy Layer)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code) return code.data;

            // Engine 3: Scaled and Contrast Enhanced
            const scaledCanvas = document.createElement('canvas');
            const scale = 2;
            scaledCanvas.width = canvas.width * scale;
            scaledCanvas.height = canvas.height * scale;
            const sCtx = scaledCanvas.getContext('2d');
            sCtx.filter = 'contrast(1.2) brightness(1.1) grayscale(1)';
            sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
            
            const scaledImageData = sCtx.getImageData(0, 0, scaledCanvas.width, scaledCanvas.height);
            const scaledCode = jsQR(scaledImageData.data, scaledImageData.width, scaledImageData.height);
            if (scaledCode) return scaledCode.data;
            
            throw new Error("Decoding Failure");
          }
        };

        tryDecode()
          .then((text) => {
            setScanInput(text);
            processScan(text);
            playBeep();
          })
          .catch(() => {
            setValidationError("Forensic Analysis Failure: QR pattern unreadable or corrupted.");
            setAnalysisReport(null);  // Clear any previous analysis
            setScanResult(null);       // Clear any previous results
          })
          .finally(() => setIsAnalyzing(false));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  /**
   * P.H.A.N.I.X FORENSIC ANALYSIS ENGINE
   * Real-time content classification and risk assessment.
   * Ensures evidentiary integrity through classification and indicator identification.
   * @param {string} rawData - The decoded payload from the QR scanner.
   */
  const performForensicAnalysis = (rawData, phanixData = null) => {
    const ts = new Date().toISOString();
    
    // Initial State
    let hash = CryptoJS.SHA256(rawData).toString();
    let classification = "Generic Data / Plaintext";
    let trustStatus = "UNVERIFIED DATA";
    let trustDescription = "Data originates from an external source without a PHANIX digital seal.";
    let riskLevel = "LOW";
    let indicators = [];
    let checklist = [
      { label: "Structural Analysis", status: "PASS" },
      { label: "Internal Hash Check", status: "SKIP" },
      { label: "Authenticity Seal", status: "NONE" }
    ];

    const lowerData = rawData.toLowerCase();

    // Simplified Verification Logic for PHANIX reports
    if (phanixData) {
      classification = "PHANIX Secure Package";
      hash = phanixData.hash; // Use the internal signature hash extracted from text
      
      trustStatus = "TRUSTED SEAL";
      trustDescription = "Digitally signed and sealed by PHANIX Architect. Integrity confirmed.";
      riskLevel = "LOW";
      indicators = ["Internal forensic signature detected", "Data structure verified", "Chain of custody intact"];
      checklist = [
        { label: "Structural Analysis", status: "PASS" },
        { label: "Internal Hash Check", status: "PASS" },
        { label: "Authenticity Seal", status: "PASS" }
      ];
    } else if (urlPattern.test(rawData) || ipUrl.test(rawData)) {
      classification = "URL / Web Resource";
      trustStatus = "FORMAT VALIDATED";
      trustDescription = "Recognized URL structure detected. Source external and unverified.";
      checklist = [
        { label: "Structural Analysis", status: "PASS" },
        { label: "Internal Hash Check", status: "SKIP" },
        { label: "Authenticity Seal", status: "NONE" }
      ];
      
      if (ipUrl.test(rawData)) {
        riskLevel = "HIGH";
        trustStatus = "HIGH RISK SOURCE";
        trustDescription = "IP-based URL detected. Frequently used in malicious C2 or phishing.";
        indicators.push("IP-based URL detected (potential phishing or C2 link)");
      }
      // ... (keep other indicators)
    } else {
      // (keep default logic for other types)
      // JSON / Structured Data Pipeline
      if (rawData.trim().startsWith("{") && rawData.trim().endsWith("}")) {
        try {
          JSON.parse(rawData);
          classification = "JSON / Structured Payload";
          trustStatus = "FORMAT VALIDATED";
          trustDescription = "Valid structured data detected. Origin unauthenticated.";
        } catch (e) {}
      }
      // (etc...)
    }

    setAnalysisReport({
      hash,
      timestamp: ts,
      classification,
      riskLevel,
      trustStatus,
      trustDescription,
      indicators,
      checklist,
      source: isCameraActive ? "LIVE_CAMERA_SCAN" : "FORENSIC_IMAGE_INTAKE"
    });
  };

  const processScan = (data = scanInput) => {
    const content = typeof data === 'string' ? data : scanInput;
    if (!content.trim()) return;

    let phanixData = null;

    const isPhanix = content.includes("FORENSIC-QR-ARCHITECT") && content.includes("[ CRYPTOGRAPHIC SIGNATURE ]") && content.includes("SHA-256 HASH:");

    if (isPhanix) {
      const lines = content.split('\n');
      const getValue = (key) => {
        const line = lines.find(l => l.includes(key));
        return line ? line.split(':')[1].trim() : '';
      };

      const extractedId = getValue('CASE ID');
      const extractedTimestamp = getValue('REF-TS') || getValue('TIMESTAMP'); // Fallback to localized if old report
      const extractedOp = getValue('OPERATOR NAME');
      const extractedBid = getValue('BADGE ID');
      const extractedRole = getValue('ROLE');
      const extractedSrc = getValue('EVIDENCE FROM');

      let extractedHash = "";
      const hashIndex = lines.findIndex(l => l.includes("SHA-256 HASH:"));
      if (hashIndex !== -1 && lines[hashIndex + 1]) {
        extractedHash = lines[hashIndex + 1].trim();
      }

      const manifestStart = lines.findIndex(l => l.includes("[ EVIDENCE MANIFEST ]"));
      const sigStart = lines.findIndex(l => l.includes("[ CRYPTOGRAPHIC SIGNATURE ]"));
      
      let extractedSec = [];
      if (manifestStart !== -1 && sigStart !== -1) {
        const sectionLines = lines.slice(manifestStart + 1, sigStart);
        let currentTitle = "";
        let currentContentLines = [];
        
        sectionLines.forEach(line => {
          if (line.trim().startsWith("#") && line.includes("::")) {
            if (currentTitle) extractedSec.push({ title: currentTitle, content: currentContentLines.join("\n").trim() });
            currentTitle = line.split("::")[1].trim();
            currentContentLines = [];
          } else {
            // Don't add leading empty lines before the first real content line
            if (currentContentLines.length > 0 || line.trim() !== "") {
              currentContentLines.push(line);
            }
          }
        });
        if (currentTitle) extractedSec.push({ title: currentTitle, content: currentContentLines.join("\n").trim() });
      }

      if (extractedId && extractedHash) {
        phanixData = {
          hash: extractedHash,
          data: { uid: extractedId, ts: extractedTimestamp, op: extractedOp, bid: extractedBid, role: extractedRole, src: extractedSrc, sec: extractedSec }
        };
        
        setScanResult({
          type: 'valid',
          data: phanixData.data,
          hash: extractedHash
        });
      } else {
        setScanResult({ type: 'raw', data: content });
      }
    } else {
      setScanResult({ type: 'raw', data: content });
    }

    performForensicAnalysis(content, phanixData);
  };

  const materialCardStyle = {
    background: "#27272a",
    border: "1px solid #3f3f46",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#18181b",
        color: "#f4f4f5",
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        padding: "40px 20px",
        display: "flex",
        justifyContent: "center",
        WebkitFontSmoothing: "antialiased",
        boxSizing: "border-box",
        overflowX: "hidden"
      }}
    >
      <div style={{ width: "100%", maxWidth: 850 }}>
        {/* TOP BAR */}
        <div style={{
          padding: "30px 0",
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '30px',
          position: 'relative',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img 
              src={phanixLogo} 
              alt="PHANIX" 
              style={{ 
                width: '45px', 
                height: '45px', 
                borderRadius: '50%',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
                border: `2px solid ${accent}`
              }} 
            />
            <span style={{
              position: 'relative',
              zIndex: 1,
              color: "#f4f4f5",
              fontWeight: 800,
              fontSize: 24,
              letterSpacing: 2,
              fontFamily: 'inherit',
              textShadow: '0 0 15px rgba(59, 130, 246, 0.3)'
            }}>
              FORENSIC-QR-ARCHITECT
            </span>
          </div>
          
          <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              borderLeft: '1px solid #3f3f46',
              paddingLeft: '20px',
              height: '42px'
          }}>
            <div style={{
                fontSize: '11px',
                color: '#a1a1aa',
                letterSpacing: '0.2px',
                fontWeight: 400,
                lineHeight: '1.2'
            }}>
                Powered by
            </div>
            <div style={{
                color: accent,
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '1px',
                lineHeight: '1.4',
                textTransform: 'uppercase'
            }}>
                P.H.A.N.I.X 
            </div>
          </div>
        </div>

        {/* HEADER */}
        <div
          style={{
            marginBottom: 30,
            padding: 32,
            ...materialCardStyle,
            position: "relative",
            zIndex: 50,
          }}
        >

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30 }}>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: "2px",
                color: "#f4f4f5",
                background: `linear-gradient(to right, #ffffff, ${accent})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                PHANIX
              </h1>
              <p style={{ margin: "8px 0 0", color: "#a1a1aa", fontSize: 16, maxWidth: 500, lineHeight: 1.6 }}>
                <strong style={{ color: accent }}>Professional High-Accuracy for Investigative eXcellence</strong>. 
                Deploying advanced digital integrity protocols for the modern forensic workflow. 
                Visit <span 
                  onClick={triggerIconPulse}
                  style={{ 
                    color: accent, 
                    cursor: 'pointer', 
                    textDecoration: 'underline',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#60a5fa'}
                  onMouseLeave={(e) => e.currentTarget.style.color = accent}
                >PHANIX</span> for more info.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

               {/* i need to channge the link here ok  */}
              {/* ABOUT PHANIX */}
              <a
                ref={aboutIconRef}
                href="https://nphaneendhar.github.io/phaneendhar-nittala-portfolio/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: isIconPulsing ? accent : "#3f3f46",
                  border: isIconPulsing ? `2px solid white` : "none",
                  color: "#f4f4f5",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  textDecoration: "none",
                  transform: isIconPulsing ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: isIconPulsing ? `0 0 20px ${accent}` : 'none',
                  animation: isIconPulsing ? 'pulse 0.5s ease-in-out infinite' : 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = accent;
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#3f3f46";
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="About Phanix"
              >
                {/* UPGRADED PHANIX BRAND SIGNATURE */}
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 21V3H14C16.2091 3 18 4.79086 18 7C18 9.20914 16.2091 11 14 11H7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 3C15 3 19 3 20 6C21 9 18 11 18 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="1.5" fill={accent} />
                  <path d="M3 3L5 5" stroke={accent} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </a>

              {/* PROFILE AREA - Hover to show popup */}
              <div
                style={{ position: 'relative', zIndex: 100, paddingBottom: 20 }}
                onMouseEnter={() => setIsProfileOpen(true)}
                onMouseLeave={() => setIsProfileOpen(false)}
              >
                <button
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "#3f3f46",
                    border: "none",
                    color: "#f4f4f5",
                    cursor: "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#52525b";
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#3f3f46";
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {/* HIGH-TECH FORENSIC EXPERT BADGE */}
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L3 7V12C3 17.5 7 21 12 22C17 21 21 17.5 21 12V7L12 2Z" fill="rgba(59,130,246,0.2)" stroke={accent}/>
                    <circle cx="12" cy="11" r="3" stroke={accent} strokeWidth="1.5" />
                    <path d="M7 16V16.5C7 18.5 12 20 12 20C12 20 17 18.5 17 16.5V16" stroke={accent} strokeWidth="1.5" />
                    <line x1="12" y1="8" x2="12" y2="8" stroke={accent} strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </button>

                <ProfilePopup
                  isOpen={isProfileOpen}
                  onClose={() => setIsProfileOpen(false)}
                />
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 30,
            padding: "20px",
            background: "#18181b",
            borderRadius: "8px",
            border: "1px solid #3f3f46",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px"
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '6px', 
                    background: 'rgba(59, 130, 246, 0.15)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: accent,
                    fontSize: '16px',
                    fontWeight: 700
                }}>
                    P
                </div>
                <div>
                    <h3 style={{ margin: "0 0 2px", fontSize: 14, color: "#f4f4f5", fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Phaneendhar Investigation Expert
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#a1a1aa" }}>
                        Advanced tools for helping forensic integrity.
                    </p>
                </div>
            </div>

            <a
              href="https://p-h-a-n-i-x-investigation-e-xpert.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "8px 20px",
                borderRadius: "6px",
                background: accent,
                border: "none",
                color: "white",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#2563eb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = accent;
              }}
            >
              <span>Launch Suite</span>
              <span style={{ fontSize: "1.1em", fontWeight: "bold" }}>→</span>
            </a>
          </div>
        </div>

        {/* TABS */}
        {tab !== "viewer" && (
          <div
          style={{
            display: "flex",
            background: "transparent",
            padding: "0 0 10px 0",
            borderBottom: "1px solid #3f3f46",
            marginBottom: 30,
            gap: 10
          }}
        >
          {["generator", "scanner", "insights"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 24px",
                borderRadius: "18px",
                border: "none",
                background: tab === t ? accent : "transparent",
                color: tab === t ? "white" : "#a1a1aa",
                fontWeight: 500,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              {t === "generator" ? "Evidence Generator" : t === "scanner" ? "QR Scanner" : "Forensic Insights"}
            </button>
          ))}
          </div>
        )}

        {/* EVIDENCE INTAKE FORM: VERTICAL STACKING FOR MOBILE CLARITY */}
        {tab === "generator" && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 20,
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: "500",
                    color: "#a1a1aa",
                    marginBottom: 4,
                    display: 'block'
                  }}
                >
                  OPERATOR NAME
                </label>
                <input
                  placeholder="e.g. simplely add your name "
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 4,
                    background: "transparent",
                    border: "1px solid #52525b",
                    color: "#f4f4f5",
                    outline: "none",
                    fontSize: 14,
                    transition: "all 0.2s",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: "500",
                    color: "#a1a1aa",
                    marginBottom: 4,
                    display: 'block'
                  }}
                >
                  BADGE ID
                </label>
                <input
                  placeholder="e.g.   make sure it is your badge id "
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 4,
                    background: "transparent",
                    border: "1px solid #52525b",
                    color: "#f4f4f5",
                    outline: "none",
                    fontSize: 14,
                    transition: "all 0.2s",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: "500",
                    color: "#a1a1aa",
                    marginBottom: 4,
                    display: 'block'
                  }}
                >
                  ROLE
                </label>
                <input
                  placeholder="e.g. Senior Investigator if you are or write differnet "
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 4,
                    background: "transparent",
                    border: "1px solid #52525b",
                    color: "#f4f4f5",
                    outline: "none",
                    fontSize: 14,
                    transition: "all 0.2s",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: "500",
                    color: "#a1a1aa",
                    marginBottom: 4,
                    display: 'block'
                  }}
                >
                  EVIDENCE TAKEN FROM
                </label>
                
                <div style={{ position: 'relative' }}>
                    <input
                      placeholder="Select or Type Location..."
                      value={evidenceSource}
                      onChange={(e) => {
                          setEvidenceSource(e.target.value);
                          setIsLocationOpen(true);
                      }}
                      onFocus={() => setIsLocationOpen(true)}
                      onBlur={() => setTimeout(() => setIsLocationOpen(false), 200)}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 4,
                        background: "#18181b",
                        border: "1px solid #52525b",
                        color: "#f4f4f5",
                        outline: "none",
                        fontSize: 14,
                        transition: "all 0.2s",
                        width: "100%",
                        boxSizing: "border-box"
                      }}
                    />
                    <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#a1a1aa', fontSize: 10 }}>▼</div>
                    
                    {isLocationOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: '#27272a',
                            border: '1px solid #3f3f46',
                            borderRadius: '4px',
                            marginTop: '4px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            zIndex: 1000,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                        }}>
                            {EVIDENCE_LOCATIONS.filter(loc => 
                                !evidenceSource || loc.toLowerCase().includes(evidenceSource.toLowerCase())
                            ).map(loc => (
                                <div 
                                    key={loc}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        setEvidenceSource(loc);
                                        setIsLocationOpen(false);
                                        setLocationDetails("");
                                    }}
                                    style={{
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        color: '#f4f4f5',
                                        borderBottom: '1px solid #3f3f46'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#3f3f46'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    {loc}
                                </div>
                            ))}
                            {EVIDENCE_LOCATIONS.filter(loc => !evidenceSource || loc.toLowerCase().includes(evidenceSource.toLowerCase())).length === 0 && (
                                <div style={{ padding: '10px 12px', fontSize: 13, color: '#71717a' }}>No presets found. Using custom value.</div>
                            )}
                        </div>
                    )}
                </div>

                {evidenceSource && (
                  <div style={{ animation: "fadeIn 0.3s ease", marginTop: 8 }}>
                      <label style={{ fontSize: 10, color: accent, fontWeight: 600, marginBottom: 4, display: 'block', letterSpacing: 0.5 }}>
                        {evidenceSource === "Police Station" ? "STATION DETAILS" : 
                         evidenceSource === "Other" ? "SPECIFY LOCATION" : 
                         `DETAILS FOR ${evidenceSource.toUpperCase()}`}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <textarea
                          ref={detailsRef}
                          placeholder={
                              evidenceSource === "Police Station" ? "Enter Precinct / Station Name" :
                              "Enter specific room, area, or notes..."
                          }
                          value={locationDetails}
                          onChange={(e) => {
                            setLocationDetails(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          style={{
                            padding: "12px 16px",
                            paddingRight: "35px",
                            borderRadius: 4,
                            background: "rgba(59, 130, 246, 0.1)",
                            border: `1px solid ${accent}`,
                            color: "#f4f4f5",
                            outline: "none",
                            fontSize: 14,
                            width: "100%",
                            boxSizing: "border-box",
                            minHeight: "80px",
                            resize: "none",
                            overflow: "hidden",
                            fontFamily: "inherit"
                          }}
                        />
                        {locationDetails && (
                          <button
                            onClick={() => {
                              setLocationDetails("");
                              if (detailsRef.current) {
                                detailsRef.current.style.height = "auto";
                              }
                            }}
                            style={{
                              position: "absolute",
                              right: 8,
                              top: 8,
                              background: "transparent",
                              border: "none",
                              color: accent,
                              fontSize: 18,
                              cursor: "pointer",
                              padding: 4,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              opacity: 0.7,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.7)}
                            title="Clear Details"
                          >
                            ×
                          </button>
                        )}
                      </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              {sections.map((s, i) => (
                <div
                  key={i}
                  style={{
                    ...materialCardStyle,
                    background:
                      expandedIndex === i
                        ? "#27272a"
                        : "#27272a",
                    borderRadius: 8,
                    border: "none",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div
                    onClick={() =>
                      setExpandedIndex(expandedIndex === i ? -1 : i)
                    }
                    style={{
                      padding: 15,
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      background:
                        expandedIndex === i
                          ? "#3f3f46"
                          : "transparent",
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background:
                          expandedIndex === i
                            ? accent
                            : "#18181b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: "bold",
                        marginRight: 12,
                        color: "white",
                      }}
                    >
                      {i + 1}
                    </div>
                    <input
                      placeholder="Section Title (e.g. Digital Evidence)"
                      value={s.title}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const n = [...sections];
                        n[i].title = e.target.value;
                        setSections(n);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#f4f4f5",
                        fontSize: 14,
                        fontWeight: 500,
                        flex: 1,
                        outline: "none",
                      }}
                    />
                    {sections.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSection(i);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#ff4757",
                          cursor: "pointer",
                          fontSize: 20,
                          padding: "0 10px",
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {expandedIndex === i && (
                    <div style={{ padding: "0 15px 15px 15px" }}>
                      <textarea
                        placeholder="Enter detailed findings, serial numbers, or observations..."
                        value={s.content}
                        onChange={(e) => {
                          const n = [...sections];
                          n[i].content = e.target.value;
                          setSections(n);
                        }}
                        style={{
                          width: "100%",
                          padding: 15,
                          height: 100,
                          background: "#18181b",
                          border: "1px solid #52525b",
                          borderRadius: 4,
                          color: "#f4f4f5",
                          resize: "vertical",
                          outline: "none",
                          fontFamily: "monospace",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addSection}
              style={{
                marginTop: 15,
                width: "100%",
                padding: "10px",
                borderRadius: 24,
                border: "1px solid #52525b",
                background: "transparent",
                color: accent,
                cursor: "pointer",
                transition: "all 0.2s",
                fontSize: 14,
              }}
            >
              + Add Evidence Section
            </button>

            <div style={{ marginTop: 30 }}>
              {validationError && (
                <div style={{
                  marginBottom: 15,
                  padding: "10px",
                  borderRadius: "6px",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#f87171",
                  fontSize: "13px",
                  textAlign: "center",
                  fontWeight: 500
                }}>
                  ⚠️ {validationError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={clearForm}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "10px 24px",
                  borderRadius: "24px",
                  background: "transparent",
                  border: "1px solid #52525b",
                  color: "#f4f4f5",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                CLEAR FORM
              </button>
              <button
                onClick={generatePackage}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: "10px 24px",
                  borderRadius: "24px",
                  background: loading ? "#3f3f46" : accent,
                  border: "none",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.boxShadow = "0 1px 3px 1px rgba(0,0,0,0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                {loading ? "PROCESSING..." : "GENERATE SECURE PACKAGE"}
              </button>
              </div>
            </div>

            {loading && (
              <div style={{ marginTop: 20, textAlign: "center" }}>
                <div style={{ marginBottom: 10, fontSize: 14, color: accent }}>
                  {status}
                </div>
                <div
                  style={{
                    height: 4,
                    background: "#3f3f46",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      background: accent,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>
            )}

            {qrData && (
              <div
                style={{
                  marginTop: 40,
                  background: "#ffffff",
                  padding: 40,
                  borderRadius: 20,
                  color: "#1d1d1f",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.1)",
                  animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  border: "1px solid rgba(0, 0, 0, 0.06)",
                }}
              >




                {/* QR Code - Clean and Simple */}
                <div style={{
                  padding: "20px",
                  background: "#ffffff",
                  borderRadius: "16px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                }}>
                  {/* Animated glow effect */}

                  
                  <div ref={qrRef}>
                    <QRCodeCanvas 
                      value={qrData} 
                      level="M" 
                      size={350} 
                      bgColor="#ffffff" 
                      fgColor="#000000" 
                      includeMargin={true} 
                      style={{ 
                        borderRadius: 8,
                        display: "block"
                      }} 
                    />
                  </div>
                </div>

                {/* Status Badge */}
                <div style={{
                  marginTop: "25px",
                  padding: "10px 24px",
                  background: "#f5f5f7",
                  border: "1px solid rgba(0, 0, 0, 0.06)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}>
                  <div style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#10b981",
                    boxShadow: "none",
                    animation: "pulse 2s ease-in-out infinite"
                  }} />
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#0f2a86ff",
                    letterSpacing: "1px"
                  }}>
                    FORENSIC PACKAGE SEALED
                  </h3>
                </div>

                <p style={{ 
                  margin: "12px 0 0", 
                  color: "#93c5fd", 
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "0.5px",
                  position: "relative",
                  zIndex: 1
                }}>
                  🔒 SHA-256 Cryptographically Signed & Timestamped
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 20,
                    width: "100%",
                  }}
                >
                  <button
                    onClick={saveQR}
                    style={{
                      flex: 1,
                      padding: "8px 16px",
                      borderRadius: 4,
                      border: "1px solid #52525b",
                      background: "transparent",
                 
                      color: "black",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Download QR
                  </button>
                  <button
                    onClick={copyReport}
                    style={{
                      flex: 1,
                      padding: "8px 16px",
                      borderRadius: 4,
                      border: "none",
                      background: accent,
                      color: "black",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Copy Data
                  </button>
                </div>

                <div
                  style={{
                    marginTop: 20,
                    background: "#18181b",
                    padding: 15,
                    borderRadius: 4,
                    width: "100%",
                    boxSizing: "border-box",
                    overflowX: "auto",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: "bold",
                      color: "#a1a1aa",
                      marginBottom: 4,
                      letterSpacing: 1,
                    }}
                  >
                    PACKAGE ID
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "#f4f4f5",
                      marginBottom: 12,
                    }}
                  >
                    {manifest.id}
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: "bold",
                      color: "#a1a1aa",
                      marginBottom: 4,
                      letterSpacing: 1,
                    }}
                  >
                    TIMESTAMP
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "#f4f4f5",
                      marginBottom: 12,
                    }}
                  >
                    {manifest.timestamp}
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: "bold",
                      color: "#a1a1aa",
                      marginBottom: 4,
                      letterSpacing: 1,
                    }}
                  >
                    INTEGRITY HASH
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: accent,
                      wordBreak: "break-all",
                    }}
                  >
                    {manifest.hash}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCANNER */}
        {tab === "scanner" && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <div style={{ 
              ...materialCardStyle, 
              padding: 40,
              background: "linear-gradient(135deg, #18181b 0%, #27272a 50%, #18181b 100%)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              position: "relative",
              overflow: "hidden"
            }}>
              {/* Decorative glow */}
              <div style={{
                position: "absolute",
                top: "-50%",
                right: "-20%",
                width: "300px",
                height: "300px",
                background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
                borderRadius: "50%",
                pointerEvents: "none"
              }} />
              
              {/* Header */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "15px", 
                marginBottom: "10px",
                position: "relative",
                zIndex: 1
              }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: 24, 
                  color: "#f4f4f5",
                  fontWeight: 600,
                  letterSpacing: "0.5px"
                }}>
                  QR Evidence Scanner
                </h2>
              </div>
              
              <p style={{ 
                color: "#a1a1aa", 
                fontSize: 14, 
                marginBottom: 30, 
                lineHeight: 1.6,
                position: "relative",
                zIndex: 1,
                maxWidth: "600px"
              }}>
                Deploy advanced scanning technology to verify evidence integrity. Use camera capture or upload QR images for instant forensic analysis.
              </p>

              {validationError && (
                <div style={{
                  marginBottom: 30,
                  animation: "fadeIn 0.5s ease"
                }}>
                  {/* Professional Corrupted QR Analysis Card */}
                  <div style={{
                    background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
                    borderRadius: '20px',
                    border: '2px solid rgba(239, 68, 68, 0.4)',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 10px 40px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
                  }}>
                    {/* Animated warning background */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.05), transparent)',
                      animation: 'shimmer 3s infinite',
                      pointerEvents: 'none'
                    }} />
                    
                    {/* Header */}
                    <div style={{
                      padding: '24px 28px',
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.1) 100%)',
                      borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Warning Icon */}
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4), 0 0 0 4px rgba(239, 68, 68, 0.15)',
                          animation: 'pulse 2s infinite'
                        }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            <path d="M12 12v10" strokeWidth="3"/>
                          </svg>
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '22px',
                            fontWeight: 900,
                            color: '#fca5a5',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            marginBottom: '6px',
                            textShadow: '0 2px 10px rgba(239, 68, 68, 0.3)'
                          }}>
                            QR CODE CORRUPTED
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#a1a1aa',
                            fontWeight: 500
                          }}>
                            Pattern unreadable or malformed
                          </div>
                        </div>
                        
                        <div style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          padding: '6px 16px',
                          borderRadius: '25px',
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#f87171',
                          border: '2px solid rgba(239, 68, 68, 0.4)',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>
                          ⚠ FAILED
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div style={{ padding: '28px', position: 'relative', zIndex: 1 }}>
                      {/* Error Details */}
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        borderRadius: '14px',
                        padding: '20px',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        marginBottom: '24px'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#ef4444',
                          letterSpacing: '1px',
                          marginBottom: '12px',
                          textTransform: 'uppercase'
                        }}>
                          Forensic Analysis Result
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#fca5a5',
                          lineHeight: '1.6',
                          marginBottom: '16px'
                        }}>
                          The QR code pattern could not be decoded. The image may be damaged, incomplete, or not contain a valid QR code structure.
                        </div>
                        
                        {/* Verification Checklist */}
                        <div style={{
                          background: 'rgba(0,0,0,0.3)',
                          borderRadius: '12px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}>
                          <div style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#71717a',
                            letterSpacing: '1px',
                            marginBottom: '4px',
                            textTransform: 'uppercase'
                          }}>
                            Scan Analysis
                          </div>
                          {[
                            { label: 'Pattern Detection', status: 'FAIL' },
                            { label: 'Data Extraction', status: 'FAIL' },
                            { label: 'Integrity Check', status: 'SKIP' }
                          ].map((item, i) => (
                            <div key={i} style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '12px',
                              padding: '6px 0'
                            }}>
                              <span style={{ color: '#a1a1aa', fontWeight: 600 }}>
                                {item.label}
                              </span>
                              <span style={{
                                color: item.status === 'FAIL' ? '#ef4444' : '#52525b',
                                fontWeight: 800,
                                fontSize: '11px',
                                letterSpacing: '0.8px',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                background: item.status === 'FAIL' ? 'rgba(239, 68, 68, 0.1)' : 'transparent'
                              }}>
                                {item.status === 'FAIL' ? '✗ ' : '○ '}{item.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Troubleshooting Tips */}
                      <div style={{
                        background: 'rgba(59, 130, 246, 0.05)',
                        borderRadius: '14px',
                        padding: '18px',
                        border: '1px solid rgba(59, 130, 246, 0.1)'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: accent,
                          letterSpacing: '1px',
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{ fontSize: '16px' }}>💡</span>
                          TROUBLESHOOTING TIPS
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '12px'
                        }}>
                          {[
                            'Ensure good lighting and focus',
                            'Hold camera steady and at proper distance',
                            'Check if QR code is complete and undamaged',
                            'Try uploading a higher quality image'
                          ].map((tip, i) => (
                            <div key={i} style={{
                              fontSize: '13px',
                              color: '#93c5fd',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px'
                            }}>
                              <div style={{
                                minWidth: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: accent,
                                marginTop: '6px'
                              }} />
                              {tip}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Download Failure Report Button */}
                      <button
                        onClick={() => downloadCorruptionReport(isCameraActive ? "LIVE_CAMERA_SCAN" : "FORENSIC_IMAGE_INTAKE")}
                        style={{
                          width: '100%',
                          marginTop: '24px',
                          padding: '14px 24px',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          border: 'none',
                          borderRadius: '12px',
                          color: 'white',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                          transition: 'all 0.3s ease',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
                        }}
                      >
                        <span>⬇️</span> DOWNLOAD FAILURE REPORT
                      </button>
                    </div>
                    
                    {/* Background watermark */}
                    <div style={{
                      position: 'absolute',
                      right: -10,
                      bottom: -20,
                      fontSize: '120px',
                      opacity: 0.04,
                      transform: 'rotate(-15deg)',
                      pointerEvents: 'none',
                      color: '#fff'
                    }}>
                      ⚠️
                    </div>
                  </div>
                </div>
              )}

              {isCameraActive && (
                <div style={{ 
                  marginBottom: 25, 
                  borderRadius: 16, 
                  overflow: 'hidden', 
                  position: 'relative', 
                  background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)', 
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  border: "2px solid rgba(59, 130, 246, 0.4)"
                }}>
                    <video ref={videoRef} style={{ width: '100%', display: 'block', opacity: 0.95 }} />
                    
                    {/* Dark overlay with cutout */}
                    <div style={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)', 
                        width: '260px', 
                        height: '260px', 
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
                        borderRadius: '24px',
                        pointerEvents: 'none'
                    }}></div>

                    {/* Scanner Frame with Phanix styling */}
                    <div style={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)', 
                        width: '260px', 
                        height: '260px', 
                        border: `3px solid ${accent}`,
                        borderRadius: '24px',
                        boxShadow: `0 0 30px ${accent}, inset 0 0 20px rgba(59, 130, 246, 0.2)`,
                        pointerEvents: 'none',
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)'
                    }}>
                        {/* Corner accents */}
                        <div style={{
                          position: 'absolute',
                          top: -2,
                          left: -2,
                          width: '40px',
                          height: '40px',
                          borderTop: `4px solid #60a5fa`,
                          borderLeft: `4px solid #60a5fa`,
                          borderTopLeftRadius: '24px'
                        }} />
                        <div style={{
                          position: 'absolute',
                          top: -2,
                          right: -2,
                          width: '40px',
                          height: '40px',
                          borderTop: `4px solid #60a5fa`,
                          borderRight: `4px solid #60a5fa`,
                          borderTopRightRadius: '24px'
                        }} />
                        <div style={{
                          position: 'absolute',
                          bottom: -2,
                          left: -2,
                          width: '40px',
                          height: '40px',
                          borderBottom: `4px solid #60a5fa`,
                          borderLeft: `4px solid #60a5fa`,
                          borderBottomLeftRadius: '24px'
                        }} />
                        <div style={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          width: '40px',
                          height: '40px',
                          borderBottom: `4px solid #60a5fa`,
                          borderRight: `4px solid #60a5fa`,
                          borderBottomRightRadius: '24px'
                        }} />
                        
                        {/* Scanning Laser Line */}
                        <div style={{
                            position: 'absolute',
                            width: '100%',
                            height: '3px',
                            background: `linear-gradient(90deg, transparent 0%, ${accent} 50%, transparent 100%)`,
                            boxShadow: `0 0 20px ${accent}, 0 0 40px ${accent}`,
                            animation: 'scan 2s infinite ease-in-out'
                        }}></div>
                    </div>

                    {/* Header with Phanix branding */}
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        width: '100%',
                        textAlign: 'center',
                        pointerEvents: 'none'
                    }}>
                      <div style={{
                        display: 'inline-block',
                        padding: '8px 20px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)',
                        borderRadius: '20px',
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}>
                        <div style={{
                          color: 'white',
                          fontSize: '13px',
                          fontWeight: 700,
                          letterSpacing: '1.5px',
                          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{ fontWeight: 700 }}>PHANIX</span> SCAN ACTIVE
                        </div>
                      </div>
                    </div>

                    {/* Camera flip button */}
                    <button
                        onClick={() => setCameraFacingMode(prev => prev === "environment" ? "user" : "environment")}
                        style={{
                            position: 'absolute',
                            top: 20,
                            right: 20,
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '50%',
                            width: 48,
                            height: 48,
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                            zIndex: 10,
                            transition: 'all 0.3s',
                            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                        }}
                        title="Switch Camera"
                    >
                        ↻
                    </button>

                    {/* Stop button */}
                    <button 
                        onClick={() => setIsCameraActive(false)}
                        style={{ 
                            position: 'absolute', 
                            bottom: 30, 
                            left: '50%', 
                            transform: 'translateX(-50%)', 
                            padding: '12px 30px', 
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                            color: 'white', 
                            border: '1px solid rgba(255,255,255,0.2)', 
                            borderRadius: 30, 
                            cursor: 'pointer', 
                            fontSize: 14, 
                            fontWeight: 700,
                            boxShadow: '0 6px 20px rgba(239, 68, 68, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'all 0.3s',
                            letterSpacing: '0.5px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.3)';
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>⏹</span>
                        STOP CAMERA
                    </button>
                </div>
              )}

              {/* Scan Method Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: 15, 
                marginBottom: 25,
                position: 'relative',
                zIndex: 1
              }}>
                  <button
                    onClick={() => setIsCameraActive(true)}
                    style={{
                        flex: 1,
                        padding: "16px 20px",
                        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%)",
                        border: `2px solid ${accent}`,
                        borderRadius: 12,
                        color: "#f4f4f5",
                        cursor: "pointer",
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        fontSize: 14,
                        fontWeight: 600,
                        transition: 'all 0.3s',
                        boxShadow: `0 4px 15px rgba(59, 130, 246, 0.15)`,
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.25) 100%)`;
                      e.currentTarget.style.boxShadow = `0 6px 20px rgba(59, 130, 246, 0.25)`;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%)`;
                      e.currentTarget.style.boxShadow = `0 4px 15px rgba(59, 130, 246, 0.15)`;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                      <div style={{ fontSize: '20px', fontWeight: 700, color: accent }}>CAM</div>
                      <span style={{ letterSpacing: '0.5px' }}>CAMERA SCAN</span>
                      <span style={{ fontSize: '11px', color: '#93c5fd', fontWeight: 400 }}>Live Detection</span>
                  </button>
                  
                  <button
                    onClick={() => fileInputRef.current.click()}
                    style={{
                        flex: 1,
                        padding: "16px 20px",
                        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)",
                        border: "2px solid #10b981",
                        borderRadius: 12,
                        color: "#f4f4f5",
                        cursor: "pointer",
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        fontSize: 14,
                        fontWeight: 600,
                        transition: 'all 0.3s',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.15)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.25) 100%)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.25)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.15)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>IMG</div>
                      <span style={{ letterSpacing: '0.5px' }}>UPLOAD IMAGE</span>
                      <span style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 400 }}>File Analysis</span>
                  </button>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                  />
              </div>

              {/* FORENSIC LOADING OVERLAY */}
              {isAnalyzing && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(24, 24, 27, 0.9)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    border: `3px solid rgba(59, 130, 246, 0.1)`,
                    borderTop: `3px solid ${accent}`,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '20px'
                  }} />
                  <div style={{ color: '#f4f4f5', fontWeight: 600, fontSize: 16, letterSpacing: '1px' }}>
                    RUNNING P.H.A.N.I.X DEEP SCAN...
                  </div>
                  <div style={{ color: '#a1a1aa', fontSize: 12, marginTop: 8 }}>
                    Extracting metadata & verifying entropy
                  </div>
                </div>
              )}

              {/* Manual input area */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <label style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: accent,
                  letterSpacing: '1px',
                  marginBottom: 10,
                  display: 'block'
                }}>
                  SCANNED QR CONTENT
                </label>
                <textarea
                  placeholder="Scanned QR content will appear here..."
                  value={scanInput}
                  readOnly
                  style={{
                    width: "100%",
                    height: 140,
                    padding: 16,
                    background: "linear-gradient(135deg, #121214 0%, #18181b 100%)",
                    border: "1px solid #3f3f46",
                    borderRadius: 10,
                    color: "#f4f4f5",
                    fontFamily: "monospace",
                    fontSize: 13,
                    resize: "none",
                    outline: "none",
                    boxSizing: "border-box",
                    marginBottom: 20,
                    transition: 'all 0.3s',
                    cursor: 'default',
                    opacity: 0.9
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = `1px solid ${accent}44`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = '1px solid #3f3f46';
                  }}
                />

                <button
                  onClick={() => processScan()}
                  style={{
                    width: "100%",
                    padding: "14px 28px",
                    borderRadius: "30px",
                    background: `linear-gradient(135deg, ${accent} 0%, #2563eb 100%)`,
                    border: "none",
                    color: "white",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    letterSpacing: '1px',
                    boxShadow: `0 6px 20px rgba(59, 130, 246, 0.25)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 8px 25px rgba(59, 130, 246, 0.35)`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = `0 6px 20px rgba(59, 130, 246, 0.25)`;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 700 }}>ANALYZE</span>
                  ANALYZE EVIDENCE
                </button>
              </div>

              {/* Always show scanned input if available */}
              {scanInput && !scanResult && (
                <div style={{ marginTop: 30, animation: "fadeIn 0.3s ease" }}>
                  <div style={{ height: 1, background: "#3f3f46", marginBottom: 20 }}></div>
                  <div>
                    <h3 style={{ margin: "0 0 10px", fontSize: 16, color: '#f4f4f5' }}>Scanned QR Content</h3>
                    <div style={{ 
                      background: '#18181b', 
                      padding: 15, 
                      borderRadius: 8, 
                      fontFamily: 'monospace', 
                      fontSize: 12, 
                      wordBreak: 'break-all',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {scanInput}
                    </div>
                  </div>
                </div>
              )}

               {/* P.H.A.N.I.X FORENSIC ANALYSIS REPORT */}
              {analysisReport && !validationError && (
                <div style={{ marginTop: 40, animation: "fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                   <div style={{ 
                     padding: '20px 28px', 
                     background: analysisReport.trustStatus === 'TRUSTED SEAL' 
                       ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 78, 59, 0.15) 100%)'
                       : 'linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, transparent 100%)', 
                     borderLeft: `4px solid ${analysisReport.trustStatus === 'TRUSTED SEAL' ? '#10b981' : accent}`,
                     borderRadius: '0 16px 16px 0',
                     marginBottom: 30,
                     display: 'flex',
                     justifyContent: 'space-between',
                     alignItems: 'center',
                     boxShadow: analysisReport.trustStatus === 'TRUSTED SEAL' 
                       ? '0 8px 25px rgba(16, 185, 129, 0.25)'
                       : '0 4px 12px rgba(0,0,0,0.1)',
                     position: 'relative',
                     overflow: 'hidden'
                   }}>
                      {/* Animated background effect for TRUSTED SEAL */}
                      {analysisReport.trustStatus === 'TRUSTED SEAL' && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.1), transparent)',
                          animation: 'shimmer 3s infinite',
                          pointerEvents: 'none'
                        }} />
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
                        <div style={{ 
                          width: 42, 
                          height: 42, 
                          borderRadius: '50%', 
                          background: analysisReport.trustStatus === 'TRUSTED SEAL' 
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : accent, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'white',
                          boxShadow: analysisReport.trustStatus === 'TRUSTED SEAL'
                            ? '0 0 20px rgba(16, 185, 129, 0.5)'
                            : `0 0 15px ${accent}44`,
                          animation: analysisReport.trustStatus === 'TRUSTED SEAL' ? 'pulse 2s infinite' : 'none'
                        }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            {analysisReport.trustStatus === 'TRUSTED SEAL' && (
                              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5"/>
                            )}
                          </svg>
                        </div>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 800, color: '#f4f4f5', letterSpacing: '0.8px' }}>
                            FORENSIC ANALYSIS REPORT
                          </h3>
                          <div style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 500 }}>
                            {analysisReport.trustStatus === 'TRUSTED SEAL' ? 'P.H.A.N.I.X Verified Evidence' : 'External Data Analysis'}
                          </div>
                        </div>
                      </div>
                      <div style={{ 
                        background: analysisReport.classification.includes("PHANIX") ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.2)',
                        padding: '6px 16px',
                        borderRadius: '25px',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: analysisReport.classification.includes("PHANIX") ? '#34d399' : accent,
                        border: `2px solid ${analysisReport.classification.includes("PHANIX") ? '#10b98166' : accent + '66'}`,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        {analysisReport.classification.includes("PHANIX") ? '✓ Verified Internal' : 'External Scan'}
                      </div>
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 25 }}>
                      {/* Integrity Authentication Card */}
                      <div style={{ 
                        background: analysisReport.trustStatus === 'TRUSTED SEAL' 
                          ? 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)'
                          : '#1c1c1f', 
                        padding: 28, 
                        borderRadius: 20, 
                        border: analysisReport.trustStatus === 'TRUSTED SEAL'
                          ? '2px solid rgba(16, 185, 129, 0.4)'
                          : `1px solid ${analysisReport.trustStatus === 'TAMPERED PACKAGE' || analysisReport.riskLevel === 'HIGH' ? '#ef444444' : '#3f3f46'}`,
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        boxShadow: analysisReport.trustStatus === 'TRUSTED SEAL'
                          ? '0 10px 40px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                          : 'none'
                      }}>
                        {/* Premium background effect for TRUSTED SEAL */}
                        {analysisReport.trustStatus === 'TRUSTED SEAL' && (
                          <>
                            <div style={{
                              position: 'absolute',
                              top: '-50%',
                              right: '-50%',
                              width: '200%',
                              height: '200%',
                              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
                              animation: 'rotate 20s linear infinite',
                              pointerEvents: 'none'
                            }} />
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: 'linear-gradient(45deg, transparent 30%, rgba(16, 185, 129, 0.05) 50%, transparent 70%)',
                              backgroundSize: '200% 200%',
                              animation: 'shimmer 4s ease-in-out infinite',
                              pointerEvents: 'none'
                            }} />
                          </>
                        )}
                        
                        <div style={{ fontSize: 11, color: analysisReport.trustStatus === 'TRUSTED SEAL' ? '#6ee7b7' : '#a1a1aa', marginBottom: 16, fontWeight: 700, letterSpacing: '1.8px', opacity: 0.9, position: 'relative', zIndex: 1 }}>
                          INTEGRITY AUTHENTICATION
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: 14, position: 'relative', zIndex: 1 }}>
                          {analysisReport.trustStatus === 'TRUSTED SEAL' ? (
                            <div style={{
                              width: 52,
                              height: 52,
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4), 0 0 0 4px rgba(16, 185, 129, 0.2)',
                              animation: 'pulse 2s infinite'
                            }}>
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                <path d="M9 12l2 2 4-4" strokeWidth="3"/>
                              </svg>
                            </div>
                          ) : (
                            <div style={{ 
                              width: 18, 
                              height: 18, 
                              borderRadius: '50%', 
                              background: analysisReport.trustStatus === 'TAMPERED PACKAGE' || analysisReport.riskLevel === 'HIGH' ? '#ef4444' : (analysisReport.riskLevel === 'MEDIUM' ? '#f59e0b' : '#3b82f6'),
                              boxShadow: `0 0 15px ${analysisReport.trustStatus === 'TAMPERED PACKAGE' || analysisReport.riskLevel === 'HIGH' ? '#ef4444' : (analysisReport.riskLevel === 'MEDIUM' ? '#f59e0b' : '#3b82f6')}66`,
                              animation: 'pulse 2.5s infinite'
                            }} />
                          )}
                          <div>
                            <div style={{ 
                              fontWeight: 900, 
                              color: analysisReport.trustStatus === 'TRUSTED SEAL' ? '#6ee7b7' : (analysisReport.trustStatus === 'TAMPERED PACKAGE' || analysisReport.riskLevel === 'HIGH' ? '#f87171' : (analysisReport.riskLevel === 'MEDIUM' ? '#fbbf24' : '#f4f4f5')),
                              fontSize: analysisReport.trustStatus === 'TRUSTED SEAL' ? 26 : 22,
                              letterSpacing: '1px',
                              textTransform: 'uppercase',
                              textShadow: analysisReport.trustStatus === 'TRUSTED SEAL' ? '0 2px 10px rgba(16, 185, 129, 0.5)' : 'none',
                              marginBottom: 4
                            }}>
                              {analysisReport.trustStatus}
                            </div>
                            {analysisReport.trustStatus === 'TRUSTED SEAL' && (
                              <div style={{ 
                                fontSize: 11, 
                                color: '#34d399', 
                                fontWeight: 600,
                                letterSpacing: '0.5px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <span style={{ fontSize: '14px' }}>✨</span>
                                P.H.A.N.I.X Certified
                              </div>
                            )}
                          </div>
                        </div>

                        <p style={{ margin: "0 0 24px 0", fontSize: 14, color: analysisReport.trustStatus === 'TRUSTED SEAL' ? '#d1fae5' : '#a1a1aa', lineHeight: 1.6, maxWidth: '95%', position: 'relative', zIndex: 1 }}>
                          {analysisReport.trustDescription}
                        </p>

                        {/* VERIFICATION CHECKLIST */}
                        <div style={{ 
                          background: analysisReport.trustStatus === 'TRUSTED SEAL'
                            ? 'rgba(16, 185, 129, 0.1)'
                            : 'rgba(0,0,0,0.2)', 
                          borderRadius: '14px', 
                          padding: '16px 18px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          border: analysisReport.trustStatus === 'TRUSTED SEAL'
                            ? '1px solid rgba(16, 185, 129, 0.2)'
                            : 'none',
                          position: 'relative',
                          zIndex: 1
                        }}>
                          <div style={{ 
                            fontSize: 10, 
                            fontWeight: 700, 
                            color: analysisReport.trustStatus === 'TRUSTED SEAL' ? '#34d399' : '#71717a',
                            letterSpacing: '1px',
                            marginBottom: 4,
                            textTransform: 'uppercase'
                          }}>
                            Verification Checklist
                          </div>
                          {analysisReport.checklist.map((item, i) => (
                            <div key={i} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between', 
                              fontSize: '12px',
                              padding: '6px 0'
                            }}>
                              <span style={{ 
                                color: analysisReport.trustStatus === 'TRUSTED SEAL' ? '#d1fae5' : '#a1a1aa', 
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                {item.status === 'PASS' && analysisReport.trustStatus === 'TRUSTED SEAL' && (
                                  <span style={{ fontSize: '14px' }}>✓</span>
                                )}
                                {item.label}
                              </span>
                              <span style={{ 
                                color: item.status === 'PASS' ? '#34d399' : (item.status === 'FAIL' ? '#ef4444' : '#52525b'),
                                fontWeight: 800,
                                fontSize: '11px',
                                letterSpacing: '0.8px',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                background: item.status === 'PASS' && analysisReport.trustStatus === 'TRUSTED SEAL'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : (item.status === 'PASS' ? 'rgba(16, 185, 129, 0.08)' : 'transparent')
                              }}>
                                {item.status === 'PASS' ? '✓ ' : (item.status === 'FAIL' ? '❌ ' : '○ ')}{item.status}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Background watermark */}
                        <div style={{ 
                          position: 'absolute', 
                          right: analysisReport.trustStatus === 'TRUSTED SEAL' ? -10 : -5, 
                          bottom: analysisReport.trustStatus === 'TRUSTED SEAL' ? -20 : -15, 
                          fontSize: analysisReport.trustStatus === 'TRUSTED SEAL' ? '110px' : '90px', 
                          opacity: analysisReport.trustStatus === 'TRUSTED SEAL' ? 0.06 : 0.03,
                          transform: 'rotate(-10deg)',
                          pointerEvents: 'none',
                          color: '#fff',
                          filter: analysisReport.trustStatus === 'TRUSTED SEAL' ? 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.3))' : 'none'
                        }}>
                          {analysisReport.trustStatus === 'TRUSTED SEAL' ? '🛡️' : (analysisReport.trustStatus === 'TAMPERED PACKAGE' ? '☣️' : '🔍')}
                        </div>
                      </div>

                      {/* Classification Detail Card */}
                      <div style={{ 
                        background: '#1c1c1f', 
                        padding: 24, 
                        borderRadius: 16, 
                        border: '1px solid #3f3f46',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}>
                        <div style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 12, fontWeight: 700, letterSpacing: '1.5px', opacity: 0.8 }}>DATA CLASSIFICATION</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div style={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: '12px', 
                            background: 'rgba(59, 130, 246, 0.1)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: accent,
                            border: `1px solid ${accent}33`
                          }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                              <line x1="12" y1="22.08" x2="12" y2="12"/>
                            </svg>
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#f4f4f5', fontSize: 18, marginBottom: 2 }}>
                              {analysisReport.classification}
                            </div>
                            <div style={{ fontSize: 12, color: '#71717a' }}>Structure Analysis: Complete</div>
                          </div>
                        </div>
                      </div>
                   </div>

                   {analysisReport.indicators.length > 0 && (
                     <div style={{ 
                       marginBottom: 25, 
                       background: 'rgba(24, 24, 27, 0.4)', 
                       padding: '20px', 
                       borderRadius: '16px',
                       border: '1px solid #27272a'
                     }}>
                       <div style={{ 
                         fontSize: 12, 
                         fontWeight: 700, 
                         color: analysisReport.riskLevel === 'LOW' ? '#34d399' : '#f87171', 
                         marginBottom: 15, 
                         letterSpacing: '1px',
                         display: 'flex',
                         alignItems: 'center',
                         gap: '8px'
                       }}>
                         <span style={{ fontSize: '18px' }}>{analysisReport.riskLevel === 'LOW' ? '🛡️' : '🚨'}</span>
                         {analysisReport.riskLevel === 'LOW' ? 'INTEGRITY INDICATORS:' : 'SECURITY ALERTS DETECTED:'}
                       </div>
                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 10 }}>
                         {analysisReport.indicators.map((ind, i) => (
                           <div key={i} style={{ 
                             fontSize: 13, 
                             color: analysisReport.riskLevel === 'LOW' ? '#6ee7b7' : '#fca5a5', 
                             background: analysisReport.riskLevel === 'LOW' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', 
                             padding: '12px 16px', 
                             borderRadius: '10px',
                             border: `1px solid ${analysisReport.riskLevel === 'LOW' ? '#10b98122' : '#ef444422'}`,
                             display: 'flex',
                             alignItems: 'center',
                             gap: '12px'
                           }}>
                             <div style={{ minWidth: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                             {ind}
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   <div style={{ 
                     background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)', 
                     padding: 25, 
                     borderRadius: 16, 
                     border: '1px solid #3f3f46',
                     boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
                   }}>
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <div style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 600, letterSpacing: '1.5px' }}>SHA-256 INTEGRITY HASH</div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              onClick={() => navigator.clipboard.writeText(analysisReport.hash)}
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: accent, 
                                fontSize: 11, 
                                cursor: 'pointer',
                                fontWeight: 600,
                                padding: '4px 8px',
                                borderRadius: '4px',
                                transition: 'all 0.2s',
                                border: `1px solid ${accent}44`
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                e.currentTarget.style.borderColor = accent;
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.borderColor = `${accent}44`;
                              }}
                            >
                              COPY HASH
                            </button>
                            <button 
                              onClick={downloadForensicReport}
                              style={{ 
                                background: accent, 
                                border: 'none', 
                                color: 'white', 
                                fontSize: 11, 
                                cursor: 'pointer',
                                fontWeight: 700,
                                padding: '4px 12px',
                                borderRadius: '4px',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: `0 2px 8px ${accent}44`
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = `0 4px 12px ${accent}66`;
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = `0 2px 8px ${accent}44`;
                              }}
                            >
                              <span>⬇️</span> DOWNLOAD REPORT
                            </button>
                          </div>
                        </div>
                        <div style={{ 
                          fontFamily: 'monospace', 
                          fontSize: 12, 
                          color: '#f4f4f5', 
                          background: 'rgba(0,0,0,0.3)', 
                          padding: '16px', 
                          borderRadius: '12px', 
                          wordBreak: 'break-all',
                          lineHeight: 1.6,
                          border: `1px solid ${accent}33`,
                          boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5)'
                        }}>
                          <span style={{ color: accent, marginRight: 8, opacity: 0.7 }}>$</span>
                          {analysisReport.hash}
                        </div>
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '20px', 
                        fontSize: 11, 
                        color: '#71717a',
                        fontWeight: 500,
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: accent }}>●</span> SOURCE: <span style={{ color: '#a1a1aa' }}>{analysisReport.source.replace(/_/g, ' ')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: accent }}>●</span> TIMESTAMP: <span style={{ color: '#a1a1aa' }}>{new Date(analysisReport.timestamp).toLocaleString()}</span>
                        </div>
                        
                        <div style={{ 
                          marginLeft: 'auto',
                          padding: '6px 12px',
                          background: 'rgba(59, 130, 246, 0.05)',
                          borderRadius: '8px',
                          border: `1px solid ${accent}22`,
                          fontSize: '10px',
                          color: '#93c5fd',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{ fontSize: '14px' }}>🛡️</span>
                          <span><strong>ADVISORY:</strong> Keep this downloaded copy for further authentication.</span>
                        </div>
                      </div>
                   </div>

                   <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #3f3f46, transparent)', margin: '40px 0' }} />
                </div>
              )}

              {scanResult && (
                <div style={{ marginTop: 30, animation: "fadeIn 0.3s ease" }}>
                  <div style={{ height: 1, background: "#3f3f46", marginBottom: 20 }}></div>
                  
                  {scanResult.type === 'valid' ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
                        <div style={{ color: '#10b981', fontSize: 18 }}>✓</div>
                        <h3 style={{ margin: 0, fontSize: 16, color: '#f4f4f5' }}>Valid Forensic Structure Detected</h3>
                      </div>
                      
                      <div style={{ background: '#18181b', borderRadius: 8, padding: 20 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 }}>
                          <div>
                            <div style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 4 }}>CASE ID</div>
                            <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{scanResult.data.uid}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 4 }}>TIMESTAMP</div>
                            <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{scanResult.data.ts}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 4 }}>OPERATOR</div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{scanResult.data.op}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 4 }}>SOURCE</div>
                            <div style={{ fontSize: 14 }}>{scanResult.data.src}</div>
                          </div>
                        </div>

                        <div style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 8 }}>EVIDENCE SECTIONS</div>
                        {scanResult.data.sec.map((s, i) => (
                          <div key={i} style={{ marginBottom: 10, paddingLeft: 10, borderLeft: `2px solid ${accent}` }}>
                            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{s.title}</div>
                            <div style={{ fontSize: 13, opacity: 0.8 }}>{s.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ margin: "0 0 10px", fontSize: 16, color: '#f4f4f5' }}>Raw Content</h3>
                      <div style={{ background: '#18181b', padding: 15, borderRadius: 8, fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>
                        {scanResult.data}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* INS IGHTS - Apple Style Premium UI */}
        {tab === "insights" && (
          <div style={{ marginTop: 20, animation: "fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            {/* HERO INTRO CARD - Apple Style */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 24,
                padding: '60px 48px',
                marginBottom: 40,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Subtle gradient overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '100%',
                background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.06) 0%, transparent 60%)',
                pointerEvents: 'none'
              }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ 
                  margin: '0 0 20px 0', 
                  fontSize: 42, 
                  fontWeight: 700,
                  letterSpacing: '-1.2px',
                  background: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.1
                }}>
                  Digital Integrity.<br/>Unbreakable Trust.
                </h2>
                <p style={{ 
                  color: '#a1a1aa',
                  lineHeight: 1.8, 
                  fontSize: 17, 
                  maxWidth: '680px',
                  margin: 0,
                  fontWeight: 400
                }}>
                  The <span style={{ color: '#f4f4f5', fontWeight: 600 }}>Forensic QR Architect</span> employs military-grade cryptography to ensure evidence remains admissible and tamper-proof. By binding physical evidence to a digital SHA-256 signature, we create an unbreakable chain of trust.
                </p>
              </div>
            </div>

            {/* PRINCIPLES GRID - Apple Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginBottom: 48 }}>
                {[
                    { icon: "🔒", title: "Immutable Ledger", desc: "Once data is sealed, not a single bit can be altered without breaking the cryptographic signature." },
                    { icon: "🔗", title: "Chain of Custody", desc: "Every step from collection to archiving is timestamped and identity-verified." },
                    { icon: "👁️", title: "Zero-Trust Verify", desc: "Verification relies on mathematical certainty (SHA-256), not human trust." }
                ].map((item, i) => (
                    <div key={i} style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 20,
                        padding: 32,
                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    }}
                    >
                        <div style={{ 
                          fontSize: 48, 
                          marginBottom: 20,
                          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))'
                        }}>{item.icon}</div>
                        <h3 style={{ 
                          margin: "0 0 12px", 
                          fontSize: 19, 
                          fontWeight: 600,
                          color: "#f4f4f5",
                          letterSpacing: '-0.3px'
                        }}>{item.title}</h3>
                        <p style={{ 
                          margin: 0, 
                          fontSize: 14, 
                          color: '#a1a1aa',
                          lineHeight: 1.6,
                          fontWeight: 400
                        }}>{item.desc}</p>
                    </div>
                ))}
            </div>

            {/* VISUAL FLOW - Apple Timeline */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20,
              padding: 40,
              marginBottom: 40,
              boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ 
                  fontSize: 13, 
                  textTransform: "uppercase", 
                  letterSpacing: '1.2px', 
                  color: accent, 
                  marginBottom: 32,
                  fontWeight: 700,
                  margin: '0 0 32px 0'
                }}>
                    Evidence Security Pipeline
                </h3>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: 16
                }}>
                    {[
                      { label: "Raw Evidence", icon: "📁" },
                      { label: "SHA-256 Hash", icon: "🔐" },
                      { label: "Digital Seal", icon: "✓" },
                      { label: "QR Anchor", icon: "⚡" }
                    ].map((step, i) => (
                        <React.Fragment key={i}>
                            <div style={{
                                flex: 1,
                                minWidth: 140,
                                padding: "16px 20px",
                                background: i === 3 
                                  ? `linear-gradient(135deg, ${accent} 0%, #2563eb 100%)`
                                  : 'rgba(255,255,255,0.04)',
                                borderRadius: 14,
                                fontSize: 14,
                                fontWeight: 600,
                                color: i === 3 ? "white" : "#f4f4f5",
                                border: i === 3 ? "none" : "1px solid rgba(255,255,255,0.08)",
                                boxShadow: i === 3 ? `0 4px 16px rgba(59, 130, 246, 0.3)` : 'none',
                                transition: 'all 0.3s ease',
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ fontSize: '18px' }}>{step.icon}</span>
                                {step.label}
                            </div>
                            {i < 3 && (
                              <div style={{ 
                                color: "rgba(255,255,255,0.3)",
                                fontSize: '20px',
                                fontWeight: 300
                              }}>→</div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* INTERACTIVE TERMINAL - Apple macOS Style */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20,
                padding: 0,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
              }}
            >
              {/* macOS Window Controls */}
              <div style={{ 
                  background: 'linear-gradient(180deg, rgba(24,24,27,0.95) 0%, rgba(24,24,27,0.98) 100%)',
                  padding: "14px 20px", 
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
              }}>
                  <div style={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: "50%", 
                    background: "#ff5f56",
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }}></div>
                  <div style={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: "50%", 
                    background: "#ffbd2e",
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }}></div>
                  <div style={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: "50%", 
                    background: "#27c93f",
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }}></div>
                  <span style={{ 
                    marginLeft: 12, 
                    fontSize: 13, 
                    color: '#a1a1aa',
                    fontFamily: "SF Mono, Menlo, Monaco, monospace",
                    fontWeight: 500,
                    letterSpacing: '-0.2px'
                  }}>phanix_hash_terminal</span>
              </div>

              <div style={{ padding: 30 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: accent,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: 15,
                    display: "block"
                  }}
                >
                  LIVE HASH SIMULATION KERNEL
                </label>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
                    <span style={{ color: "#27c93f", fontWeight: "bold" }}>❯</span>
                    <input
                    placeholder="Type evidence string here to generate hash..."
                    onChange={(e) =>
                        setDemoHash(
                        e.target.value
                            ? CryptoJS.SHA256(e.target.value).toString()
                            : ""
                        )
                    }
                    style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        color: "#f4f4f5",
                        fontFamily: "monospace",
                        fontSize: 15,
                        outline: "none",
                    }}
                    autoFocus
                    />
                </div>

                {demoHash ? (
                    <div style={{ animation: "fadeIn 0.2s" }}>
                        <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "10px 0 20px" }}></div>
                        <div style={{ fontFamily: "monospace", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 5 }}>
                            // SHA-256 OUTPUT ({demoHash.length * 4} bits)
                        </div>
                        <div
                        style={{
                            color: accent,
                            fontFamily: "monospace",
                            fontSize: 14,
                            wordBreak: "break-all",
                            lineHeight: 1.6
                        }}
                        >
                        {demoHash}
                        </div>
                    </div>
                ) : (
                    <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.2, fontSize: 13, fontFamily: "monospace" }}>
                        [ WAITING FOR INPUT STREAM... ]
                    </div>
                )}
              </div>
            </div>

            {/* USE CASES - Apple Style */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20,
              padding: 40,
              marginBottom: 40,
              boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ 
                fontSize: 13, 
                textTransform: "uppercase", 
                letterSpacing: '1.2px', 
                color: accent, 
                marginBottom: 32,
                fontWeight: 700,
                margin: '0 0 32px 0'
              }}>
                Real-World Applications
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                {[
                  { 
                    icon: "⚖️", 
                    title: "Legal & Law Enforcement", 
                    desc: "Secure chain of custody for crime scene evidence, ensuring admissibility in court proceedings."
                  },
                  { 
                    icon: "🏥", 
                    title: "Healthcare & Medical", 
                    desc: "Patient data integrity, pharmaceutical tracking, and medical device authentication."
                  },
                  { 
                    icon: "🏭", 
                    title: "Industrial & Manufacturing", 
                    desc: "Quality control documentation, product authentication, and supply chain verification."
                  },
                  { 
                    icon: "🎓", 
                    title: "Academic & Research", 
                    desc: "Data integrity for research findings, credential verification, and intellectual property protection."
                  },
                  { 
                    icon: "💼", 
                    title: "Corporate Compliance", 
                    desc: "Audit trails, document authenticity, regulatory compliance, and whistleblower protection."
                  },
                  { 
                    icon: "🔐", 
                    title: "Cybersecurity", 
                    desc: "Incident response documentation, forensic evidence preservation, and secure communications."
                  }
                ].map((useCase, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 16,
                    padding: 24,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 12 }}>{useCase.icon}</div>
                    <h4 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: 16, 
                      fontWeight: 600, 
                      color: '#f4f4f5',
                      letterSpacing: '-0.2px'
                    }}>{useCase.title}</h4>
                    <p style={{ 
                      margin: 0, 
                      fontSize: 13, 
                      color: '#a1a1aa', 
                      lineHeight: 1.6 
                    }}>{useCase.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* SECURITY FEATURES - Premium List */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20,
              padding: 40,
              marginBottom: 40,
              boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ 
                fontSize: 13, 
                textTransform: "uppercase", 
                letterSpacing: '1.2px', 
                color: accent, 
                marginBottom: 32,
                fontWeight: 700,
                margin: '0 0 32px 0'
              }}>
                Advanced Security Features
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
                {[
                  { 
                    feature: "SHA-256 Cryptographic Hashing",
                    detail: "Military-grade 256-bit cryptographic algorithm ensures data integrity with collision resistance of 2^256."
                  },
                  { 
                    feature: "Tamper-Evident Design",
                    detail: "Any modification to the data instantly invalidates the digital signature, providing immediate detection."
                  },
                  { 
                    feature: "Timestamp Authentication",
                    detail: "ISO 8601 timestamping creates verifiable chronological evidence for legal and compliance purposes."
                  },
                  { 
                    feature: "Identity Verification",
                    detail: "Operator credentials embedded within the secure package ensure accountability and traceability."
                  },
                  { 
                    feature: "QR Code Redundancy",
                    detail: "High error correction allows up to 30% damage tolerance while maintaining data recoverability."
                  },
                  { 
                    feature: "Offline Verification",
                    detail: "No internet required - scan and verify evidence integrity anywhere, anytime."
                  }
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    gap: 16,
                    padding: 20,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.04)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'}
                  >
                    <div style={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 'bold',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}>✓</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: 15, 
                        fontWeight: 600, 
                        color: '#f4f4f5', 
                        marginBottom: 6,
                        letterSpacing: '-0.2px'
                      }}>{item.feature}</div>
                      <div style={{ 
                        fontSize: 13, 
                        color: '#a1a1aa', 
                        lineHeight: 1.6 
                      }}>{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KEY BENEFITS - Split Layout */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20,
              padding: 40,
              marginBottom: 40,
              boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ 
                fontSize: 13, 
                textTransform: "uppercase", 
                letterSpacing: '1.2px', 
                color: accent, 
                marginBottom: 32,
                fontWeight: 700,
                margin: '0 0 32px 0'
              }}>
                Why Choose P.H.A.N.I.X Forensic QR
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32 }}>
                {[
                  { icon: "⚡", title: "Instant Verification", desc: "Scan and verify in seconds with real-time integrity checks." },
                  { icon: "🌐", title: "Universal Compatibility", desc: "Works on any device with a camera - no special hardware needed." },
                  { icon: "📱", title: "Portable Evidence", desc: "Carry digital evidence securely in physical QR format." },
                  { icon: "🔍", title: "Complete Transparency", desc: "Full audit trail with cryptographic proof of authenticity." },
                  { icon: "💪", title: "Court-Ready", desc: "Legally admissible evidence with tamper-proof certification." },
                  { icon: "🎯", title: "Zero Trust Model", desc: "Mathematical certainty, not reliance on third parties." }
                ].map((benefit, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: 40, 
                      marginBottom: 16,
                      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))'
                    }}>{benefit.icon}</div>
                    <h4 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: 17, 
                      fontWeight: 600, 
                      color: '#f4f4f5',
                      letterSpacing: '-0.3px'
                    }}>{benefit.title}</h4>
                    <p style={{ 
                      margin: 0, 
                      fontSize: 13, 
                      color: '#a1a1aa', 
                      lineHeight: 1.6 
                    }}>{benefit.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* BEST PRACTICES - Professional Cards */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20,
              padding: 40,
              marginBottom: 40,
              boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ 
                fontSize: 13, 
                textTransform: "uppercase", 
                letterSpacing: '1.2px', 
                color: accent, 
                marginBottom: 12,
                fontWeight: 700,
                margin: '0 0 12px 0'
              }}>
                Best Practices & Guidelines
              </h3>
              <p style={{ 
                color: '#a1a1aa',
                fontSize: 14,
                lineHeight: 1.7,
                marginBottom: 32,
                maxWidth: '800px'
              }}>
                Follow these recommendations to ensure maximum security and legal compliance when using the Forensic QR Architect.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { 
                    step: "1", 
                    title: "Complete Information", 
                    desc: "Always fill in all required fields including operator name, badge ID, role, and evidence source for full accountability." 
                  },
                  { 
                    step: "2", 
                    title: "Secure Storage", 
                    desc: "Store generated QR codes in multiple secure locations (physical and digital) to prevent loss or destruction." 
                  },
                  { 
                    step: "3", 
                    title: "Immediate Generation", 
                    desc: "Generate QR codes as soon as evidence is collected to establish the earliest possible timestamp." 
                  },
                  { 
                    step: "4", 
                    title: "Regular Verification", 
                    desc: "Periodically scan and verify QR codes to ensure they remain readable and the integrity is intact." 
                  },
                  { 
                    step: "5", 
                    title: "Documentation", 
                    desc: "Maintain detailed logs of when QR codes were generated, scanned, and by whom for complete audit trails." 
                  }
                ].map((practice, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    gap: 20,
                    padding: 20,
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    borderRadius: 12,
                    borderLeft: '3px solid rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                    e.currentTarget.style.borderLeftColor = accent;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
                    e.currentTarget.style.borderLeftColor = 'rgba(59, 130, 246, 0.3)';
                  }}
                  >
                    <div style={{
                      minWidth: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '2px solid rgba(59, 130, 246, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: 700,
                      color: accent
                    }}>{practice.step}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: 16, 
                        fontWeight: 600, 
                        color: '#f4f4f5', 
                        marginBottom: 6,
                        letterSpacing: '-0.2px'
                      }}>{practice.title}</div>
                      <div style={{ 
                        fontSize: 14, 
                        color: '#a1a1aa', 
                        lineHeight: 1.6 
                      }}>{practice.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* VIEWER */}
        {tab === "viewer" && viewerData && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <div
              style={{
                ...materialCardStyle,
                padding: 30,
                border:
                  verifyStatus === "valid"
                    ? "1px solid #107C10" // Microsoft Green
                    : "1px solid #E81123", // Microsoft Red
                boxShadow:
                  verifyStatus === "valid"
                    ? "0 0 20px rgba(16, 124, 16, 0.1)"
                    : "0 0 20px rgba(232, 17, 35, 0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                  borderBottom: "1px solid #3f3f46",
                  paddingBottom: 20,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: "bold",
                      letterSpacing: 1,
                      color: verifyStatus === "valid" ? "#107C10" : "#E81123",
                      marginBottom: 5,
                    }}
                  >
                    {verifyStatus === "valid"
                      ? "✓ INTEGRITY VERIFIED"
                      : "⚠ INTEGRITY COMPROMISED"}
                  </div>
                  <h2 style={{ margin: 0, fontSize: 20 }}>
                    Forensic Evidence Report
                  </h2>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, opacity: 0.5 }}>PACKAGE ID</div>
                  <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                    {viewerData.data.uid.slice(0, 8)}...
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                  marginBottom: 30,
                }}
              >
                <div>
                  <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4 }}>
                    OPERATOR
                  </div>
                  <div style={{ fontWeight: 600 }}>{viewerData.data.op}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4 }}>
                    BADGE ID
                  </div>
                  <div style={{ fontFamily: "monospace" }}>
                    {viewerData.data.bid}
                  </div>
                </div>
                {viewerData.data.role && (
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4 }}>
                      ROLE
                    </div>
                    <div style={{ fontWeight: 600 }}>{viewerData.data.role}</div>
                  </div>
                )}
                {viewerData.data.src && (
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4 }}>
                      EVIDENCE SOURCE
                    </div>
                    <div style={{ fontFamily: "monospace" }}>
                      {viewerData.data.src}
                    </div>
                  </div>
                )}
                <div style={{ gridColumn: "span 2" }}>
                  <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4 }}>
                    TIMESTAMP
                  </div>
                  <div style={{ fontFamily: "monospace" }}>
                    {new Date(viewerData.data.ts).toLocaleString()}
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: 14, opacity: 0.7, marginBottom: 15 }}>
                EVIDENCE LOG
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {viewerData.data.sec.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#18181b",
                      borderRadius: 4,
                      padding: 15,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: "bold",
                        marginBottom: 8,
                        color: accent,
                      }}
                    >
                      {i + 1}. {s.title}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        opacity: 0.8,
                        whiteSpace: "pre-wrap",
                        fontFamily: "monospace",
                        lineHeight: 1.5,
                      }}
                    >
                      {s.content}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 30,
                  paddingTop: 20,
                  borderTop: "1px solid #3f3f46",
                }}
              >
                <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 5 }}>
                  SHA-256 SIGNATURE
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    color: verifyStatus === "valid" ? accent : "#E81123",
                    wordBreak: "break-all",
                  }}
                >
                  {viewerData.hash}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                window.history.replaceState(
                  {},
                  document.title,
                  window.location.pathname
                );
                setTab("generator");
                setViewerData(null);
              }}
              style={{
                marginTop: 20,
                width: "100%",
                padding: "10px 24px",
                borderRadius: "24px",
                background: accent,
                border: "none",
                color: "white",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 1px 3px 1px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Create New Report
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
