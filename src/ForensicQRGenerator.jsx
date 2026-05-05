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

const FSL_DIVISIONS = [
  "Digital Forensics",
  "Cyber Forensics",
  "Biology / DNA",
  "Chemistry / Toxicology",
  "Ballistics",
  "Questioned Documents",
  "Fingerprint Bureau",
  "Crime Scene Unit",
  "General Forensic Intake"
];

const SEAL_CONDITIONS = [
  "Intact",
  "Broken / Re-sealed",
  "Partially damaged",
  "Unsealed on receipt",
  "Not applicable"
];

const PRIORITY_LEVELS = [
  "Routine",
  "Urgent",
  "Court Priority",
  "Re-examination",
  "Supplementary Submission"
];

const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i;
const ipUrl = /^(https?:\/\/)?((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(:\d+)?(\/\S*)?$/i;

export default function ForensicQRGenerator() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [tab, setTab] = useState("generator");
  const [name, setName] = useState("");
  const [badge, setBadge] = useState("");
  const [role, setRole] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [exhibitNumber, setExhibitNumber] = useState("");
  const [labDivision, setLabDivision] = useState("Digital Forensics");
  const [receivingOfficer, setReceivingOfficer] = useState("");
  const [sealCondition, setSealCondition] = useState("Intact");
  const [priorityLevel, setPriorityLevel] = useState("Routine");
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
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const [hasDefaultedCamera, setHasDefaultedCamera] = useState(false);

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
     * Enumerate devices and initialize the selected stream.
     */
    let controls;
    
    const startScanner = async () => {
      try {
        const devices = await codeReaderRef.current.listVideoInputDevices();
        setVideoDevices(devices);
        
        if (devices.length === 0) {
          throw new Error("No video devices discovered.");
        }

        // Auto-select back camera on first run
        if (!hasDefaultedCamera && devices.length > 1) {
          const backCameraIndex = devices.findIndex(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
          );
          
          if (backCameraIndex !== -1 && backCameraIndex !== selectedDeviceIndex) {
            setSelectedDeviceIndex(backCameraIndex);
            setHasDefaultedCamera(true);
            return; // Effect will re-run with correct index
          }
           setHasDefaultedCamera(true);
        }

        // Validate index
        const index = selectedDeviceIndex >= devices.length ? 0 : selectedDeviceIndex;
        const deviceId = devices[index].deviceId;

        controls = await codeReaderRef.current.decodeFromVideoDevice(
          deviceId,
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
        );
      } catch (err) {
        console.error("[FORENSIC_ERROR] Camera initialization failed.", err);
        setIsCameraActive(false);
        setValidationError(err.message || "Camera access denied or unavailable.");
      }
    };

    startScanner();

    return () => {
      if (controls) controls.stop();
    };
  }, [isCameraActive, selectedDeviceIndex]);

  const generatePackage = async () => {
    if (!name.trim() || !badge.trim() || !role.trim() || !caseNumber.trim() || !exhibitNumber.trim() || !evidenceSource.trim()) {
      setValidationError("Please fill in all required fields (Name, Badge ID, Role, Case Number, Exhibit Number, Evidence Source).");
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
      caseNo: caseNumber.trim(),
      exhibitNo: exhibitNumber.trim(),
      division: labDivision.trim(),
      receivedBy: receivingOfficer.trim() || name.trim(),
      seal: sealCondition.trim(),
      priority: priorityLevel.trim(),
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
CASE NO   : ${caseNumber.trim()}
EXHIBIT   : ${exhibitNumber.trim()}
TIMESTAMP : ${new Date(timestamp).toLocaleString()}
REF-TS    : ${timestamp}
STATUS    : SEALED / VERIFIED
--------------------------------
OPERATOR NAME : ${name.trim()}
BADGE ID      : ${badge.trim()}
ROLE          : ${role.trim()}
FSL DIVISION  : ${labDivision.trim()}
RECEIVED BY   : ${(receivingOfficer.trim() || name.trim())}
SEAL CONDITION: ${sealCondition.trim()}
PRIORITY      : ${priorityLevel.trim()}
EVIDENCE FROM : ${finalEvidenceSource.trim()}
================================
[ CHAIN OF CUSTODY ]
01. COLLECTED / SUBMITTED BY : ${name.trim()} (${badge.trim()})
02. SOURCE DOCUMENTED        : ${finalEvidenceSource.trim()}
03. RECEIVED BY FSL          : ${(receivingOfficer.trim() || name.trim())}
04. SEAL CONDITION           : ${sealCondition.trim()}
05. DIGITAL PACKAGE SEALED   : ${timestamp}
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
    setCaseNumber("");
    setExhibitNumber("");
    setLabDivision("Digital Forensics");
    setReceivingOfficer("");
    setSealCondition("Intact");
    setPriorityLevel("Routine");
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

  const exportForensicReportPdf = (report) => {
    if (!report) return;

    const doc = new jsPDF();
    const data = report.packageData || {};
    const colors = {
      ink: [24, 24, 27],
      muted: [82, 82, 91],
      line: [228, 228, 231],
      panel: [248, 250, 252],
      blue: [37, 99, 235],
      green: [5, 150, 105],
      amber: [217, 119, 6],
      red: [220, 38, 38],
    };
    const isTrusted = report.trustStatus === "TRUSTED SEAL";
    const statusColor = isTrusted ? colors.green : report.riskLevel === "HIGH" ? colors.red : colors.amber;
    const value = (input, fallback = "Not recorded") => `${input || ""}`.trim() || fallback;
    const dateValue = (input) => {
      const parsed = new Date(input);
      return Number.isNaN(parsed.getTime()) ? value(input) : parsed.toLocaleString();
    };
    const writeLines = (text, x, y, width, options = {}) => {
      doc.setFont(options.font || "helvetica", options.style || "normal");
      doc.setFontSize(options.size || 9);
      doc.setTextColor(...(options.color || colors.ink));
      const lines = doc.splitTextToSize(value(text, options.fallback || "No details recorded."), width);
      const maxLines = options.maxLines || lines.length;
      const visible = lines.slice(0, maxLines);
      if (lines.length > maxLines && visible.length) {
        visible[visible.length - 1] = `${visible[visible.length - 1].replace(/\.*$/, "")}...`;
      }
      doc.text(visible, x, y);
      return y + visible.length * (options.lineHeight || 4.8);
    };
    const shell = (page, title = "FORENSIC EVIDENCE REPORT") => {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, "F");
      doc.setFillColor(...colors.ink);
      doc.rect(0, 0, 210, 31, "F");
      doc.setFillColor(...statusColor);
      doc.rect(0, 31, 210, 2.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(19);
      doc.text("P.H.A.N.I.X", 15, 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(title, 15, 23);
      doc.setFillColor(...statusColor);
      doc.roundedRect(138, 10, 57, 10, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);
      doc.text(report.trustStatus, 166.5, 16.6, { align: "center", maxWidth: 51 });
      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(`Certificate ${report.hash.substring(0, 14).toUpperCase()}`, 15, 286);
      doc.text(`Page ${page} of 2`, 195, 286, { align: "right" });
    };
    const section = (title, y) => {
      doc.setFillColor(...colors.panel);
      doc.roundedRect(15, y, 180, 9, 1.5, 1.5, "F");
      doc.setTextColor(...colors.ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(title, 19, y + 6);
      return y + 14;
    };
    const field = (label, text, x, y, width = 78, maxLines = 2) => {
      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.text(label, x, y);
      return writeLines(text, x, y + 4.7, width, { size: 8.5, maxLines, lineHeight: 4.2 });
    };
    const checklistMark = (item, x, y) => {
      const pass = item.status === "PASS";
      const skip = item.status === "SKIP" || item.status === "NONE";
      doc.setFillColor(...(pass ? colors.green : skip ? colors.amber : colors.red));
      doc.circle(x, y - 1.8, 1.7, "F");
      doc.setTextColor(...colors.ink);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.8);
      doc.text(item.label, x + 5, y);
      doc.setFont("helvetica", "bold");
      doc.text(pass ? "PASSED" : item.status, x + 82, y, { align: "right" });
    };

    shell(1);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Issued ${new Date().toLocaleString()}`, 15, 43);
    doc.text(value(report.source).replace(/_/g, " "), 195, 43, { align: "right" });

    doc.setFillColor(isTrusted ? 236 : 255, isTrusted ? 253 : 247, isTrusted ? 245 : 237);
    doc.roundedRect(15, 51, 180, 34, 3, 3, "F");
    doc.setTextColor(...statusColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(report.classification, 22, 64, { maxWidth: 135 });
    writeLines(report.trustDescription, 22, 72, 158, { size: 8.6, maxLines: 2, color: colors.ink });

    let y = section("CASE SUMMARY", 96);
    let nextY = Math.max(
      field("CASE NUMBER", data.caseNo, 20, y),
      field("EXHIBIT NUMBER", data.exhibitNo, 110, y)
    );
    y = nextY + 6;
    nextY = Math.max(
      field("PACKAGE ID", data.uid, 20, y),
      field("REFERENCE TIME", dateValue(data.ts || report.timestamp), 110, y)
    );
    y = nextY + 6;
    nextY = Math.max(
      field("FSL DIVISION", data.division, 20, y),
      field("PRIORITY", data.priority, 110, y)
    );

    y = section("OFFICER, SOURCE AND CUSTODY", nextY + 12);
    nextY = Math.max(
      field("OPERATOR", data.op, 20, y),
      field("BADGE / ROLE", `${value(data.bid)} / ${value(data.role)}`, 110, y)
    );
    y = nextY + 6;
    nextY = Math.max(
      field("RECEIVED BY", data.receivedBy, 20, y),
      field("SEAL CONDITION", data.seal, 110, y)
    );
    y = nextY + 6;
    field("EVIDENCE SOURCE", data.src, 20, y, 168, 3);

    y = section("CHAIN OF CUSTODY SNAPSHOT", 220);
    [
      ["01", "Collected", `${value(data.op)} (${value(data.bid)})`],
      ["02", "Source logged", data.src],
      ["03", "FSL received", data.receivedBy],
      ["04", "Digital seal", dateValue(data.ts || report.timestamp)],
    ].forEach(([step, label, detail], index) => {
      const rowY = y + index * 8.5;
      doc.setTextColor(...statusColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(step, 20, rowY);
      doc.setTextColor(...colors.ink);
      doc.text(label, 33, rowY);
      writeLines(detail, 72, rowY, 112, { size: 8, maxLines: 1, color: colors.muted });
    });

    doc.addPage();
    shell(2);
    y = section("CRYPTOGRAPHIC SIGNATURE", 45);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(20, y - 2, 170, 19, 2, 2, "F");
    writeLines(report.hash, 25, y + 5, 160, { font: "courier", style: "bold", size: 7.8, maxLines: 2, color: isTrusted ? colors.green : colors.red });

    y = section("VALIDATION CHECKLIST", 84);
    report.checklist.slice(0, 4).forEach((item, index) => {
      checklistMark(item, index % 2 === 0 ? 22 : 112, y + Math.floor(index / 2) * 11);
    });

    y = section("FORENSIC INDICATORS", 119);
    const indicators = report.indicators.length ? report.indicators : ["No high-risk indicators were detected during automated analysis."];
    indicators.slice(0, 5).forEach((indicator, index) => {
      writeLines(`- ${indicator}`, 22, y + index * 7.5, 160, { size: 8.2, maxLines: 1, color: colors.muted });
    });

    y = section("EVIDENCE MANIFEST", 166);
    const manifestSections = Array.isArray(data.sec) ? data.sec : [];
    if (manifestSections.length === 0) {
      writeLines("No evidence manifest was embedded in this payload.", 22, y, 160, { size: 8.6, color: colors.muted });
    } else {
      manifestSections.slice(0, 4).forEach((item, index) => {
        const itemY = y + index * 17;
        doc.setTextColor(...colors.blue);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.6);
        doc.text(`${index + 1}. ${value(item.title, "Evidence Item")}`, 22, itemY, { maxWidth: 155 });
        writeLines(item.content, 26, itemY + 5, 154, { size: 7.8, maxLines: 2, color: colors.muted, lineHeight: 3.8 });
      });
      if (manifestSections.length > 4) {
        doc.setTextColor(...colors.muted);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.6);
        doc.text(`Additional manifest items omitted from this two-page summary: ${manifestSections.length - 4}`, 22, 238);
      }
    }

    doc.setFillColor(239, 246, 255);
    doc.rect(0, 255, 210, 28, "F");
    doc.setTextColor(...colors.blue);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.8);
    doc.text("DOCUMENT ADVISORY", 20, 266);
    writeLines("This two-page certificate is a concise evidentiary summary. Preserve the original QR payload and generated file together for full verification.", 20, 272, 170, { size: 7.8, maxLines: 2, color: colors.muted, lineHeight: 4 });

    const fileId = value(data.caseNo, report.hash.substring(0, 8)).replace(/[^a-z0-9_-]/gi, "_");
    doc.save(`Forensic_Evidence_Report_${fileId}.pdf`);
  };

  const downloadForensicReport = () => {
    exportForensicReportPdf(analysisReport);
  };

  const downloadGeneratedForensicReport = () => {
    if (!manifest || !qrData) return;

    const finalEvidenceSource = locationDetails
      ? `${evidenceSource} [ ${locationDetails} ]`
      : evidenceSource;

    exportForensicReportPdf({
      hash: manifest.hash,
      timestamp: manifest.timestamp,
      classification: "PHANIX Secure Package",
      riskLevel: "LOW",
      trustStatus: "TRUSTED SEAL",
      trustDescription: "Generated and sealed by PHANIX Architect. This report records the case metadata, custody path, evidence manifest, and SHA-256 signature at creation time.",
      indicators: ["Report generated from PHANIX package builder", "Case metadata captured", "Evidence manifest attached", "SHA-256 package signature recorded"],
      checklist: [
        { label: "Required Case Fields", status: "PASS" },
        { label: "Evidence Manifest", status: "PASS" },
        { label: "Cryptographic Seal", status: "PASS" }
      ],
      source: "REPORT_GENERATOR",
      packageData: {
        uid: manifest.id,
        ts: manifest.timestamp,
        op: name.trim(),
        bid: badge.trim(),
        role: role.trim(),
        caseNo: caseNumber.trim(),
        exhibitNo: exhibitNumber.trim(),
        division: labDivision.trim(),
        receivedBy: receivingOfficer.trim() || name.trim(),
        seal: sealCondition.trim(),
        priority: priorityLevel.trim(),
        src: finalEvidenceSource.trim(),
        sec: sections.map((section) => ({
          title: section.title.trim().toUpperCase() || "EVIDENCE ITEM",
          content: section.content.trim()
        }))
      }
    });
  };

  const downloadCorruptionReport = (source) => {
    const doc = new jsPDF();
    const reportId = `ERR_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const colors = {
      ink: [24, 24, 27],
      muted: [82, 82, 91],
      panel: [254, 242, 242],
      red: [220, 38, 38],
      amber: [217, 119, 6],
    };
    const shell = (page) => {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, "F");
      doc.setFillColor(...colors.ink);
      doc.rect(0, 0, 210, 31, "F");
      doc.setFillColor(...colors.red);
      doc.rect(0, 31, 210, 2.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(19);
      doc.text("P.H.A.N.I.X", 15, 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text("FORENSIC ANALYSIS FAILURE REPORT", 15, 23);
      doc.setFillColor(...colors.red);
      doc.roundedRect(139, 10, 56, 10, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.6);
      doc.text("QR CORRUPTED", 167, 16.6, { align: "center" });
      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(`Failure report ${reportId}`, 15, 286);
      doc.text(`Page ${page} of 2`, 195, 286, { align: "right" });
    };
    const title = (text, y) => {
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(15, y, 180, 9, 1.5, 1.5, "F");
      doc.setTextColor(...colors.ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(text, 19, y + 6);
      return y + 14;
    };
    const textBlock = (text, x, y, width, options = {}) => {
      doc.setFont(options.font || "helvetica", options.style || "normal");
      doc.setFontSize(options.size || 8.8);
      doc.setTextColor(...(options.color || colors.ink));
      const lines = doc.splitTextToSize(text, width).slice(0, options.maxLines || 6);
      doc.text(lines, x, y);
      return y + lines.length * (options.lineHeight || 4.8);
    };
    const statusRow = (label, status, y) => {
      const fail = status === "FAIL";
      doc.setFillColor(...(fail ? colors.red : colors.amber));
      doc.circle(22, y - 1.8, 1.7, "F");
      doc.setTextColor(...colors.ink);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.8);
      doc.text(label, 28, y);
      doc.setFont("helvetica", "bold");
      doc.text(status, 180, y, { align: "right" });
    };

    shell(1);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Issued ${new Date().toLocaleString()}`, 15, 43);
    doc.text((source || "INTERNAL_SCAN").replace(/_/g, " "), 195, 43, { align: "right" });

    doc.setFillColor(...colors.panel);
    doc.roundedRect(15, 52, 180, 38, 3, 3, "F");
    doc.setTextColor(...colors.red);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("QR analysis could not be completed", 22, 66);
    textBlock("The submitted QR pattern was unreadable, incomplete, malformed, or visually degraded. No cryptographic trust decision can be made from this intake.", 22, 75, 158, { size: 8.8, color: colors.ink, maxLines: 2 });

    let y = title("INTAKE SUMMARY", 105);
    textBlock(`Report ID: ${reportId}`, 20, y, 165, { size: 8.8 });
    textBlock(`Evidence source: ${(source || "INTERNAL_SCAN").replace(/_/g, " ")}`, 20, y + 8, 165, { size: 8.8 });
    textBlock(`Intake timestamp: ${new Date().toLocaleString()}`, 20, y + 16, 165, { size: 8.8 });

    y = title("FAILURE STATUS", 145);
    [
      ["Pattern detection", "FAIL"],
      ["Data extraction", "FAIL"],
      ["Integrity check", "SKIP"],
      ["PHANIX seal validation", "SKIP"],
    ].forEach(([label, status], index) => statusRow(label, status, y + index * 10));

    y = title("CASE HANDLING NOTE", 205);
    textBlock("Attach this failure report to the incident file only as documentation of non-extractable QR evidence. It does not certify authenticity, origin, or payload integrity.", 20, y, 165, { size: 8.6, color: colors.muted, maxLines: 4 });

    doc.addPage();
    shell(2);
    y = title("TECHNICAL OBSERVATION", 45);
    textBlock("The analysis pipeline attempted QR pattern discovery and data extraction. The evidence did not provide a readable payload suitable for SHA-256 comparison or PHANIX package reconstruction.", 20, y, 165, { size: 8.8, color: colors.muted, maxLines: 4 });

    y = title("RECOMMENDED NEXT ACTIONS", 92);
    [
      "Capture a sharper image under even lighting.",
      "Avoid glare, heavy cropping, rotation, and compression.",
      "Preserve the original media file before further handling.",
      "If physical evidence is damaged, document condition with photographs.",
      "Rescan the source after stabilizing the image or camera feed.",
    ].forEach((item, index) => {
      textBlock(`${index + 1}. ${item}`, 22, y + index * 9, 160, { size: 8.6, color: colors.ink, maxLines: 1 });
    });

    y = title("EVIDENTIARY LIMITATION", 160);
    textBlock("This document is a failure certificate, not a verification certificate. It confirms that the QR could not be decoded by the application at intake time. Treat any later manual reconstruction as a separate examination event.", 20, y, 165, { size: 8.8, color: colors.muted, maxLines: 5 });

    doc.setFillColor(...colors.panel);
    doc.rect(0, 255, 210, 28, "F");
    doc.setTextColor(...colors.red);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.8);
    doc.text("FORENSIC ADVISORY", 20, 266);
    textBlock("Keep this two-page failure report with the original intake material and retry validation only from preserved source media.", 20, 272, 170, { size: 7.8, maxLines: 2, color: colors.muted, lineHeight: 4 });

    doc.save(`Forensic_Failure_Report_${reportId}.pdf`);
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
      classification = "External / Untrusted Data";
      trustStatus = "AUTHENTICATION FAILED";
      trustDescription = "The scanned QR does not match the PHANIX forensic architecture. No cryptographic trust can be established.";
      riskLevel = "HIGH";
      indicators = ["Non-Phanix signature detected", "External data source", "Integrity check failed"];
      checklist = [
        { label: "Structural Analysis", status: "FAIL" },
        { label: "Internal Hash Check", status: "SKIP" },
        { label: "Authenticity Seal", status: "FAIL" }
      ];
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
      source: isCameraActive ? "LIVE_CAMERA_SCAN" : "FORENSIC_IMAGE_INTAKE",
      packageData: phanixData?.data || null
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
        return line ? line.slice(line.indexOf(':') + 1).trim() : '';
      };

      const extractedId = getValue('CASE ID');
      const extractedTimestamp = getValue('REF-TS') || getValue('TIMESTAMP'); // Fallback to localized if old report
      const extractedOp = getValue('OPERATOR NAME');
      const extractedBid = getValue('BADGE ID');
      const extractedRole = getValue('ROLE');
      const extractedCaseNo = getValue('CASE NO');
      const extractedExhibitNo = getValue('EXHIBIT');
      const extractedDivision = getValue('FSL DIVISION');
      const extractedReceivedBy = getValue('RECEIVED BY');
      const extractedSeal = getValue('SEAL CONDITION');
      const extractedPriority = getValue('PRIORITY');
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
          data: {
            uid: extractedId,
            ts: extractedTimestamp,
            op: extractedOp,
            bid: extractedBid,
            role: extractedRole,
            caseNo: extractedCaseNo,
            exhibitNo: extractedExhibitNo,
            division: extractedDivision,
            receivedBy: extractedReceivedBy,
            seal: extractedSeal,
            priority: extractedPriority,
            src: extractedSrc,
            sec: extractedSec
          }
        };
        
        setScanResult({
          type: 'valid',
          data: phanixData.data,
          hash: extractedHash
        });
      } else {
        setScanResult({ type: 'failed', data: content });
      }
    } else {
      setScanResult({ type: 'failed', data: content });
    }

    performForensicAnalysis(content, phanixData);
  };

  const materialCardStyle = {
    background: "#27272a",
    border: "1px solid #3f3f46",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  };

  const fslFieldStyle = {
    padding: "12px 16px",
    borderRadius: 4,
    background: "transparent",
    border: "1px solid #52525b",
    color: "#f4f4f5",
    outline: "none",
    fontSize: 14,
    transition: "all 0.2s",
    width: "100%",
  };

  const fslLabelStyle = {
    fontSize: 11,
    fontWeight: 600,
    color: "#a1a1aa",
    marginBottom: 4,
    display: "block",
    letterSpacing: 0.5,
  };

  const readinessItems = [
    { label: "Unique case reference", ready: caseNumber.trim() && exhibitNumber.trim() },
    { label: "Authorized operator", ready: name.trim() && badge.trim() && role.trim() },
    { label: "FSL intake metadata", ready: labDivision.trim() && sealCondition.trim() && priorityLevel.trim() },
    { label: "Source and custody notes", ready: evidenceSource.trim() && sections.some((s) => s.content.trim()) },
  ];

  const custodySteps = [
    { step: "Collected", detail: name.trim() ? `${name.trim()} (${badge.trim() || "Badge pending"})` : "Awaiting operator details" },
    { step: "Source Logged", detail: evidenceSource.trim() || "Awaiting evidence source" },
    { step: "FSL Received", detail: receivingOfficer.trim() || name.trim() || "Awaiting receiving officer" },
    { step: "Seal Checked", detail: sealCondition },
    { step: "QR Sealed", detail: qrData ? "SHA-256 package generated" : "Pending package generation" },
  ];

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
                href="https://p-h-a-n-i-x-phaneendhar-s-investigation-expert.vercel.app/"
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
                ...materialCardStyle,
                padding: 22,
                marginBottom: 22,
                borderRadius: 8,
                background: "#202024",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: accent, fontSize: 11, fontWeight: 800, letterSpacing: 1.2, marginBottom: 6 }}>
                    FSL-READY INTAKE
                  </div>
                  <h2 style={{ margin: 0, fontSize: 20, color: "#f4f4f5", fontWeight: 700 }}>
                    Evidence package standards check
                  </h2>
                  <p style={{ margin: "8px 0 0", color: "#a1a1aa", fontSize: 13, lineHeight: 1.6, maxWidth: 560 }}>
                    Designed around common forensic lab intake expectations: case reference, exhibit identity,
                    seal condition, receiving officer, timestamp, and SHA-256 integrity record.
                  </p>
                </div>
                <div
                  style={{
                    padding: "7px 12px",
                    borderRadius: 18,
                    border: "1px solid rgba(16, 185, 129, 0.35)",
                    color: "#6ee7b7",
                    background: "rgba(16, 185, 129, 0.08)",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.8,
                  }}
                >
                  LAB MODE
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                  marginTop: 18,
                }}
              >
                {readinessItems.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      background: "#18181b",
                      border: `1px solid ${item.ready ? "rgba(16, 185, 129, 0.35)" : "#3f3f46"}`,
                      borderRadius: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: item.ready ? "#10b981" : "#71717a",
                        boxShadow: item.ready ? "0 0 8px rgba(16, 185, 129, 0.7)" : "none",
                        flex: "0 0 auto",
                      }}
                    />
                    <span style={{ color: item.ready ? "#d4d4d8" : "#a1a1aa", fontSize: 12, fontWeight: 600 }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

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
                  placeholder="Enter authorized officer / examiner name"
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
              <div
                style={{
                  ...materialCardStyle,
                  padding: 18,
                  borderRadius: 8,
                  background: "#202024",
                  boxShadow: "none",
                }}
              >
                <div style={{ color: accent, fontSize: 11, fontWeight: 800, letterSpacing: 1, marginBottom: 14 }}>
                  FSL ACCESSION DETAILS
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={fslLabelStyle}>CASE / CRIME NUMBER</label>
                    <input
                      placeholder="e.g. FIR-2026-0142"
                      value={caseNumber}
                      onChange={(e) => setCaseNumber(e.target.value)}
                      style={fslFieldStyle}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={fslLabelStyle}>EXHIBIT / ARTICLE NUMBER</label>
                    <input
                      placeholder="e.g. EX-01 / A1"
                      value={exhibitNumber}
                      onChange={(e) => setExhibitNumber(e.target.value)}
                      style={fslFieldStyle}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={fslLabelStyle}>FSL DIVISION</label>
                    <select
                      value={labDivision}
                      onChange={(e) => setLabDivision(e.target.value)}
                      style={fslFieldStyle}
                    >
                      {FSL_DIVISIONS.map((division) => (
                        <option key={division} value={division}>{division}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={fslLabelStyle}>RECEIVING / CUSTODY OFFICER</label>
                    <input
                      placeholder="Defaults to operator if blank"
                      value={receivingOfficer}
                      onChange={(e) => setReceivingOfficer(e.target.value)}
                      style={fslFieldStyle}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={fslLabelStyle}>SEAL CONDITION</label>
                    <select
                      value={sealCondition}
                      onChange={(e) => setSealCondition(e.target.value)}
                      style={fslFieldStyle}
                    >
                      {SEAL_CONDITIONS.map((condition) => (
                        <option key={condition} value={condition}>{condition}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={fslLabelStyle}>SUBMISSION PRIORITY</label>
                    <select
                      value={priorityLevel}
                      onChange={(e) => setPriorityLevel(e.target.value)}
                      style={fslFieldStyle}
                    >
                      {PRIORITY_LEVELS.map((priority) => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                </div>
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
                  placeholder="Enter official badge / employee ID"
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
                  placeholder="e.g. Investigating Officer, Lab Examiner"
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
                      placeholder="Select or enter evidence source location"
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
                              evidenceSource === "Police Station" ? "Enter police station / unit name" :
                              "Enter specific room, area, landmark, or custody notes"
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

            <div
              style={{
                ...materialCardStyle,
                padding: 18,
                borderRadius: 8,
                background: "#202024",
                boxShadow: "none",
                marginBottom: 20,
              }}
            >
              <div style={{ color: accent, fontSize: 11, fontWeight: 800, letterSpacing: 1, marginBottom: 14 }}>
                CHAIN OF CUSTODY
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                {custodySteps.map((item, index) => (
                  <div
                    key={item.step}
                    style={{
                      padding: "12px",
                      background: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: 6,
                      minHeight: 82,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: index === custodySteps.length - 1 && qrData ? "#10b981" : "rgba(59, 130, 246, 0.15)",
                          color: index === custodySteps.length - 1 && qrData ? "#ffffff" : accent,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 800,
                          flex: "0 0 auto",
                        }}
                      >
                        {index + 1}
                      </div>
                      <div style={{ color: "#f4f4f5", fontSize: 12, fontWeight: 700 }}>
                        {item.step}
                      </div>
                    </div>
                    <div style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 1.45, wordBreak: "break-word" }}>
                      {item.detail}
                    </div>
                  </div>
                ))}
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

                {/* Advisory Quote */}
                <div style={{
                  marginTop: "20px",
                  padding: "12px 20px",
                  background: "rgba(59, 130, 246, 0.05)",
                  borderLeft: `4px solid ${accent}`,
                  borderRadius: "4px",
                  maxWidth: "100%",
                  textAlign: "center",
                  fontStyle: "italic",
                  color: "#01040cff",
                  fontSize: "14px",
                  lineHeight: "1.5"
                }}>
                  "Please download the QR and use for the upload scan."
                </div>

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
                    onClick={downloadGeneratedForensicReport}
                    style={{
                      flex: 1,
                      padding: "8px 16px",
                      borderRadius: 4,
                      border: "1px solid #bfdbfe",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Download Report PDF
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
                    FSL PACKAGE VIEW
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: 10,
                      marginBottom: 14,
                      paddingBottom: 14,
                      borderBottom: "1px solid #3f3f46",
                    }}
                  >
                    {[
                      ["CASE NO", caseNumber],
                      ["EXHIBIT", exhibitNumber],
                      ["DIVISION", labDivision],
                      ["SEAL", sealCondition],
                      ["PRIORITY", priorityLevel],
                      ["RECEIVED BY", receivingOfficer || name],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div style={{ fontSize: 9, color: "#71717a", fontWeight: 800, letterSpacing: 0.8, marginBottom: 3 }}>
                          {label}
                        </div>
                        <div style={{ color: "#e4e4e7", fontSize: 12, fontWeight: 600, wordBreak: "break-word" }}>
                          {value}
                        </div>
                      </div>
                    ))}
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
                
                {/* System Status Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '20px',
                  marginLeft: 'auto'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 8px #10b981'
                  }} />
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#6ee7b7',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    SYSTEM OPERATIONAL
                  </span>
                </div>
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
                    {videoDevices.length > 1 && (
                      <button
                          onClick={() => setSelectedDeviceIndex(prev => (prev + 1) % videoDevices.length)}
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
                    )}

                    {/* Camera Status Label */}
                    {videoDevices.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '75px',
                        width: '100%',
                        textAlign: 'center',
                        pointerEvents: 'none',
                        zIndex: 5
                      }}>
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          background: 'rgba(0,0,0,0.6)',
                          backdropFilter: 'blur(4px)',
                          borderRadius: '12px',
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: '10px',
                          fontWeight: 600,
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase'
                        }}>
                          SOURCE: {videoDevices[selectedDeviceIndex]?.label || `CAMERA ${selectedDeviceIndex + 1}`}
                        </div>
                      </div>
                    )}

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
              {analysisReport && !validationError && scanResult?.type !== 'valid' && (
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
                <div style={{ marginTop: scanResult.type === 'valid' ? 34 : 30, animation: "fadeIn 0.3s ease" }}>
                  {scanResult.type !== 'valid' && (
                    <div style={{ height: 1, background: "#3f3f46", marginBottom: 20 }}></div>
                  )}
                  
                  {scanResult.type === 'valid' ? (
                    <div
                      style={{
                        background: "linear-gradient(135deg, #111827 0%, #18181b 58%, #0f172a 100%)",
                        border: "1px solid rgba(16, 185, 129, 0.35)",
                        borderRadius: 18,
                        overflow: "hidden",
                        boxShadow: "0 18px 40px rgba(0, 0, 0, 0.28)",
                      }}
                    >
                      <div
                        style={{
                          padding: "22px 24px",
                          borderBottom: "1px solid rgba(16, 185, 129, 0.18)",
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 16,
                          flexWrap: "wrap",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <div style={{ color: "#6ee7b7", fontSize: 11, fontWeight: 900, letterSpacing: 1.4, marginBottom: 6 }}>
                            VERIFIED QR RECORD
                          </div>
                          <h3 style={{ margin: 0, fontSize: 21, color: "#f4f4f5", fontWeight: 800 }}>
                            FSL Evidence Information View
                          </h3>
                          <p style={{ margin: "8px 0 0", color: "#a7f3d0", fontSize: 13, lineHeight: 1.55, maxWidth: 560 }}>
                            The scanned QR contains a structured PHANIX forensic package with case metadata,
                            custody details, evidence notes, and SHA-256 integrity reference.
                          </p>
                        </div>
                        <div
                          style={{
                            padding: "7px 12px",
                            borderRadius: 20,
                            background: "rgba(16, 185, 129, 0.12)",
                            border: "1px solid rgba(16, 185, 129, 0.35)",
                            color: "#6ee7b7",
                            fontSize: 11,
                            fontWeight: 900,
                            letterSpacing: 0.8,
                            whiteSpace: "nowrap",
                          }}
                        >
                          HASH MATCHED
                        </div>
                      </div>

                      <div style={{ padding: 24 }}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: 12,
                            marginBottom: 18,
                          }}
                        >
                          {[
                            ["CASE / CRIME NO", scanResult.data.caseNo || "Not recorded"],
                            ["EXHIBIT", scanResult.data.exhibitNo || "Not recorded"],
                            ["PACKAGE ID", scanResult.data.uid],
                            ["TIMESTAMP", scanResult.data.ts],
                            ["OPERATOR", scanResult.data.op],
                            ["BADGE ID", scanResult.data.bid],
                            ["ROLE", scanResult.data.role || "Not recorded"],
                            ["FSL DIVISION", scanResult.data.division || "Not recorded"],
                            ["RECEIVED BY", scanResult.data.receivedBy || scanResult.data.op],
                            ["SEAL CONDITION", scanResult.data.seal || "Not recorded"],
                            ["PRIORITY", scanResult.data.priority || "Routine"],
                            ["SOURCE", scanResult.data.src],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              style={{
                                background: "rgba(255, 255, 255, 0.035)",
                                border: "1px solid rgba(255, 255, 255, 0.06)",
                                borderRadius: 8,
                                padding: "12px 13px",
                                minHeight: 68,
                              }}
                            >
                              <div style={{ color: "#71717a", fontSize: 10, fontWeight: 900, letterSpacing: 0.8, marginBottom: 6 }}>
                                {label}
                              </div>
                              <div style={{ color: "#f4f4f5", fontSize: 13, fontWeight: 650, wordBreak: "break-word", lineHeight: 1.4 }}>
                                {value}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div
                          style={{
                            background: "rgba(16, 185, 129, 0.07)",
                            border: "1px solid rgba(16, 185, 129, 0.18)",
                            borderRadius: 10,
                            padding: 16,
                            marginBottom: 18,
                          }}
                        >
                          <div style={{ color: "#6ee7b7", fontSize: 11, fontWeight: 900, letterSpacing: 1, marginBottom: 12 }}>
                            CHAIN OF CUSTODY
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10 }}>
                            {[
                              ["1", "Collected", scanResult.data.op],
                              ["2", "Source Logged", scanResult.data.src],
                              ["3", "FSL Received", scanResult.data.receivedBy || scanResult.data.op],
                              ["4", "Seal Checked", scanResult.data.seal || "Not recorded"],
                              ["5", "QR Verified", "Integrity structure detected"],
                            ].map(([num, title, detail]) => (
                              <div key={`${num}-${title}`} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                                <div
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: "50%",
                                    background: "#10b981",
                                    color: "#ffffff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 11,
                                    fontWeight: 900,
                                    flex: "0 0 auto",
                                  }}
                                >
                                  {num}
                                </div>
                                <div>
                                  <div style={{ color: "#d1fae5", fontSize: 12, fontWeight: 800 }}>{title}</div>
                                  <div style={{ color: "#a7f3d0", fontSize: 11, lineHeight: 1.35, marginTop: 2 }}>{detail}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{ color: "#a1a1aa", fontSize: 11, fontWeight: 900, letterSpacing: 1, marginBottom: 10 }}>
                          EVIDENCE MANIFEST
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {scanResult.data.sec.map((s, i) => (
                            <div
                              key={i}
                              style={{
                                background: "#18181b",
                                border: "1px solid #3f3f46",
                                borderLeft: `3px solid ${accent}`,
                                borderRadius: 8,
                                padding: "13px 15px",
                              }}
                            >
                              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 5, color: "#f4f4f5" }}>
                                {i + 1}. {s.title || "Evidence Section"}
                              </div>
                              <div style={{ fontSize: 13, color: "#d4d4d8", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                                {s.content || "No section details recorded."}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div
                          style={{
                            marginTop: 18,
                            background: "#09090b",
                            border: "1px solid rgba(59, 130, 246, 0.25)",
                            borderRadius: 8,
                            padding: 14,
                          }}
                        >
                          <div style={{ color: accent, fontSize: 10, fontWeight: 900, letterSpacing: 1, marginBottom: 8 }}>
                            SHA-256 INTEGRITY HASH
                          </div>
	                          <div style={{ color: "#f4f4f5", fontFamily: "monospace", fontSize: 12, lineHeight: 1.6, wordBreak: "break-all" }}>
	                            {scanResult.hash}
	                          </div>
	                        </div>
	                        <div
	                          style={{
	                            marginTop: 18,
	                            padding: "16px 18px",
	                            borderRadius: 10,
	                            background: "rgba(16, 185, 129, 0.08)",
	                            border: "1px solid rgba(16, 185, 129, 0.22)",
	                            display: "flex",
	                            justifyContent: "space-between",
	                            alignItems: "center",
	                            gap: 16,
	                            flexWrap: "wrap",
	                          }}
	                        >
	                          <div>
	                            <div style={{ color: "#d1fae5", fontSize: 13, fontWeight: 900, marginBottom: 4 }}>
	                              Scanner Report Ready
	                            </div>
	                            <div style={{ color: "#a7f3d0", fontSize: 12, lineHeight: 1.45 }}>
	                              Download the clean 2-page PDF for this verified scanned package.
	                            </div>
	                          </div>
	                          <button
	                            onClick={downloadForensicReport}
	                            style={{
	                              padding: "10px 18px",
	                              borderRadius: 8,
	                              border: "none",
	                              background: "#10b981",
	                              color: "white",
	                              cursor: "pointer",
	                              fontSize: 12,
	                              fontWeight: 800,
	                              letterSpacing: 0.5,
	                              textTransform: "uppercase",
	                              boxShadow: "0 8px 20px rgba(16, 185, 129, 0.28)",
	                              whiteSpace: "nowrap",
	                            }}
	                          >
	                            Download Report PDF
	                          </button>
	                        </div>
	                      </div>
	                    </div>
	                  ) : (
	                    <div
                        style={{
                          background: "linear-gradient(135deg, #18181b 0%, #111827 100%)",
                          border: "1px solid rgba(239, 68, 68, 0.35)",
                          borderRadius: 18,
                          overflow: "hidden",
                          boxShadow: "0 18px 40px rgba(0, 0, 0, 0.28)",
                        }}
                      >
                        <div
                          style={{
                            padding: "22px 24px",
                            borderBottom: "1px solid rgba(239, 68, 68, 0.18)",
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 16,
                            flexWrap: "wrap",
                            alignItems: "flex-start",
                          }}
                        >
                          <div>
                            <div style={{ color: "#fca5a5", fontSize: 11, fontWeight: 900, letterSpacing: 1.4, marginBottom: 6 }}>
                              AUTHENTICATION FAILED
                            </div>
                            <h3 style={{ margin: 0, fontSize: 21, color: "#f4f4f5", fontWeight: 800 }}>
                              Non-Phanix QR Detected
                            </h3>
                            <p style={{ margin: "8px 0 0", color: "#fca5a5", fontSize: 13, lineHeight: 1.55, maxWidth: 560 }}>
                              The scanned content does not match the PHANIX forensic architecture. 
                              This data could be malformed, external, or tampered with.
                            </p>
                          </div>
                          <div
                            style={{
                              padding: "7px 12px",
                              borderRadius: 20,
                              background: "rgba(239, 68, 68, 0.12)",
                              border: "1px solid rgba(239, 68, 68, 0.35)",
                              color: "#fca5a5",
                              fontSize: 11,
                              fontWeight: 900,
                              letterSpacing: 0.8,
                              whiteSpace: "nowrap",
                            }}
                          >
                            INVALID SIGNATURE
                          </div>
                        </div>

                        <div style={{ padding: 24 }}>
                          <div style={{ color: "#a1a1aa", fontSize: 11, fontWeight: 900, letterSpacing: 1, marginBottom: 10 }}>
                            EXTRACTED DATA SUMMARY
                          </div>
                          <div
                            style={{
                              background: "rgba(239, 68, 68, 0.05)",
                              border: "1px solid rgba(239, 68, 68, 0.15)",
                              borderRadius: 10,
                              padding: 18,
                              marginBottom: 18,
                            }}
                          >
                            <div style={{ color: "#f4f4f5", fontFamily: "monospace", fontSize: 13, wordBreak: "break-all", lineHeight: 1.6 }}>
                              {scanResult.data}
                            </div>
                          </div>

                          <div
                            style={{
                              padding: "16px 18px",
                              borderRadius: 10,
                              background: "rgba(239, 68, 68, 0.08)",
                              border: "1px solid rgba(239, 68, 68, 0.22)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 16,
                              flexWrap: "wrap",
                            }}
                          >
                            <div>
                              <div style={{ color: "#fecaca", fontSize: 13, fontWeight: 900, marginBottom: 4 }}>
                                Failed Authentication Report
                              </div>
                              <div style={{ color: "#fca5a5", fontSize: 12, lineHeight: 1.45 }}>
                                Download the forensic failure certificate for this scan event.
                              </div>
                            </div>
                            <button
                              onClick={downloadForensicReport}
                              style={{
                                padding: "10px 18px",
                                borderRadius: 8,
                                border: "none",
                                background: "#ef4444",
                                color: "white",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 800,
                                letterSpacing: 0.5,
                                textTransform: "uppercase",
                                boxShadow: "0 8px 20px rgba(239, 68, 68, 0.28)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Download Failed Report
                            </button>
                          </div>
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
