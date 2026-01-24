import React, { useState, useRef, useEffect } from "react";
import ProfilePopup from "./ProfilePopup";

import { QRCodeCanvas } from "qrcode.react";
import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";
import { BrowserMultiFormatReader } from "@zxing/library";

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
  const qrRef = useRef();
  const detailsRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

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

    const codeReader = new BrowserMultiFormatReader();
    let controlsPromise;
    
    controlsPromise = codeReader.decodeFromConstraints(
      { video: { facingMode: cameraFacingMode } },
      videoRef.current,
      (result, err) => {
        if (result) {
          setScanInput(result.getText());
          processScan(result.getText());
          setIsCameraActive(false);
          playBeep();
        }
      }
    ).catch((err) => {
      console.error(err);
      setIsCameraActive(false);
      setValidationError("Camera access denied or unavailable.");
    });

    return () => {
      if (controlsPromise) {
        controlsPromise.then((controls) => controls.stop()).catch(() => {});
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

    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const finalEvidenceSource = locationDetails 
      ? `${evidenceSource} [ ${locationDetails} ]` 
      : evidenceSource;

    const payload = {
      op: name,
      bid: badge,
      role: role,
      src: finalEvidenceSource,
      uid: id,
      ts: timestamp,
      sec: sections,
    };

    const payloadString = JSON.stringify(payload);
    const hash = CryptoJS.SHA256(payloadString).toString();

    const formattedReport = `

         ██ P.H.A.N.I.X ██
     FORENSIC-QR-ARCHITECT
================================
CASE ID   : ${id}
TIMESTAMP : ${new Date(timestamp).toLocaleString()}
STATUS    : SEALED / VERIFIED
--------------------------------
OPERATOR NAME : ${name}
BADGE ID      : ${badge}
ROLE          : ${role}
EVIDENCE FROM : ${finalEvidenceSource}
================================
[ EVIDENCE MANIFEST ]
${sections.map((s, i) => `
#${i + 1} :: ${s.title.toUpperCase()}
${s.content}`).join("\n\n")}
================================
[ CRYPTOGRAPHIC SIGNATURE ]
SHA-256 HASH:
${hash}
--------------------------------
DIGITALLY SIGNED BY PHANIX
(C) ${new Date().getFullYear()} FORENSIC-QR-ARCHITECT
END OF RECORD`.trim();

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
        // Create canvas with extra padding for long QR codes
        const canvas = document.createElement('canvas');
        const padding = 100; // Increased padding for better detection
        canvas.width = img.width + (padding * 2);
        canvas.height = img.height + (padding * 2);
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, padding, padding);
        
        const codeReader = new BrowserMultiFormatReader();
        
        // Strategy 1: Try padded canvas
        codeReader.decodeFromImageUrl(canvas.toDataURL())
          .then((result) => {
            const text = result.getText();
            setScanInput(text);
            processScan(text);
            playBeep();
          })
          .catch((err) => {
            console.error("Padded scan failed, trying original...", err);
            
            // Strategy 2: Try original image
            codeReader.decodeFromImageUrl(event.target.result)
              .then((result) => {
                const text = result.getText();
                setScanInput(text);
                processScan(text);
                playBeep();
              })
              .catch((err2) => {
                console.error("Original scan failed, trying scaled...", err2);
                
                // Strategy 3: Try scaled up version for small QR codes
                const scaledCanvas = document.createElement('canvas');
                const scale = 2;
                scaledCanvas.width = (img.width + padding * 2) * scale;
                scaledCanvas.height = (img.height + padding * 2) * scale;
                const scaledCtx = scaledCanvas.getContext('2d');
                scaledCtx.fillStyle = '#FFFFFF';
                scaledCtx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);
                scaledCtx.drawImage(img, padding * scale, padding * scale, img.width * scale, img.height * scale);
                
                codeReader.decodeFromImageUrl(scaledCanvas.toDataURL())
                  .then((result) => {
                    const text = result.getText();
                    setScanInput(text);
                    processScan(text);
                    playBeep();
                  })
                  .catch((err3) => {
                    console.error("All scan attempts failed", err3);
                    
                    // Strategy 4: Try with different hints for complex QR codes
                    const hints = new Map();
                    hints.set(2, true); // PURE_BARCODE
                    hints.set(3, true); // TRY_HARDER
                    
                    const advancedReader = new BrowserMultiFormatReader(hints);
                    
                    advancedReader.decodeFromImageUrl(canvas.toDataURL())
                      .then((result) => {
                        const text = result.getText();
                        setScanInput(text);
                        processScan(text);
                        playBeep();
                      })
                      .catch((err4) => {
                        console.error("Advanced scan failed", err4);
                        setValidationError("Unable to decode QR code. The image may be too blurry, damaged, or not contain a valid QR code. Please try a clearer image.");
                      });
                  });
              });
          });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const processScan = (data = scanInput) => {
    const content = typeof data === 'string' ? data : scanInput;
    if (!content.trim()) return;

    if (content.includes("FORENSIC-QR-ARCHITECT")) {
      const lines = content.split('\n');
      const getValue = (key) => {
        const line = lines.find(l => l.includes(key));
        return line ? line.split(':')[1].trim() : 'N/A';
      };

      const id = getValue('CASE ID');
      const timestamp = getValue('TIMESTAMP');
      const op = getValue('OPERATOR NAME');
      const bid = getValue('BADGE ID');
      const role = getValue('ROLE');
      const src = getValue('EVIDENCE FROM');

      let hash = "";
      const hashIndex = lines.findIndex(l => l.includes("SHA-256 HASH:"));
      if (hashIndex !== -1 && lines[hashIndex + 1]) {
        hash = lines[hashIndex + 1].trim();
      }

      const manifestStart = lines.findIndex(l => l.includes("[ EVIDENCE MANIFEST ]"));
      const sigStart = lines.findIndex(l => l.includes("[ CRYPTOGRAPHIC SIGNATURE ]"));
      
      let sec = [];
      if (manifestStart !== -1 && sigStart !== -1) {
        const sectionLines = lines.slice(manifestStart + 1, sigStart);
        let currentTitle = "";
        let currentContent = "";
        sectionLines.forEach(line => {
          if (line.trim().startsWith("#") && line.includes("::")) {
            if (currentTitle) sec.push({ title: currentTitle, content: currentContent.trim() });
            currentTitle = line.split("::")[1].trim();
            currentContent = "";
          } else if (line.trim() !== "================================" && line.trim() !== "") {
            currentContent += line + "\n";
          }
        });
        if (currentTitle) sec.push({ title: currentTitle, content: currentContent.trim() });
      }

      setScanResult({
        type: 'valid',
        data: { uid: id, ts: timestamp, op, bid, role, src, sec },
        hash: hash
      });
    } else {
      setScanResult({ type: 'raw', data: content });
    }
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
          <span style={{
            position: 'relative',
            zIndex: 1,
            color: "#f4f4f5",
            fontWeight: 500,
            fontSize: 24,
            letterSpacing: -0.5,
            fontFamily: 'inherit'
          }}>
            P.H.A.N.I.X
          </span>
          
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
                fontWeight: 600,
                fontSize: '13px',
                letterSpacing: '0.2px',
                lineHeight: '1.4'
            }}>
                Phani
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
                fontSize: 22,
                fontWeight: 400,
                letterSpacing: "0",
                color: "#f4f4f5"
              }}>
                FORENSIC-QR-ARCHITECT
              </h1>
              <p style={{ margin: "8px 0 0", color: "#a1a1aa", fontSize: 14, maxWidth: 450, lineHeight: 1.5 }}>
                Advanced Investigation & Evidence Logger. Secure, immutable, and verifiable digital chain of custody.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

               {/* i need to channge the link here ok  */}
              {/* ABOUT PHANIX */}
              <a
                href="https://p-h-a-n-i-x-itigation-e-xpert.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "#3f3f46",
                  border: "none",
                  color: "#f4f4f5",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  transition: "all 0.2s",
                  textDecoration: "none"
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
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
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
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
                        Advanced tools for deep forensic analysis.
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

        {/* GENERATOR */}
        {tab === "generator" && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
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
                  placeholder="e.g. Phaneendhar Nittala"
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
                  placeholder="e.g. PHX-8829"
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
                  placeholder="e.g. Senior Investigator"
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
                      color: "#f4f4f5",
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
                  marginBottom: 25,
                  padding: "14px 18px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#fca5a5",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  position: "relative",
                  zIndex: 1,
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)"
                }}>
                  <span style={{ fontSize: "20px" }}>!</span>
                  <span style={{ fontWeight: 500 }}>{validationError}</span>
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
                  OR PASTE QR CONTENT MANUALLY
                </label>
                <textarea
                  placeholder="Paste QR text content here for instant verification..."
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  style={{
                    width: "100%",
                    height: 140,
                    padding: 16,
                    background: "linear-gradient(135deg, #18181b 0%, #1f1f23 100%)",
                    border: "1px solid #52525b",
                    borderRadius: 10,
                    color: "#f4f4f5",
                    fontFamily: "monospace",
                    fontSize: 13,
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                    marginBottom: 20,
                    transition: 'all 0.3s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = `1px solid ${accent}`;
                    e.currentTarget.style.boxShadow = `0 0 20px rgba(59, 130, 246, 0.2)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = '1px solid #52525b';
                    e.currentTarget.style.boxShadow = 'none';
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

        {/* INSIGHTS */}
        {tab === "insights" && (
          <div style={{ marginTop: 20, animation: "fadeIn 0.6s ease" }}>
            {/* INTRO CARD */}
            <div
              style={{
                ...materialCardStyle,
                padding: 40,
                marginBottom: 30,
                background: "#27272a",
              }}
            >
              <h2 style={{ marginTop: 0, fontSize: 24, letterSpacing: "-0.5px" }}>
                Digital Integrity & Chain of Custody
              </h2>
              <p style={{ opacity: 0.7, lineHeight: 1.7, fontSize: 15, maxWidth: "700px" }}>
                The <strong style={{ color: "#f4f4f5" }}>Forensic QR Architect</strong> employs military-grade cryptography to ensure evidence remains admissible and tamper-proof. By binding physical evidence to a digital SHA-256 signature, we create an unbreakable chain of trust.
              </p>
            </div>

            {/* PRINCIPLES GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 30 }}>
                {[
                    { icon: "🔒", title: "Immutable Ledger", desc: "Once data is sealed, not a single bit can be altered without breaking the cryptographic signature." },
                    { icon: "🔗", title: "Chain of Custody", desc: "Every step from collection to archiving is timestamped and identity-verified." },
                    { icon: "👁️", title: "Zero-Trust Verify", desc: "Verification relies on mathematical certainty (SHA-256), not human trust." }
                ].map((item, i) => (
                    <div key={i} style={{
                        background: "#27272a",
                        border: "1px solid #3f3f46",
                        borderRadius: 12,
                        padding: 24,
                        transition: "transform 0.3s ease",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#3f3f46"}
                    onMouseLeave={e => e.currentTarget.style.background = "#27272a"}
                    >
                        <div style={{ fontSize: 32, marginBottom: 15 }}>{item.icon}</div>
                        <h3 style={{ margin: "0 0 10px", fontSize: 16, color: "#f4f4f5" }}>{item.title}</h3>
                        <p style={{ margin: 0, fontSize: 13, opacity: 0.6, lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                ))}
            </div>

            {/* VISUAL FLOW */}
            <div style={{ ...materialCardStyle, padding: 30, marginBottom: 30 }}>
                <h3 style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: 1, color: accent, marginBottom: 25 }}>
                    Securing The Evidence Flow
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, opacity: 0.9 }}>
                    {["Raw Evidence", "SHA-256 Hashing", "Digital Seal", "QR Anchor"].map((step, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                                padding: "10px 18px",
                                background: i === 3 ? accent : "#3f3f46",
                                borderRadius: 4,
                                fontSize: 13,
                                fontWeight: 500,
                                color: i === 3 ? "white" : "#f4f4f5",
                                border: i === 3 ? "none" : "1px solid #52525b"
                            }}>
                                {step}
                            </div>
                            {i < 3 && <div style={{ margin: "0 10px", color: "rgba(255,255,255,0.2)" }}>→</div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* INTERACTIVE TERMINAL */}
            <div
              style={{
                ...materialCardStyle,
                padding: 0,
                overflow: 'hidden',
                border: `1px solid #3f3f46`,
                boxShadow: `0 2px 6px rgba(0,0,0,0.15)`
              }}
            >
              <div style={{ 
                  background: "#18181b", 
                  padding: "12px 20px", 
                  borderBottom: "1px solid #3f3f46",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
              }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f56" }}></div>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }}></div>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27c93f" }}></div>
                  <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.5, fontFamily: "monospace" }}>phanix_hash_terminal — -zsh — 80x24</span>
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
      `}</style>
    </div>
  );
}
