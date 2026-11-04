import React, { useState, useRef, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";
import { BrowserMultiFormatReader } from "@zxing/library";
import jsQR from "jsqr";
import { jsPDF } from "jspdf";
import phanixLogo from "./assets/phanix_logo.png";
import developerPhoto from "./assets/phaneendhar-profile.jpg";
import devanagariFontUrl from "./assets/NotoSansDevanagari-Regular.ttf?url";
import teluguFontUrl from "./assets/NotoSansTelugu-Regular.ttf?url";
import { db, auth } from "./firebase";
import { doc, getDoc, getDocs, addDoc, collection, query, orderBy, limit, serverTimestamp, runTransaction } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

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

const REPORT_TEXT = {
  hi: {
    "FORENSIC EVIDENCE REPORT": "फोरेंसिक साक्ष्य रिपोर्ट", "FORENSIC ANALYSIS FAILURE REPORT": "फोरेंसिक विश्लेषण विफलता रिपोर्ट",
    "CASE SUMMARY": "मामले का सारांश", "OFFICER, SOURCE AND CUSTODY": "अधिकारी, स्रोत और अभिरक्षा", "CHAIN OF CUSTODY SNAPSHOT": "अभिरक्षा श्रृंखला सारांश",
    "CRYPTOGRAPHIC SIGNATURE": "क्रिप्टोग्राफ़िक हस्ताक्षर", "VALIDATION CHECKLIST": "सत्यापन जाँच सूची", "FORENSIC INDICATORS": "फोरेंसिक संकेतक", "EVIDENCE MANIFEST": "साक्ष्य विवरण सूची", "DOCUMENT ADVISORY": "दस्तावेज़ संबंधी सूचना",
    "CASE NUMBER": "मामला संख्या", "EXHIBIT NUMBER": "प्रदर्श संख्या", "PACKAGE ID": "पैकेज आईडी", "REFERENCE TIME": "संदर्भ समय", "FSL DIVISION": "एफएसएल विभाग", "PRIORITY": "प्राथमिकता", "OPERATOR": "अधिकृत अधिकारी", "BADGE / ROLE": "बैज / भूमिका", "RECEIVED BY": "प्राप्तकर्ता", "SEAL CONDITION": "सील की स्थिति", "EVIDENCE SOURCE": "साक्ष्य का स्रोत", "VILLAGE": "गाँव", "DISTRICT": "ज़िला", "STATE": "राज्य",
    "Collected": "संग्रह किया", "Source logged": "स्रोत दर्ज किया", "FSL received": "एफएसएल में प्राप्त", "Digital seal": "डिजिटल सील", "Not recorded": "दर्ज नहीं", "No details recorded.": "कोई विवरण दर्ज नहीं है।", "No evidence manifest was embedded in this payload.": "इस पैकेज में साक्ष्य विवरण सूची शामिल नहीं है।",
    "PASSED": "सफल", "PASS": "सफल", "FAIL": "विफल", "SKIP": "छोड़ा गया", "NONE": "कोई नहीं", "TRUSTED SEAL": "विश्वसनीय सील", "TAMPERED PACKAGE": "परिवर्तित पैकेज", "UNREGISTERED": "अपंजीकृत", "QR CORRUPTED": "क्यूआर पढ़ा नहीं जा सका",
    "Required Case Fields": "आवश्यक मामला विवरण", "Evidence Manifest": "साक्ष्य विवरण सूची", "Cryptographic Seal": "क्रिप्टोग्राफ़िक सील", "Pattern detection": "पैटर्न पहचान", "Data extraction": "डेटा निष्कर्षण", "Integrity check": "अखंडता जाँच", "PHANIX seal validation": "PHANIX सील सत्यापन",
    "This two-page certificate is a concise evidentiary summary. Preserve the original QR payload and generated file together for full verification.": "यह प्रमाणपत्र साक्ष्य का संक्षिप्त सारांश है। पूर्ण सत्यापन के लिए मूल क्यूआर डेटा और बनाई गई फ़ाइल को साथ सुरक्षित रखें।",
    "Generated and sealed by PHANIX Architect. This report records the case metadata, custody path, evidence manifest, and SHA-256 signature at creation time.": "यह रिपोर्ट PHANIX Architect द्वारा बनाई और सील की गई है। इसमें निर्माण के समय का मामला विवरण, अभिरक्षा क्रम, साक्ष्य सूची और SHA-256 हस्ताक्षर दर्ज हैं।",
    "Report generated from PHANIX package builder": "रिपोर्ट PHANIX पैकेज बिल्डर से बनाई गई", "Case metadata captured": "मामले का विवरण दर्ज किया गया", "Evidence manifest attached": "साक्ष्य सूची संलग्न है", "SHA-256 package signature recorded": "SHA-256 पैकेज हस्ताक्षर दर्ज है",
    "REPORT LANGUAGE": "रिपोर्ट की भाषा", "Choose the PDF language. Original case notes and identifiers remain unchanged.": "पीडीएफ़ की भाषा चुनें। मूल मामले के नोट और पहचान विवरण अपरिवर्तित रहेंगे।", "Issued": "जारी किया गया", "Page": "पृष्ठ", "of": "में से", "Certificate": "प्रमाणपत्र", "Additional manifest items omitted from this two-page summary:": "इस दो-पृष्ठीय सारांश में छोड़ी गई अतिरिक्त साक्ष्य प्रविष्टियाँ:",
    "Original case notes and identifiers remain unchanged.": "मामले के मूल नोट और पहचान विवरण अपरिवर्तित रखे गए हैं।", "No high-risk indicators were detected during automated analysis.": "स्वचालित विश्लेषण में उच्च जोखिम के संकेत नहीं मिले।", "PHANIX Secure Package": "PHANIX सुरक्षित पैकेज", "Evidence Item": "साक्ष्य प्रविष्टि",
    "Generic Data / Plaintext": "सामान्य डेटा / सादा पाठ", "Unregistered PHANIX ID": "अपंजीकृत PHANIX आईडी", "URL / Web Resource": "URL / वेब संसाधन", "External / Untrusted Data": "बाहरी / अविश्वसनीय डेटा", "UNVERIFIED DATA": "असत्यापित डेटा", "AUTHENTICATION FAILED": "प्रमाणीकरण विफल", "LOCAL CHECK ONLY": "केवल स्थानीय जाँच", "FORMAT VALIDATED": "प्रारूप सत्यापित", "HIGH RISK SOURCE": "उच्च जोखिम स्रोत", "Structural Analysis": "संरचनात्मक विश्लेषण", "Internal Hash Check": "आंतरिक हैश जाँच", "Authenticity Seal": "प्रामाणिकता सील", "SHA-256 mismatch detected": "SHA-256 मेल नहीं मिला", "Evidence data altered after sealing": "सील के बाद साक्ष्य डेटा बदला गया", "Do not trust this record": "इस रिकॉर्ड पर भरोसा न करें", "Evidence ID not found in database": "डेटाबेस में साक्ष्य आईडी नहीं मिली", "Older QR or forged QR": "पुराना या जाली QR", "Hash matches the printed data only": "हैश केवल मुद्रित डेटा से मेल खाता है", "Evidence ID found in database": "डेटाबेस में साक्ष्य आईडी मिली", "SHA-256 recalculated and matched": "SHA-256 की पुनर्गणना कर मिलान किया गया", "Chain of custody intact": "अभिरक्षा श्रृंखला अक्षुण्ण है", "Possible forged QR": "संभावित जाली QR", "Recognized URL structure detected. Source external and unverified.": "पहचाना गया URL प्रारूप मिला। स्रोत बाहरी और असत्यापित है।", "IP-based URL detected. Frequently used in malicious C2 or phishing.": "IP-आधारित URL मिला। इसका उपयोग दुर्भावनापूर्ण C2 या फ़िशिंग में हो सकता है।", "IP-based URL detected (potential phishing or C2 link)": "IP-आधारित URL मिला (संभावित फ़िशिंग या C2 लिंक)", "Non-Phanix signature detected": "गैर-PHANIX हस्ताक्षर मिला", "External data source": "बाहरी डेटा स्रोत", "Integrity check failed": "अखंडता जाँच विफल", "Report ID": "रिपोर्ट आईडी", "Evidence source": "साक्ष्य स्रोत", "Intake timestamp": "प्राप्ति समय",
    "Data originates from an external source without a PHANIX digital seal.": "डेटा PHANIX डिजिटल सील के बिना बाहरी स्रोत से आया है।", "The data does not match its SHA-256 hash or the hash stored in the evidence database. This record was modified.": "डेटा का SHA-256 हैश या साक्ष्य डेटाबेस में रखा हैश मेल नहीं खाता। इस रिकॉर्ड में बदलाव हुआ है।", "The hash matches the data, but this Evidence ID is not in the database. A forged QR could look the same.": "हैश डेटा से मेल खाता है, लेकिन यह साक्ष्य आईडी डेटाबेस में नहीं है। जाली QR भी ऐसा दिख सकता है।", "Digitally signed and sealed by PHANIX Architect. Hash matches the database record.": "PHANIX Architect द्वारा डिजिटल हस्ताक्षर और सील किया गया। हैश डेटाबेस रिकॉर्ड से मेल खाता है।", "This Evidence ID does not exist in the PHANIX database. The QR is fake or the record was never saved.": "यह साक्ष्य आईडी PHANIX डेटाबेस में मौजूद नहीं है। QR जाली हो सकता है या रिकॉर्ड कभी सहेजा नहीं गया।", "The scanned QR does not match the PHANIX forensic architecture. No cryptographic trust can be established.": "स्कैन किया गया QR PHANIX फोरेंसिक संरचना से मेल नहीं खाता। क्रिप्टोग्राफ़िक विश्वास स्थापित नहीं किया जा सकता।",
    "QR analysis could not be completed": "क्यूआर विश्लेषण पूरा नहीं हो सका", "The submitted QR pattern was unreadable, incomplete, malformed, or visually degraded. No cryptographic trust decision can be made from this intake.": "दिया गया क्यूआर पैटर्न पढ़ने योग्य नहीं था, अधूरा था, गलत संरचना में था या दृश्य रूप से क्षतिग्रस्त था। इस सामग्री के आधार पर क्रिप्टोग्राफ़िक विश्वसनीयता तय नहीं की जा सकती।",
    "INTAKE SUMMARY": "प्राप्ति सारांश", "FAILURE STATUS": "विफलता की स्थिति", "CASE HANDLING NOTE": "मामला प्रबंधन टिप्पणी", "TECHNICAL OBSERVATION": "तकनीकी अवलोकन", "RECOMMENDED NEXT ACTIONS": "अनुशंसित अगले कदम", "EVIDENTIARY LIMITATION": "साक्ष्य संबंधी सीमा", "FORENSIC ADVISORY": "फोरेंसिक सूचना",
    "Attach this failure report to the incident file only as documentation of non-extractable QR evidence. It does not certify authenticity, origin, or payload integrity.": "इस विफलता रिपोर्ट को केवल न पढ़े जा सकने वाले क्यूआर साक्ष्य के दस्तावेज़ीकरण के रूप में घटना फ़ाइल में संलग्न करें। यह प्रामाणिकता, स्रोत या डेटा अखंडता प्रमाणित नहीं करती।",
    "The analysis pipeline attempted QR pattern discovery and data extraction. The evidence did not provide a readable payload suitable for SHA-256 comparison or PHANIX package reconstruction.": "विश्लेषण प्रक्रिया ने क्यूआर पैटर्न पहचानने और डेटा निकालने का प्रयास किया। साक्ष्य से ऐसा पठनीय डेटा नहीं मिला जिसकी SHA-256 तुलना या PHANIX पैकेज पुनर्निर्माण किया जा सके।",
    "Capture a sharper image under even lighting.": "समान रोशनी में अधिक स्पष्ट छवि लें।", "Avoid glare, heavy cropping, rotation, and compression.": "चमक, अधिक क्रॉपिंग, घुमाव और संपीड़न से बचें।", "Preserve the original media file before further handling.": "आगे की प्रक्रिया से पहले मूल मीडिया फ़ाइल सुरक्षित रखें।", "If physical evidence is damaged, document condition with photographs.": "यदि भौतिक साक्ष्य क्षतिग्रस्त है, तो उसकी स्थिति की तस्वीरें लें।", "Rescan the source after stabilizing the image or camera feed.": "छवि या कैमरा फ़ीड स्थिर होने के बाद स्रोत को फिर से स्कैन करें।",
    "This document is a failure certificate, not a verification certificate. It confirms that the QR could not be decoded by the application at intake time. Treat any later manual reconstruction as a separate examination event.": "यह विफलता प्रमाणपत्र है, सत्यापन प्रमाणपत्र नहीं। यह दर्ज करता है कि प्राप्ति के समय ऐप क्यूआर को डिकोड नहीं कर सका। बाद में किया गया कोई भी मैन्युअल पुनर्निर्माण अलग परीक्षा घटना माना जाए।",
    "Keep this two-page failure report with the original intake material and retry validation only from preserved source media.": "इस दो-पृष्ठीय विफलता रिपोर्ट को मूल प्राप्ति सामग्री के साथ रखें और सत्यापन का पुनः प्रयास केवल सुरक्षित मूल मीडिया से करें।",
  },
  te: {
    "FORENSIC EVIDENCE REPORT": "ఫోరెన్సిక్ సాక్ష్య నివేదిక", "FORENSIC ANALYSIS FAILURE REPORT": "ఫోరెన్సిక్ విశ్లేషణ వైఫల్య నివేదిక",
    "CASE SUMMARY": "కేసు సారాంశం", "OFFICER, SOURCE AND CUSTODY": "అధికారి, మూలం మరియు సంరక్షణ బాధ్యత", "CHAIN OF CUSTODY SNAPSHOT": "సాక్ష్య సంరక్షణ క్రమం",
    "CRYPTOGRAPHIC SIGNATURE": "క్రిప్టోగ్రాఫిక్ సంతకం", "VALIDATION CHECKLIST": "ధృవీకరణ తనిఖీ జాబితా", "FORENSIC INDICATORS": "ఫోరెన్సిక్ సూచనలు", "EVIDENCE MANIFEST": "సాక్ష్యాల వివరాల జాబితా", "DOCUMENT ADVISORY": "పత్ర సూచన",
    "CASE NUMBER": "కేసు సంఖ్య", "EXHIBIT NUMBER": "సాక్ష్య వస్తువు సంఖ్య", "PACKAGE ID": "ప్యాకేజీ ఐడి", "REFERENCE TIME": "సూచన సమయం", "FSL DIVISION": "ఎఫ్‌ఎస్‌ఎల్ విభాగం", "PRIORITY": "ప్రాధాన్యత", "OPERATOR": "అధీకృత అధికారి", "BADGE / ROLE": "బ్యాడ్జ్ / పాత్ర", "RECEIVED BY": "స్వీకరించిన అధికారి", "SEAL CONDITION": "సీల్ స్థితి", "EVIDENCE SOURCE": "సాక్ష్యం మూలం", "VILLAGE": "గ్రామం", "DISTRICT": "జిల్లా", "STATE": "రాష్ట్రం",
    "Collected": "సేకరించినది", "Source logged": "మూలం నమోదు", "FSL received": "ఎఫ్‌ఎస్‌ఎల్‌లో స్వీకరణ", "Digital seal": "డిజిటల్ సీల్", "Not recorded": "నమోదు చేయలేదు", "No details recorded.": "వివరాలు నమోదు చేయలేదు.", "No evidence manifest was embedded in this payload.": "ఈ ప్యాకేజీలో సాక్ష్యాల వివరాల జాబితా లేదు.",
    "PASSED": "విజయవంతం", "PASS": "విజయవంతం", "FAIL": "విఫలమైంది", "SKIP": "దాటవేయబడింది", "NONE": "ఏదీ లేదు", "TRUSTED SEAL": "విశ్వసనీయ సీల్", "TAMPERED PACKAGE": "మార్చబడిన ప్యాకేజీ", "UNREGISTERED": "నమోదు కానిది", "QR CORRUPTED": "క్యూఆర్ చదవలేకపోయాం",
    "Required Case Fields": "అవసరమైన కేసు వివరాలు", "Evidence Manifest": "సాక్ష్యాల వివరాల జాబితా", "Cryptographic Seal": "క్రిప్టోగ్రాఫిక్ సీల్", "Pattern detection": "నమూనా గుర్తింపు", "Data extraction": "డేటా వెలికితీత", "Integrity check": "సమగ్రత తనిఖీ", "PHANIX seal validation": "PHANIX సీల్ ధృవీకరణ",
    "This two-page certificate is a concise evidentiary summary. Preserve the original QR payload and generated file together for full verification.": "ఈ రెండు పేజీల ధృవీకరణ పత్రం సాక్ష్యాల సంక్షిప్త సారాంశం. పూర్తి ధృవీకరణ కోసం అసలు QR డేటా మరియు రూపొందించిన ఫైల్‌ను కలిపి భద్రపరచండి.",
    "Generated and sealed by PHANIX Architect. This report records the case metadata, custody path, evidence manifest, and SHA-256 signature at creation time.": "ఈ నివేదిక PHANIX Architect ద్వారా రూపొందించి సీల్ చేయబడింది. రూపొందించిన సమయంలోని కేసు వివరాలు, సంరక్షణ క్రమం, సాక్ష్యాల జాబితా మరియు SHA-256 సంతకం ఇందులో నమోదు చేయబడ్డాయి.",
    "Report generated from PHANIX package builder": "PHANIX ప్యాకేజీ బిల్డర్ ద్వారా రూపొందించిన నివేదిక", "Case metadata captured": "కేసు వివరాలు నమోదు చేయబడ్డాయి", "Evidence manifest attached": "సాక్ష్యాల జాబితా జతచేయబడింది", "SHA-256 package signature recorded": "SHA-256 ప్యాకేజీ సంతకం నమోదు చేయబడింది",
    "REPORT LANGUAGE": "నివేదిక భాష", "Choose the PDF language. Original case notes and identifiers remain unchanged.": "PDF భాషను ఎంచుకోండి. అసలు కేసు గమనికలు, గుర్తింపు వివరాలు మారవు.", "Issued": "జారీ చేసిన సమయం", "Page": "పేజీ", "of": "లో", "Certificate": "ధృవీకరణ పత్రం", "Additional manifest items omitted from this two-page summary:": "ఈ రెండు పేజీల సారాంశంలో చేర్చని అదనపు సాక్ష్య అంశాలు:",
    "Original case notes and identifiers remain unchanged.": "అసలు కేసు గమనికలు, గుర్తింపు వివరాలు యథాతథంగా ఉంచబడ్డాయి.", "No high-risk indicators were detected during automated analysis.": "స్వయంచాలక విశ్లేషణలో అధిక ప్రమాద సూచనలు గుర్తించబడలేదు.", "PHANIX Secure Package": "PHANIX సురక్షిత ప్యాకేజీ", "Evidence Item": "సాక్ష్య అంశం",
    "Generic Data / Plaintext": "సాధారణ డేటా / సాదా పాఠ్యం", "Unregistered PHANIX ID": "నమోదుకాని PHANIX ID", "URL / Web Resource": "URL / వెబ్ వనరు", "External / Untrusted Data": "బాహ్య / అవిశ్వసనీయ డేటా", "UNVERIFIED DATA": "ధృవీకరించని డేటా", "AUTHENTICATION FAILED": "ప్రామాణీకరణ విఫలమైంది", "LOCAL CHECK ONLY": "స్థానిక తనిఖీ మాత్రమే", "FORMAT VALIDATED": "ఫార్మాట్ ధృవీకరించబడింది", "HIGH RISK SOURCE": "అధిక ప్రమాద మూలం", "Structural Analysis": "నిర్మాణ విశ్లేషణ", "Internal Hash Check": "అంతర్గత హాష్ తనిఖీ", "Authenticity Seal": "ప్రామాణికత సీల్", "SHA-256 mismatch detected": "SHA-256 సరిపోలలేదు", "Evidence data altered after sealing": "సీల్ చేసిన తర్వాత సాక్ష్య డేటా మార్చబడింది", "Do not trust this record": "ఈ రికార్డును నమ్మవద్దు", "Evidence ID not found in database": "డేటాబేస్‌లో సాక్ష్య ID కనబడలేదు", "Older QR or forged QR": "పాత లేదా నకిలీ QR", "Hash matches the printed data only": "హాష్ ముద్రించిన డేటాతో మాత్రమే సరిపోలింది", "Evidence ID found in database": "డేటాబేస్‌లో సాక్ష్య ID కనబడింది", "SHA-256 recalculated and matched": "SHA-256 మళ్లీ లెక్కించి సరిపోల్చబడింది", "Chain of custody intact": "సాక్ష్య సంరక్షణ క్రమం యథాతథంగా ఉంది", "Possible forged QR": "నకిలీ QR అయ్యే అవకాశం ఉంది", "Recognized URL structure detected. Source external and unverified.": "గుర్తించిన URL నిర్మాణం ఉంది. మూలం బాహ్యమైనది, ధృవీకరించబడలేదు.", "IP-based URL detected. Frequently used in malicious C2 or phishing.": "IP ఆధారిత URL గుర్తించబడింది. హానికర C2 లేదా ఫిషింగ్‌లో తరచుగా ఉపయోగిస్తారు.", "IP-based URL detected (potential phishing or C2 link)": "IP ఆధారిత URL గుర్తించబడింది (ఫిషింగ్ లేదా C2 లింక్ అయ్యే అవకాశం)", "Non-Phanix signature detected": "PHANIX కాని సంతకం గుర్తించబడింది", "External data source": "బాహ్య డేటా మూలం", "Integrity check failed": "సమగ్రత తనిఖీ విఫలమైంది", "Report ID": "నివేదిక ID", "Evidence source": "సాక్ష్య మూలం", "Intake timestamp": "స్వీకరణ సమయం",
    "Data originates from an external source without a PHANIX digital seal.": "PHANIX డిజిటల్ సీల్ లేని బాహ్య మూలం నుంచి డేటా వచ్చింది.", "The data does not match its SHA-256 hash or the hash stored in the evidence database. This record was modified.": "డేటా యొక్క SHA-256 హాష్ లేదా సాక్ష్య డేటాబేస్‌లోని హాష్ సరిపోలలేదు. ఈ రికార్డు మార్చబడింది.", "The hash matches the data, but this Evidence ID is not in the database. A forged QR could look the same.": "హాష్ డేటాతో సరిపోలింది, కానీ ఈ సాక్ష్య ID డేటాబేస్‌లో లేదు. నకిలీ QR కూడా ఇలాగే కనిపించవచ్చు.", "Digitally signed and sealed by PHANIX Architect. Hash matches the database record.": "PHANIX Architect డిజిటల్ సంతకం చేసి సీల్ చేసింది. హాష్ డేటాబేస్ రికార్డుతో సరిపోలింది.", "This Evidence ID does not exist in the PHANIX database. The QR is fake or the record was never saved.": "ఈ సాక్ష్య ID PHANIX డేటాబేస్‌లో లేదు. QR నకిలీ కావచ్చు లేదా రికార్డు ఎప్పుడూ భద్రపరచబడలేదు.", "The scanned QR does not match the PHANIX forensic architecture. No cryptographic trust can be established.": "స్కాన్ చేసిన QR, PHANIX ఫోరెన్సిక్ నిర్మాణంతో సరిపోలలేదు. క్రిప్టోగ్రాఫిక్ విశ్వసనీయతను స్థాపించలేం.",
    "QR analysis could not be completed": "QR విశ్లేషణ పూర్తి కాలేదు", "The submitted QR pattern was unreadable, incomplete, malformed, or visually degraded. No cryptographic trust decision can be made from this intake.": "సమర్పించిన QR నమూనా చదవలేనిది, అసంపూర్ణమైనది, తప్పుగా రూపొందినది లేదా దృశ్యపరంగా దెబ్బతిన్నది. ఈ స్వీకరణ ఆధారంగా క్రిప్టోగ్రాఫిక్ విశ్వసనీయతను నిర్ణయించలేం.",
    "INTAKE SUMMARY": "స్వీకరణ సారాంశం", "FAILURE STATUS": "వైఫల్య స్థితి", "CASE HANDLING NOTE": "కేసు నిర్వహణ గమనిక", "TECHNICAL OBSERVATION": "సాంకేతిక పరిశీలన", "RECOMMENDED NEXT ACTIONS": "సిఫార్సు చేసిన తదుపరి చర్యలు", "EVIDENTIARY LIMITATION": "సాక్ష్య పరిమితి", "FORENSIC ADVISORY": "ఫోరెన్సిక్ సూచన",
    "Attach this failure report to the incident file only as documentation of non-extractable QR evidence. It does not certify authenticity, origin, or payload integrity.": "ఈ వైఫల్య నివేదికను చదవలేని QR సాక్ష్యానికి సంబంధించిన పత్రంగా మాత్రమే ఘటన ఫైల్‌కు జతచేయండి. ఇది ప్రామాణికత, మూలం లేదా డేటా సమగ్రతను ధృవీకరించదు.",
    "The analysis pipeline attempted QR pattern discovery and data extraction. The evidence did not provide a readable payload suitable for SHA-256 comparison or PHANIX package reconstruction.": "విశ్లేషణ ప్రక్రియ QR నమూనాను గుర్తించి డేటాను వెలికితీయడానికి ప్రయత్నించింది. SHA-256 పోలిక లేదా PHANIX ప్యాకేజీ పునర్నిర్మాణానికి సరిపడే చదవగల డేటా లభించలేదు.",
    "Capture a sharper image under even lighting.": "సమానమైన వెలుతురులో స్పష్టమైన చిత్రాన్ని తీయండి.", "Avoid glare, heavy cropping, rotation, and compression.": "కాంతి ప్రతిబింబం, అధిక క్రాపింగ్, తిప్పడం మరియు కంప్రెషన్‌ను నివారించండి.", "Preserve the original media file before further handling.": "తదుపరి చర్యలకు ముందు అసలు మీడియా ఫైల్‌ను భద్రపరచండి.", "If physical evidence is damaged, document condition with photographs.": "భౌతిక సాక్ష్యం దెబ్బతిన్నట్లయితే, దాని స్థితిని ఫోటోలతో నమోదు చేయండి.", "Rescan the source after stabilizing the image or camera feed.": "చిత్రం లేదా కెమెరా ఫీడ్ స్థిరమైన తర్వాత మూలాన్ని మళ్లీ స్కాన్ చేయండి.",
    "This document is a failure certificate, not a verification certificate. It confirms that the QR could not be decoded by the application at intake time. Treat any later manual reconstruction as a separate examination event.": "ఇది వైఫల్య ధృవీకరణ పత్రమే కానీ ధృవీకరణ నివేదిక కాదు. స్వీకరణ సమయంలో అప్లికేషన్ QR ను డీకోడ్ చేయలేకపోయిందని మాత్రమే ఇది నమోదు చేస్తుంది. తరువాత చేసే మాన్యువల్ పునర్నిర్మాణాన్ని వేరే పరీక్షా సంఘటనగా పరిగణించాలి.",
    "Keep this two-page failure report with the original intake material and retry validation only from preserved source media.": "ఈ రెండు పేజీల వైఫల్య నివేదికను అసలు స్వీకరణ సామగ్రితో ఉంచండి. భద్రపరిచిన మూల మీడియా నుంచే మళ్లీ ధృవీకరణ ప్రయత్నించండి.",
  },
};

const escapeReportHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

export default function ForensicQRGenerator() {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isDeveloperInfoOpen, setIsDeveloperInfoOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [tab, setTab] = useState("generator");
  const [reportLanguage, setReportLanguage] = useState("en");

  // ADMIN DASHBOARD (only the admin email can read the full list, enforced by Firestore rules)
  const [adminUser, setAdminUser] = useState(null);
  const [signedInUser, setSignedInUser] = useState(null);
  const [approvedOfficer, setApprovedOfficer] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [caseSearch, setCaseSearch] = useState("");
  const [adminList, setAdminList] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminPicked, setAdminPicked] = useState(null);
  const [adminHistory, setAdminHistory] = useState([]);
  const [adminStatusFilter, setAdminStatusFilter] = useState("ALL");
  const [adminPriorityFilter, setAdminPriorityFilter] = useState("ALL");
  const [adminDivisionFilter, setAdminDivisionFilter] = useState("ALL");
  const [adminSealFilter, setAdminSealFilter] = useState("ALL");
  const [adminDateFrom, setAdminDateFrom] = useState("");
  const [adminDateTo, setAdminDateTo] = useState("");
  const [adminSortBy, setAdminSortBy] = useState("newest");
  const [adminPage, setAdminPage] = useState(1);
  const [adminCopyFeedback, setAdminCopyFeedback] = useState("");
  const [name, setName] = useState("");
  const [badge, setBadge] = useState("");
  const [role, setRole] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [exhibitNumber, setExhibitNumber] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [regionState, setRegionState] = useState("");
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
  const [qrDownloaded, setQrDownloaded] = useState(false);
  const [reportExportStarted, setReportExportStarted] = useState(false);
  const [showSaveReminder, setShowSaveReminder] = useState(false);
  const [showGeneratedNotice, setShowGeneratedNotice] = useState(false);
  const [pendingSaveAction, setPendingSaveAction] = useState(null);
  const [demoHash, setDemoHash] = useState("");
  const [viewerData, setViewerData] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState("idle");
  const [validationError, setValidationError] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const [hasDefaultedCamera, setHasDefaultedCamera] = useState(false);

  useEffect(() => {
    if (!manifest || (qrDownloaded && reportExportStarted)) return undefined;
    const warnBeforeLeaving = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [manifest, qrDownloaded, reportExportStarted]);

  useEffect(() => {
    if (!manifest) {
      setShowGeneratedNotice(false);
      return undefined;
    }

    setShowGeneratedNotice(true);
    const timeoutId = window.setTimeout(() => setShowGeneratedNotice(false), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [manifest]);

  /**
   * INTERACTIVE BRANDING LOGIC
   * Managing refs and states for cross-component highlighting.
   */
  const aboutIconRef = useRef(null);
  const aboutMenuRef = useRef(null);
  const developerMenuRef = useRef(null);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    if (!isAboutOpen) return undefined;

    const closeOnOutsidePointer = (event) => {
      if (!aboutMenuRef.current?.contains(event.target)) setIsAboutOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsAboutOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isAboutOpen]);

  useEffect(() => {
    if (!isDeveloperInfoOpen) return undefined;

    const closeOnOutsidePointer = (event) => {
      if (!developerMenuRef.current?.contains(event.target)) setIsDeveloperInfoOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsDeveloperInfoOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isDeveloperInfoOpen]);

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined;

    const closeOnOutsidePointer = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) setIsAccountMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsAccountMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isAccountMenuOpen]);

  const openAboutMenu = () => {
    setIsAboutOpen(true);
    
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

  // Only approved password accounts and the admin may read or write evidence.
  useEffect(() => {
    let active = true;
    const stop = onAuthStateChanged(auth, async (user) => {
      if (user?.isAnonymous) {
        if (active) {
          setSignedInUser(null);
          setAdminUser(null);
          setApprovedOfficer(false);
          setTab("generator");
          setAuthReady(true);
        }
        await signOut(auth).catch(() => {});
        return;
      }

      if (!active) return;
      setAuthReady(false);
      setSignedInUser(user || null);
      const isAdmin = user?.email?.toLowerCase() === "nittalaphaneendhar@gmail.com";
      setAdminUser(isAdmin ? user : null);
      setApprovedOfficer(false);

      if (!user) {
        setTab("generator");
        setAdminEmail("");
        setAdminPass("");
        setShowSignInPassword(false);
        setAdminError("");
        setAuthReady(true);
        return;
      }

      if (isAdmin) {
        setTab("admin");
        setApprovedOfficer(true);
        setAdminError("");
        setAuthReady(true);
        return;
      }

      setTab("generator");
      try {
        const approval = await getDoc(doc(db, "authorizedUsers", user.uid));
        const approved = approval.exists()
          && approval.data().active === true
          && approval.data().email?.toLowerCase() === user.email?.toLowerCase();
        if (active) {
          setApprovedOfficer(approved);
          setAdminError(approved ? "" : "This account is not approved yet. Contact the site owner.");
          setAuthReady(true);
        }
      } catch {
        if (active) {
          setApprovedOfficer(false);
          setAdminError("Could not check account access. Firestore rules may need to be published.");
          setAuthReady(true);
        }
      }
    });
    return () => {
      active = false;
      stop();
    };
  }, []);

  // ADMIN: load up to 500 records once (all searching and filtering is done client-side)
  const loadAdminList = async () => {
    setAdminLoading(true);
    setAdminError("");
    setAdminPicked(null);
    try {
      let snap;
      try {
        snap = await getDocs(query(collection(db, "evidence"), orderBy("createdAt", "desc"), limit(500)));
      } catch {
        snap = await getDocs(query(collection(db, "evidence"), limit(500)));
      }
      setAdminList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      setAdminError("Could not load: " + e.message);
    }
    setAdminLoading(false);
  };

  // ADMIN: open one record and load its history
  const openAdminRecord = async (item) => {
    setAdminPicked(item);
    setAdminHistory([]);
    try {
      const snap = await getDocs(query(collection(db, "evidence", item.id, "history"), orderBy("time", "desc"), limit(50)));
      setAdminHistory(snap.docs.map((d) => d.data()));
    } catch (e) {
      setAdminError("Could not load history: " + e.message);
    }
  };

  // ADMIN: load the list when the admin opens the tab
  useEffect(() => {
    if (tab === "admin" && adminUser) {
      loadAdminList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, adminUser]);

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
    if (!isCameraActive || tab !== "scanner") return;

    /**
     * CAMERA INITIALIZATION PIPELINE
     * Enumerate devices and initialize the selected stream.
     */
    let controls;
    let cancelled = false;
    
    const startScanner = async () => {
      try {
        const devices = await codeReaderRef.current.listVideoInputDevices();
        if (cancelled) return;
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
          (result) => {
            if (result) {
              const text = result.getText();
              setScanInput(text);
              processScan(text);
              setIsCameraActive(false);
              setCameraError("");
              playBeep();
            }
          }
        );
        if (cancelled) {
          controls?.stop();
          codeReaderRef.current.reset();
        }
      } catch (err) {
        if (cancelled) return;
        console.error("[FORENSIC_ERROR] Camera initialization failed.", err);
        setIsCameraActive(false);
        setCameraError(err.message || "Camera access denied or unavailable.");
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      controls?.stop();
      codeReaderRef.current.reset();
    };
  }, [isCameraActive, selectedDeviceIndex, tab]);

  const generatePackage = async () => {
    if (!authReady) {
      setValidationError("Checking account access. Please try again in a moment.");
      return;
    }
    if (!approvedOfficer && !adminUser) {
      setValidationError(signedInUser ? "This account is not approved to create evidence records." : "Sign in with an approved account before creating an evidence record.");
      if (!signedInUser) setIsAdminLoginOpen(true);
      return;
    }
    if (!name.trim() || !badge.trim() || !role.trim() || !caseNumber.trim() || !exhibitNumber.trim() || !evidenceSource.trim()) {
      setValidationError("Please fill in all required fields.");
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
      reportLanguage,
      village: village.trim(),
      district: district.trim(),
      state: regionState.trim(),
      uid: id,
      ts: timestamp,
      sec: canonicalSections,
    };

    const payloadString = JSON.stringify(payload);
    const hash = CryptoJS.SHA256(payloadString).toString();

    // SAVE EVIDENCE RECORD TO DATABASE (write-once, rules block edit/delete)
    try {
      const evidenceRef = doc(db, "evidence", id);
      const evidenceRecord = {
        uuid      : id,
        createdByUid: auth.currentUser.uid,
        status    : "SEALED",
        hash      : hash,
        ts        : payload.ts,
        createdAt : serverTimestamp(),
        case      : {
          no       : payload.caseNo,
          exhibit  : payload.exhibitNo,
          division : payload.division,
          priority : payload.priority,
          seal             : payload.seal,
          source           : payload.src,
          reportLanguage   : payload.reportLanguage,
          village          : payload.village,
          district         : payload.district,
          state            : payload.state
        },
        officer   : {
          name       : payload.op,
          badge      : payload.bid,
          role       : payload.role,
          receivedBy : payload.receivedBy
        },
        evidence  : payload.sec
      };
      await runTransaction(db, async (transaction) => {
        const existing = await transaction.get(evidenceRef);
        if (existing.exists()) throw new Error("Package ID already exists. Generate the package again to create a new ID.");
        transaction.set(evidenceRef, evidenceRecord);
      });
    } catch (e) {
      setValidationError("Database save failed: " + e.message);
      setLoading(false);
      return;
    }

    // The evidence record is already saved. A duplicate/retried audit event
    // must not make the user think the case itself failed to save.
    await addDoc(collection(db, "evidence", id, "history"), {
        action: "created",
        by: auth.currentUser.email,
        time: serverTimestamp()
    }).catch((e) => console.warn("Evidence saved, but its creation audit entry was not added:", e));

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
REPORT LANGUAGE : ${{ en: "English", hi: "Hindi", te: "Telugu" }[payload.reportLanguage]}
VILLAGE       : ${payload.village || "Not recorded"}
DISTRICT      : ${payload.district || "Not recorded"}
STATE         : ${payload.state || "Not recorded"}
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
    setQrDownloaded(false);
    setReportExportStarted(false);
    playBeep();
    setLoading(false);
  };

  const clearForm = () => {
    setName("");
    setBadge("");
    setRole("");
    setCaseNumber("");
    setExhibitNumber("");
    setVillage("");
    setDistrict("");
    setRegionState("");
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
    setQrDownloaded(false);
    setReportExportStarted(false);
    setValidationError("");
  };

  const saveQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "forensic_qr.png";
    link.href = canvas.toDataURL();
    link.click();
    setQrDownloaded(true);
  };

  const requestNavigation = (action) => {
    if (manifest && (!qrDownloaded || !reportExportStarted)) {
      setPendingSaveAction(() => action);
      setShowSaveReminder(true);
      return;
    }
    action();
  };

  const dismissSaveReminder = () => {
    setShowSaveReminder(false);
    setPendingSaveAction(null);
  };

  const continueWithoutSaving = () => {
    const action = pendingSaveAction;
    setShowSaveReminder(false);
    setPendingSaveAction(null);
    action?.();
  };

  const copyReport = () => {
    navigator.clipboard.writeText(qrData);
  };

  const printLocalizedReport = (report, language) => {
    const popup = window.open("", "_blank");
    if (!popup) {
      window.alert("Allow pop-ups to print or save this localized report as PDF.");
      return false;
    }
    popup.opener = null;

    const t = (text) => REPORT_TEXT[language]?.[text] || text;
    const controlled = (text) => {
      const common = {
        "Digital Forensics": language === "hi" ? "डिजिटल फोरेंसिक" : "డిజిటల్ ఫోరెన్సిక్స్",
        "Cyber Forensics": language === "hi" ? "साइबर फोरेंसिक" : "సైబర్ ఫోరెన్సిక్స్",
        "Biology / DNA": language === "hi" ? "जीवविज्ञान / डीएनए" : "జీవశాస్త్రం / DNA",
        "Chemistry / Toxicology": language === "hi" ? "रसायन विज्ञान / विषविज्ञान" : "రసాయన శాస్త్రం / టాక్సికాలజీ",
        "Ballistics": language === "hi" ? "बैलिस्टिक्स" : "బాలిస్టిక్స్",
        "Questioned Documents": language === "hi" ? "विवादित दस्तावेज़" : "వివాదాస్పద పత్రాలు",
        "Fingerprint Bureau": language === "hi" ? "फिंगरप्रिंट ब्यूरो" : "వేలిముద్రల విభాగం",
        "Crime Scene Unit": language === "hi" ? "अपराध स्थल इकाई" : "నేర స్థల విభాగం",
        "General Forensic Intake": language === "hi" ? "सामान्य फोरेंसिक प्राप्ति" : "సాధారణ ఫోరెన్సిక్ స్వీకరణ",
        "Routine": language === "hi" ? "सामान्य" : "సాధారణం",
        "Urgent": language === "hi" ? "अत्यावश्यक" : "అత్యవసరం",
        "Court Priority": language === "hi" ? "न्यायालय प्राथमिकता" : "న్యాయస్థాన ప్రాధాన్యత",
        "Re-examination": language === "hi" ? "पुनः परीक्षा" : "పునఃపరీక్ష",
        "Supplementary Submission": language === "hi" ? "पूरक प्रस्तुति" : "అనుబంధ సమర్పణ",
        "Intact": language === "hi" ? "अखंड" : "చెక్కుచెదరని స్థితి",
        "Broken / Re-sealed": language === "hi" ? "टूटी / पुनः सील की गई" : "విరిగినది / మళ్లీ సీల్ చేసినది",
        "Partially damaged": language === "hi" ? "आंशिक रूप से क्षतिग्रस्त" : "పాక్షికంగా దెబ్బతిన్నది",
        "Unsealed on receipt": language === "hi" ? "प्राप्ति के समय बिना सील" : "స్వీకరణ సమయంలో సీల్ లేనిది",
        "Not applicable": language === "hi" ? "लागू नहीं" : "వర్తించదు",
      };
      return common[text] || t(text);
    };
    const data = report.packageData || {};
    const value = (input) => String(input ?? "").trim() || t("Not recorded");
    const dateValue = (input) => {
      const parsed = new Date(input);
      return Number.isNaN(parsed.getTime()) ? value(input) : parsed.toLocaleString(language === "hi" ? "hi-IN" : "te-IN");
    };
    const row = (label, input, translateValue = false) => `<div class="row"><span>${escapeReportHtml(t(label))}</span><strong>${escapeReportHtml(translateValue ? controlled(value(input)) : value(input))}</strong></div>`;
    const trusted = report.trustStatus === "TRUSTED SEAL";
    const localeName = language === "hi" ? "हिन्दी" : "తెలుగు";
    const checklist = (report.checklist || []).map((item) => `<div class="row"><span>${escapeReportHtml(t(item.label))}</span><strong>${escapeReportHtml(t(item.status === "PASS" ? "PASSED" : item.status))}</strong></div>`).join("");
    const indicators = (report.indicators || []).map((item) => `<li>${escapeReportHtml(t(item))}</li>`).join("");
    const manifestItems = Array.isArray(data.sec) ? data.sec : [];
    const manifest = manifestItems.slice(0, 4).map((item, index) => `<div class="manifest-item"><strong>${index + 1}. ${escapeReportHtml(item.title || t("Evidence Item"))}</strong><p>${escapeReportHtml(item.content || t("No details recorded."))}</p></div>`).join("") || `<p>${escapeReportHtml(t("No evidence manifest was embedded in this payload."))}</p>`;
    const omittedManifestNote = manifestItems.length > 4 ? `<p class="omitted">${escapeReportHtml(t("Additional manifest items omitted from this two-page summary:"))} ${manifestItems.length - 4}</p>` : "";
    const sourceId = escapeReportHtml(String(data.caseNo || report.hash || "").replace(/[^a-z0-9_-]/gi, "_"));
    const title = t("FORENSIC EVIDENCE REPORT");
    const fontUrl = language === "hi" ? devanagariFontUrl : teluguFontUrl;
    const issued = new Date().toLocaleString(language === "hi" ? "hi-IN" : "te-IN");
    const classification = controlled(report.classification || "PHANIX Secure Package");
    const trustDescription = t(report.trustDescription || "");
    const markup = `
      <article class="page">
        <header><div><div class="brand">P.H.A.N.I.X</div><h1>${escapeReportHtml(title)}</h1></div><div class="badge ${trusted ? "ok" : "review"}">${escapeReportHtml(t(report.trustStatus))}</div></header>
        <p class="meta">${escapeReportHtml(t("Issued"))}: ${escapeReportHtml(issued)} <span>${escapeReportHtml(t("Certificate"))}: ${escapeReportHtml(String(report.hash || "").slice(0, 18).toUpperCase())}</span></p>
        <section class="verdict"><h2>${escapeReportHtml(classification)}</h2><p>${escapeReportHtml(trustDescription)}</p></section>
        <section><h2>${escapeReportHtml(t("CASE SUMMARY"))}</h2><div class="grid">
          ${row("CASE NUMBER", data.caseNo)}${row("EXHIBIT NUMBER", data.exhibitNo)}${row("PACKAGE ID", data.uid)}${row("REFERENCE TIME", dateValue(data.ts || report.timestamp))}${row("FSL DIVISION", data.division, true)}${row("PRIORITY", data.priority, true)}${row("REPORT LANGUAGE", ({ en: "English", hi: "Hindi", te: "Telugu" })[data.reportLanguage] || data.reportLanguage)}${row("VILLAGE", data.village)}${row("DISTRICT", data.district)}${row("STATE", data.state)}
        </div></section>
        <section><h2>${escapeReportHtml(t("OFFICER, SOURCE AND CUSTODY"))}</h2><div class="grid">
          ${row("OPERATOR", data.op)}${row("BADGE / ROLE", `${value(data.bid)} / ${value(data.role)}`)}${row("RECEIVED BY", data.receivedBy)}${row("SEAL CONDITION", data.seal, true)}${row("EVIDENCE SOURCE", data.src)}
        </div></section>
        <section><h2>${escapeReportHtml(t("CHAIN OF CUSTODY SNAPSHOT"))}</h2><ol class="custody">
          <li><strong>${escapeReportHtml(t("Collected"))}</strong><span>${escapeReportHtml(`${value(data.op)} (${value(data.bid)})`)}</span></li>
          <li><strong>${escapeReportHtml(t("Source logged"))}</strong><span>${escapeReportHtml(value(data.src))}</span></li>
          <li><strong>${escapeReportHtml(t("FSL received"))}</strong><span>${escapeReportHtml(value(data.receivedBy))}</span></li>
          <li><strong>${escapeReportHtml(t("Digital seal"))}</strong><span>${escapeReportHtml(dateValue(data.ts || report.timestamp))}</span></li>
        </ol></section>
        <footer>${escapeReportHtml(t("Choose the PDF language. Original case notes and identifiers remain unchanged."))}</footer>
      </article>
      <article class="page page-two">
        <header><div><div class="brand">P.H.A.N.I.X</div><h1>${escapeReportHtml(title)}</h1></div><span class="page-label">${escapeReportHtml(t("CRYPTOGRAPHIC SIGNATURE"))}</span></header>
        <section><h2>${escapeReportHtml(t("CRYPTOGRAPHIC SIGNATURE"))}</h2><div class="hash">${escapeReportHtml(report.hash || "")}</div></section>
        <section><h2>${escapeReportHtml(t("VALIDATION CHECKLIST"))}</h2>${checklist || `<p>${escapeReportHtml(t("No details recorded."))}</p>`}</section>
        <section><h2>${escapeReportHtml(t("FORENSIC INDICATORS"))}</h2><ul>${indicators || `<li>${escapeReportHtml(t("No details recorded."))}</li>`}</ul></section>
        <section><h2>${escapeReportHtml(t("EVIDENCE MANIFEST"))}</h2>${manifest}${omittedManifestNote}</section>
        <section class="advisory"><h2>${escapeReportHtml(t("DOCUMENT ADVISORY"))}</h2><p>${escapeReportHtml(t("This two-page certificate is a concise evidentiary summary. Preserve the original QR payload and generated file together for full verification."))}</p></section>
        <footer>${escapeReportHtml(localeName)} · ${escapeReportHtml(t("Original case notes and identifiers remain unchanged."))}</footer>
      </article>`;

    popup.document.open();
    popup.document.write(`<!doctype html><html lang="${language}"><head><meta charset="utf-8"><title>${escapeReportHtml(title)}_${sourceId}</title>
      <style>
        @font-face{font-family:ReportIndic;src:url("${fontUrl}") format("truetype");font-weight:400;font-display:swap}
        *{box-sizing:border-box}body{margin:0;background:#e4e4e7;color:#18181b;font:12px ReportIndic,Arial,sans-serif;line-height:1.5}
        .page{width:210mm;min-height:297mm;margin:16px auto;padding:16mm;background:white;display:flex;flex-direction:column;gap:10px}
        header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #2563eb;padding-bottom:12px}.brand{font-size:12px;font-weight:bold;letter-spacing:2px;color:#2563eb}h1{font-size:21px;margin:4px 0 0}h2{font-size:13px;margin:0 0 8px;color:#1d4ed8;border-bottom:1px solid #d4d4d8;padding-bottom:5px}
        .badge,.page-label{padding:6px 10px;border-radius:5px;font-weight:bold;font-size:11px}.ok{background:#dcfce7;color:#166534}.review{background:#fef3c7;color:#92400e}.meta{display:flex;justify-content:space-between;color:#52525b;font-size:10px;margin:0}.verdict{background:#f4f4f5;border-left:4px solid #2563eb;padding:10px 12px}.verdict h2{color:#18181b;border:0;margin:0 0 4px}.verdict p{margin:0}
        section{border:1px solid #e4e4e7;border-radius:6px;padding:10px 12px;break-inside:avoid}.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}.row{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #f1f1f3;padding:5px 0}.row:last-child{border-bottom:0}.row span{color:#52525b}.row strong{text-align:right;overflow-wrap:anywhere;font-weight:600}.custody{margin:0;padding-left:22px}.custody li{padding:4px 0}.custody strong{display:inline-block;min-width:130px}.hash{font:11px monospace;overflow-wrap:anywhere;padding:10px;background:#f4f4f5;border:1px solid #e4e4e7}.manifest-item{padding:7px 0;border-bottom:1px solid #e4e4e7}.manifest-item p{margin:4px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}.advisory{background:#eff6ff}.advisory p{margin:0}ul{margin:0;padding-left:22px}li{margin:3px 0}footer{margin-top:auto;padding-top:8px;border-top:1px solid #e4e4e7;color:#52525b;font-size:9px}.page-two{break-before:page;page-break-before:always}
        @page{size:A4;margin:0}@media print{body{background:white}.page{margin:0;width:210mm;min-height:297mm;box-shadow:none}.page-two{break-before:page;page-break-before:always}}
      </style></head><body>${markup}</body></html>`);
    popup.document.close();
    popup.document.fonts.ready.then(() => {
      popup.focus();
      popup.print();
    });
    return true;
  };

  const printLocalizedFailureReport = (source, language) => {
    const popup = window.open("", "_blank");
    if (!popup) {
      window.alert("Allow pop-ups to print or save this localized report as PDF.");
      return;
    }
    popup.opener = null;
    const t = (text) => REPORT_TEXT[language]?.[text] || text;
    const reportId = `ERR_${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
    const locale = language === "hi" ? "hi-IN" : "te-IN";
    const sourceLabel = source === "LIVE_CAMERA_SCAN" ? (language === "hi" ? "लाइव कैमरा स्कैन" : "లైవ్ కెమెరా స్కాన్") : source === "FORENSIC_IMAGE_INTAKE" ? (language === "hi" ? "फोरेंसिक छवि प्राप्ति" : "ఫోరెన్సిక్ చిత్రం స్వీకరణ") : escapeReportHtml(source || "INTERNAL_SCAN");
    const actions = ["Capture a sharper image under even lighting.", "Avoid glare, heavy cropping, rotation, and compression.", "Preserve the original media file before further handling.", "If physical evidence is damaged, document condition with photographs.", "Rescan the source after stabilizing the image or camera feed."];
    const fontUrl = language === "hi" ? devanagariFontUrl : teluguFontUrl;
    const title = t("FORENSIC ANALYSIS FAILURE REPORT");
    const sections = (heading, content) => `<section><h2>${escapeReportHtml(t(heading))}</h2>${content}</section>`;
    const html = `<article class="page"><header><div><div class="brand">P.H.A.N.I.X</div><h1>${escapeReportHtml(title)}</h1></div><span class="badge">${escapeReportHtml(t("QR CORRUPTED"))}</span></header>
      <p class="meta">${escapeReportHtml(t("Issued"))}: ${escapeReportHtml(new Date().toLocaleString(locale))}<span>${escapeReportHtml(t("Certificate"))}: ${reportId}</span></p>
      ${sections("INTAKE SUMMARY", `<div class="row"><span>${escapeReportHtml(t("Report ID"))}</span><strong>${reportId}</strong></div><div class="row"><span>${escapeReportHtml(t("Evidence source"))}</span><strong>${sourceLabel}</strong></div><div class="row"><span>${escapeReportHtml(t("Intake timestamp"))}</span><strong>${escapeReportHtml(new Date().toLocaleString(locale))}</strong></div>`)}
      ${sections("FAILURE STATUS", ["Pattern detection", "Data extraction", "Integrity check", "PHANIX seal validation"].map((label, i) => `<div class="row"><span>${escapeReportHtml(t(label))}</span><strong>${escapeReportHtml(t(i < 2 ? "FAIL" : "SKIP"))}</strong></div>`).join(""))}
      ${sections("CASE HANDLING NOTE", `<p>${escapeReportHtml(t("Attach this failure report to the incident file only as documentation of non-extractable QR evidence. It does not certify authenticity, origin, or payload integrity."))}</p>`)}
      <footer>${escapeReportHtml(t("Original case notes and identifiers remain unchanged."))}</footer></article>
      <article class="page page-two"><header><div><div class="brand">P.H.A.N.I.X</div><h1>${escapeReportHtml(title)}</h1></div><span class="page-label">${escapeReportHtml(t("Page"))} 2</span></header>
      ${sections("TECHNICAL OBSERVATION", `<p>${escapeReportHtml(t("The analysis pipeline attempted QR pattern discovery and data extraction. The evidence did not provide a readable payload suitable for SHA-256 comparison or PHANIX package reconstruction."))}</p>`)}
      ${sections("RECOMMENDED NEXT ACTIONS", `<ol>${actions.map((action) => `<li>${escapeReportHtml(t(action))}</li>`).join("")}</ol>`)}
      ${sections("EVIDENTIARY LIMITATION", `<p>${escapeReportHtml(t("This document is a failure certificate, not a verification certificate. It confirms that the QR could not be decoded by the application at intake time. Treat any later manual reconstruction as a separate examination event."))}</p>`)}
      ${sections("FORENSIC ADVISORY", `<p>${escapeReportHtml(t("Keep this two-page failure report with the original intake material and retry validation only from preserved source media."))}</p>`)}
      <footer>${escapeReportHtml(t("Original case notes and identifiers remain unchanged."))}</footer></article>`;
    popup.document.open();
    popup.document.write(`<!doctype html><html lang="${language}"><head><meta charset="utf-8"><title>${escapeReportHtml(title)}_${reportId}</title><style>
      @font-face{font-family:ReportIndic;src:url("${fontUrl}") format("truetype");font-weight:400;font-display:swap}*{box-sizing:border-box}body{margin:0;background:#e4e4e7;color:#18181b;font:12px ReportIndic,Arial,sans-serif;line-height:1.5}.page{width:210mm;min-height:297mm;margin:16px auto;padding:16mm;background:#fff;display:flex;flex-direction:column;gap:12px}header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #b91c1c;padding-bottom:12px}.brand{font-size:12px;font-weight:bold;letter-spacing:2px;color:#b91c1c}h1{font-size:20px;margin:4px 0 0}.badge,.page-label{padding:6px 10px;border-radius:5px;background:#fee2e2;color:#991b1b;font-size:11px;font-weight:bold}.meta{display:flex;justify-content:space-between;color:#52525b;font-size:10px;margin:0}section{border:1px solid #e4e4e7;border-radius:6px;padding:10px 12px;break-inside:avoid}h2{font-size:13px;margin:0 0 8px;color:#991b1b;border-bottom:1px solid #e4e4e7;padding-bottom:5px}p{margin:4px 0}.row{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #f1f1f3;padding:5px 0}.row:last-child{border:0}.row span{color:#52525b}.row strong{text-align:right}.page ol{margin:0;padding-left:24px}.page li{margin:6px 0}footer{margin-top:auto;padding-top:8px;border-top:1px solid #e4e4e7;color:#52525b;font-size:9px}.page-two{break-before:page;page-break-before:always}@page{size:A4;margin:0}@media print{body{background:white}.page{margin:0;width:210mm;min-height:297mm;box-shadow:none}.page-two{break-before:page;page-break-before:always}}</style></head><body>${html}</body></html>`);
    popup.document.close();
    popup.document.fonts.ready.then(() => {
      popup.focus();
      popup.print();
    });
  };

  const exportForensicReportPdf = (report) => {
    if (!report) return false;

    if (reportLanguage !== "en") {
      return printLocalizedReport(report, reportLanguage);
    }

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
    const sourceLocation = [data.village, data.district, data.state].filter(Boolean).join(", ") || "Not recorded";
    field("SOURCE & LOCATION", `Source: ${value(data.src)}\nReport language: ${value(({ en: "English", hi: "Hindi", te: "Telugu" })[data.reportLanguage] || data.reportLanguage)}\nVillage / District / State: ${sourceLocation}`, 20, y, 168, 3);

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
    return true;
  };

  const downloadForensicReport = () => {
    exportForensicReportPdf(analysisReport);
  };

  const downloadGeneratedForensicReport = () => {
    if (!manifest || !qrData) return;

    const finalEvidenceSource = locationDetails
      ? `${evidenceSource} [ ${locationDetails} ]`
      : evidenceSource;

    const exportStarted = exportForensicReportPdf({
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
        reportLanguage,
        village: village.trim(),
        district: district.trim(),
        state: regionState.trim(),
        src: finalEvidenceSource.trim(),
        sec: sections.map((section) => ({
          title: section.title.trim().toUpperCase() || "EVIDENCE ITEM",
          content: section.content.trim()
        }))
      }
    });
    if (exportStarted) setReportExportStarted(true);
  };

  const downloadCorruptionReport = (source) => {
    if (reportLanguage !== "en") {
      printLocalizedFailureReport(source, reportLanguage);
      return;
    }

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
          } catch {
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
  const performForensicAnalysis = (rawData, phanixData = null, verdict = null) => {
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

    // Simplified Verification Logic for PHANIX reports
    if (phanixData) {
      classification = "PHANIX Secure Package";
      hash = phanixData.hash; // Use the internal signature hash extracted from text
      
      if (verdict === "TAMPERED") {
        trustStatus = "TAMPERED PACKAGE";
        trustDescription = "The data does not match its SHA-256 hash or the hash stored in the evidence database. This record was modified.";
        riskLevel = "HIGH";
        indicators = ["SHA-256 mismatch detected", "Evidence data altered after sealing", "Do not trust this record"];
        checklist = [
          { label: "Structural Analysis", status: "PASS" },
          { label: "Internal Hash Check", status: "FAIL" },
          { label: "Authenticity Seal", status: "FAIL" }
        ];
      } else if (verdict === "UNREGISTERED") {
        trustStatus = "LOCAL CHECK ONLY";
        trustDescription = "The hash matches the data, but this Evidence ID is not in the database. A forged QR could look the same.";
        riskLevel = "MEDIUM";
        indicators = ["Evidence ID not found in database", "Older QR or forged QR", "Hash matches the printed data only"];
        checklist = [
          { label: "Structural Analysis", status: "PASS" },
          { label: "Internal Hash Check", status: "PASS" },
          { label: "Authenticity Seal", status: "FAIL" }
        ];
      } else {
        trustStatus = "TRUSTED SEAL";
        trustDescription = "Digitally signed and sealed by PHANIX Architect. Hash matches the database record.";
        riskLevel = "LOW";
        indicators = ["Evidence ID found in database", "SHA-256 recalculated and matched", "Chain of custody intact"];
        checklist = [
          { label: "Structural Analysis", status: "PASS" },
          { label: "Internal Hash Check", status: "PASS" },
          { label: "Authenticity Seal", status: "PASS" }
        ];
      }
    } else if (verdict === "NOT_REGISTERED") {
      classification = "Unregistered PHANIX ID";
      trustStatus = "AUTHENTICATION FAILED";
      trustDescription = "This Evidence ID does not exist in the PHANIX database. The QR is fake or the record was never saved.";
      riskLevel = "HIGH";
      indicators = ["Evidence ID not found in database", "Possible forged QR"];
      checklist = [
        { label: "Structural Analysis", status: "PASS" },
        { label: "Internal Hash Check", status: "SKIP" },
        { label: "Authenticity Seal", status: "FAIL" }
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

  const processScan = async (data = scanInput) => {
    const content = typeof data === 'string' ? data : scanInput;
    if (!content.trim()) return;

    // NEW QR FORMAT: "PHANIX:<uuid>" -> look up the record in the database
    if (content.trim().startsWith("PHANIX:")) {
      if (!authReady || (!approvedOfficer && !adminUser)) {
        setValidationError(signedInUser
          ? "This account is not approved to read evidence records."
          : "Sign in with an approved account to load and verify this package.");
        if (!signedInUser) setIsAdminLoginOpen(true);
        return;
      }
      const evidenceId = content.trim().slice(7).trim();
      try {
        const snap = await getDoc(doc(db, "evidence", evidenceId));
        if (!snap.exists()) {
          setScanResult({ type: 'failed', data: content });
          performForensicAnalysis(content, null, "NOT_REGISTERED");
          return;
        }
        const record = snap.data();
        // rebuild the exact data that was hashed (old records still have payloadString)
        let payload = null;
        let hashText = "";
        if (record.payloadString) {
          payload = JSON.parse(record.payloadString);
          hashText = record.payloadString;
        } else if (record.case) {
          payload = {
            op: record.officer.name,
            bid: record.officer.badge,
            role: record.officer.role,
            caseNo: record.case.no,
            exhibitNo: record.case.exhibit,
            division: record.case.division,
            receivedBy: record.officer.receivedBy,
            seal: record.case.seal,
            priority: record.case.priority,
            src: record.case.source,
            ...(Object.prototype.hasOwnProperty.call(record.case, "reportLanguage") ? { reportLanguage: record.case.reportLanguage } : {}),
            ...(Object.prototype.hasOwnProperty.call(record.case, "village") ? { village: record.case.village } : {}),
            ...(Object.prototype.hasOwnProperty.call(record.case, "district") ? { district: record.case.district } : {}),
            ...(Object.prototype.hasOwnProperty.call(record.case, "state") ? { state: record.case.state } : {}),
            uid: record.uuid,
            ts: record.ts,
            sec: record.evidence.map((e) => ({ title: e.title, content: e.content }))
          };
          hashText = JSON.stringify(payload);
        } else {
          payload = {
            op: record.operator,
            bid: record.badge,
            role: record.role,
            caseNo: record.caseNo,
            exhibitNo: record.exhibitNo,
            division: record.division,
            receivedBy: record.receivedBy,
            seal: record.seal,
            priority: record.priority,
            src: record.source,
            ...(Object.prototype.hasOwnProperty.call(record, "reportLanguage") ? { reportLanguage: record.reportLanguage } : {}),
            ...(Object.prototype.hasOwnProperty.call(record, "village") ? { village: record.village } : {}),
            ...(Object.prototype.hasOwnProperty.call(record, "district") ? { district: record.district } : {}),
            ...(Object.prototype.hasOwnProperty.call(record, "state") ? { state: record.state } : {}),
            uid: record.uuid,
            ts: record.ts,
            sec: record.evidence.map((e) => ({ title: e.title, content: e.content }))
          };
          hashText = JSON.stringify(payload);
        }
        const recalculated = CryptoJS.SHA256(hashText).toString();
        const dbData = { hash: record.hash, data: payload };
        if (recalculated !== record.hash) {
          setScanResult({ type: 'failed', data: content });
          performForensicAnalysis(content, dbData, "TAMPERED");
          return;
        }
        await addDoc(collection(db, "evidence", evidenceId, "history"), {
          action: "verified",
          result: "VERIFIED",
          by: auth.currentUser.email,
          time: serverTimestamp()
        }).catch(() => {});
        setScanResult({ type: 'valid', data: payload, hash: record.hash });
        performForensicAnalysis(content, dbData, null);
      } catch (e) {
        setValidationError("Database lookup failed: " + e.message);
      }
      return;
    }

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
      const extractedReportLanguageLabel = getValue('REPORT LANGUAGE');
      const extractedReportLanguage = ({ English: "en", Hindi: "hi", Telugu: "te" })[extractedReportLanguageLabel] || "";
      const emptyIfNotRecorded = (value) => value === "Not recorded" ? "" : value;
      const extractedVillage = emptyIfNotRecorded(getValue('VILLAGE'));
      const extractedDistrict = emptyIfNotRecorded(getValue('DISTRICT'));
      const extractedState = emptyIfNotRecorded(getValue('STATE'));

      let extractedHash = "";
      const hashIndex = lines.findIndex(l => l.includes("SHA-256 HASH:"));
      if (hashIndex !== -1 && lines[hashIndex + 1]) {
        extractedHash = lines[hashIndex + 1].trim();
      }

      const manifestStart = lines.findIndex(l => l.includes("[ EVIDENCE MANIFEST ]"));
      const sigStart = lines.findIndex(l => l.includes("[ CRYPTOGRAPHIC SIGNATURE ]"));
      
      let extractedSec = [];
      if (manifestStart !== -1 && sigStart !== -1) {
        // skip the "=====" separator line that sits right before the signature block
        const manifestEnd = lines[sigStart - 1] && lines[sigStart - 1].trim().startsWith("=====") ? sigStart - 1 : sigStart;
        const sectionLines = lines.slice(manifestStart + 1, manifestEnd);
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
            ...(extractedReportLanguage ? { reportLanguage: extractedReportLanguage } : {}),
            ...(extractedReportLanguage ? { village: extractedVillage, district: extractedDistrict, state: extractedState } : {}),
            sec: extractedSec
          }
        };
        
        // FIX 1: recalculate the hash from the printed data (same key order as generatePackage)
        const rebuilt = {
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
          ...(extractedReportLanguage ? { reportLanguage: extractedReportLanguage } : {}),
          ...(extractedReportLanguage ? { village: extractedVillage, district: extractedDistrict, state: extractedState } : {}),
          uid: extractedId,
          ts: extractedTimestamp,
          sec: extractedSec
        };
        const recalculated = CryptoJS.SHA256(JSON.stringify(rebuilt)).toString();
        let verdict = null;
        if (recalculated !== extractedHash) verdict = "TAMPERED";

        // FIX 2: compare with the hash stored in the database
        try {
          const snap = await getDoc(doc(db, "evidence", extractedId));
          if (snap.exists()) {
            if (snap.data().hash !== extractedHash) verdict = "TAMPERED";
          } else if (verdict === null) {
            verdict = "UNREGISTERED";
          }
        } catch {
          if (verdict === null) verdict = "UNREGISTERED";
        }

        if (verdict === null) {
          setScanResult({ type: 'valid', data: phanixData.data, hash: extractedHash });
        } else {
          setScanResult({ type: 'failed', data: content });
        }
        performForensicAnalysis(content, phanixData, verdict);
        return;
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

  const aboutLinkStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 13px",
    marginTop: 8,
    borderRadius: 10,
    border: "1px solid #3f3f46",
    background: "rgba(9,9,11,0.65)",
    color: "#f4f4f5",
    textDecoration: "none",
    transition: "border-color 0.2s ease, background 0.2s ease, transform 0.2s ease",
  };
  const aboutLinkEyebrowStyle = { display: "block", marginBottom: 4, color: "#60a5fa", fontSize: 9, fontWeight: 700, letterSpacing: "1.2px" };
  const aboutLinkTitleStyle = { display: "block", fontSize: 13, fontWeight: 600 };
  const aboutArrowStyle = { color: "#60a5fa", fontSize: 18, fontWeight: 700 };

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
    minWidth: 0,
    boxSizing: "border-box",
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

  if (!authReady) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#18181b", color: "#e4e4e7", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>PHANIX</div>
          <p style={{ color: "#a1a1aa", fontSize: 13 }}>Checking your sign-in…</p>
        </div>
      </main>
    );
  }

  if (!approvedOfficer && !adminUser) {
    const handleSignIn = async (event) => {
      event.preventDefault();
      setAdminError("");
      try {
        const credential = await signInWithEmailAndPassword(auth, adminEmail.trim(), adminPass);
        setAdminPass("");
        if (credential.user.email?.toLowerCase() === "nittalaphaneendhar@gmail.com") setTab("admin");
      } catch {
        setAdminError("Sign-in failed. Check your email and password.");
      }
    };

    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, boxSizing: "border-box", background: "#18181b", color: "#f4f4f5", fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <section style={{ width: "100%", maxWidth: 420, padding: 32, boxSizing: "border-box", borderRadius: 16, background: "#202024", border: "1px solid #3f3f46", boxShadow: "0 16px 48px rgba(0,0,0,0.25)" }}>
          <div style={{ width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 12, color: "#93c5fd", background: "rgba(59,130,246,0.14)", border: "1px solid rgba(59,130,246,0.28)", fontWeight: 800, fontSize: 17 }}>P</div>
          <h1 style={{ margin: "18px 0 6px", fontSize: 24 }}>Sign in</h1>
          <p style={{ margin: "0 0 22px", color: "#a1a1aa", fontSize: 13, lineHeight: 1.6 }}>Use the account provided by the site owner to continue.</p>
          {signedInUser ? (
            <div>
              <div role="alert" style={{ marginBottom: 16, padding: 12, borderRadius: 8, color: "#fca5a5", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 13 }}>{adminError || "This account is not approved to access the site."}</div>
              <button type="button" onClick={() => signOut(auth)} style={{ width: "100%", padding: 12, border: 0, borderRadius: 8, background: "#3b82f6", color: "white", fontWeight: 700, cursor: "pointer" }}>Sign out and use another account</button>
            </div>
          ) : (
            <form onSubmit={handleSignIn}>
              <label htmlFor="account-email" style={{ display: "block", marginBottom: 7, color: "#d4d4d8", fontSize: 12, fontWeight: 600 }}>Email</label>
              <input id="account-email" type="email" autoComplete="username" required value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} placeholder="name@example.com" style={{ width: "100%", boxSizing: "border-box", marginBottom: 16, padding: "12px 14px", borderRadius: 8, border: "1px solid #52525b", background: "#09090b", color: "#f4f4f5", fontSize: 14 }} />
              <label htmlFor="account-password" style={{ display: "block", marginBottom: 7, color: "#d4d4d8", fontSize: 12, fontWeight: 600 }}>Password</label>
              <div style={{ position: "relative", marginBottom: 16 }}>
                <input id="account-password" type={showSignInPassword ? "text" : "password"} autoComplete="current-password" required value={adminPass} onChange={(event) => setAdminPass(event.target.value)} placeholder="Enter your password" style={{ width: "100%", boxSizing: "border-box", padding: "12px 48px 12px 14px", borderRadius: 8, border: "1px solid #52525b", background: "#09090b", color: "#f4f4f5", fontSize: 14 }} />
                <button type="button" aria-label={showSignInPassword ? "Hide password" : "Show password"} aria-pressed={showSignInPassword} onClick={() => setShowSignInPassword((visible) => !visible)} style={{ position: "absolute", top: 0, right: 4, height: 44, width: 40, display: "grid", placeItems: "center", border: 0, borderRadius: 6, background: "transparent", color: "#a1a1aa", cursor: "pointer" }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {showSignInPassword ? <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path d="m3 3 18 18"/></> : <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>}
                  </svg>
                </button>
              </div>
              {adminError && <div role="alert" style={{ marginBottom: 14, padding: 10, borderRadius: 8, color: "#fca5a5", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12 }}>{adminError}</div>}
              <button type="submit" style={{ width: "100%", padding: 12, border: 0, borderRadius: 8, background: "#3b82f6", color: "white", fontWeight: 700, cursor: "pointer" }}>Sign in</button>
            </form>
          )}
          <div style={{ marginTop: 18, textAlign: "center", color: "#71717a", fontSize: 11 }}>Access is provided by the site owner.</div>
        </section>
      </main>
    );
  }

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
          zIndex: 130,
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
            }}>
              FORENSIC-QR-ARCHITECT
            </span>
          </div>
          
          <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderLeft: '1px solid #3f3f46',
              paddingLeft: '20px',
              height: '42px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
            <div ref={developerMenuRef} style={{ position: "relative", zIndex: 150 }}>
              <button
                type="button"
                aria-label="Developer information"
                aria-expanded={isDeveloperInfoOpen}
                title="Developer information"
                onClick={() => setIsDeveloperInfoOpen((open) => !open)}
                style={{ width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: 9, background: isDeveloperInfoOpen ? "#3f3f46" : '#27272a', border: '1px solid #3f3f46', color: '#93c5fd', cursor: 'pointer' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />
                </svg>
              </button>
              {isDeveloperInfoOpen && (
                <div role="dialog" aria-label="Developer profile" style={{ position: "absolute", top: 46, right: 0, width: 300, padding: 18, borderRadius: 14, background: "#202024", border: "1px solid #3f3f46", boxShadow: "0 18px 50px rgba(0,0,0,0.45)", color: "#f4f4f5" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <img src={developerPhoto} alt="Phaneendhar Nittala" style={{ width: 64, height: 64, flexShrink: 0, borderRadius: "50%", objectFit: "cover", objectPosition: "center 32%", border: "2px solid #52525b" }} />
                    <div>
                      <div style={{ color: "#a1a1aa", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 }}>Developer</div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>Phaneendhar.Nittala</div>
                    </div>
                  </div>
                  <div style={{ height: 1, background: "#3f3f46", margin: "15px 0 12px" }} />
                  <div style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 1.6 }}>Advanced tools for helping forensic integrity.</div>
                </div>
              )}
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
                  onClick={openAboutMenu}
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

              {/* ABOUT PHANIX */}
              <div ref={aboutMenuRef} style={{ position: "relative", zIndex: 110, paddingBottom: 20 }}>
                <button
                  ref={aboutIconRef}
                  type="button"
                  aria-label="About PHANIX and related projects"
                  aria-expanded={isAboutOpen}
                  onClick={() => setIsAboutOpen((open) => !open)}
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
                  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  transform: 'scale(1)',
                }}
                  onMouseEnter={(e) => {
                  e.currentTarget.style.background = accent;
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#3f3f46";
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                  title="About PHANIX"
                >
                {/* UPGRADED PHANIX BRAND SIGNATURE */}
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 21V3H14C16.2091 3 18 4.79086 18 7C18 9.20914 16.2091 11 14 11H7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 3C15 3 19 3 20 6C21 9 18 11 18 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="1.5" fill={accent} />
                  <path d="M3 3L5 5" stroke={accent} strokeWidth="2" strokeLinecap="round" />
                </svg>
                </button>
                {isAboutOpen && (
                  <div style={{ position: "absolute", top: 54, right: 0, width: 310, padding: 18, borderRadius: 14, background: "linear-gradient(145deg, #27272a, #18181b)", border: "1px solid #3f3f46", boxShadow: "0 18px 50px rgba(0,0,0,0.45)", zIndex: 2000 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 11, display: "grid", placeItems: "center", color: "#93c5fd", background: "rgba(59,130,246,0.14)", border: "1px solid rgba(59,130,246,0.3)", fontSize: 19, fontWeight: 800 }}>P</div>
                      <div>
                        <div style={{ color: "#f4f4f5", fontSize: 14, fontWeight: 700 }}>Phaneendhar.Nittala</div>
                        <div style={{ color: "#a1a1aa", fontSize: 12, marginTop: 3 }}>Advanced tools for helping forensic integrity.</div>
                      </div>
                    </div>
                    <div style={{ height: 1, background: "#3f3f46", marginBottom: 12 }} />
                    <a href="https://p-h-a-n-i-x-phaneendhar-s-investigation-expert.vercel.app/" target="_blank" rel="noopener noreferrer" style={aboutLinkStyle} onClick={() => setIsAboutOpen(false)}>
                      <span><span style={aboutLinkEyebrowStyle}>01 · LAB</span><strong style={aboutLinkTitleStyle}>My PHANIX Lab</strong></span><span style={aboutArrowStyle}>↗</span>
                    </a>
                    <a href="https://p-h-a-n-i-x-investigation-e-xpert.vercel.app/" target="_blank" rel="noopener noreferrer" style={aboutLinkStyle} onClick={() => setIsAboutOpen(false)}>
                      <span><span style={aboutLinkEyebrowStyle}>02 · SUITE</span><strong style={aboutLinkTitleStyle}>Forenisc Expert Suite</strong></span><span style={aboutArrowStyle}>↗</span>
                    </a>
                  </div>
                )}
              </div>

              {/* SIGNED-IN ACCOUNT MENU */}
              <div ref={accountMenuRef} style={{ position: "relative", zIndex: 120, paddingBottom: 20 }}>
                <button
                  type="button"
                  aria-label="Signed-in account information"
                  aria-expanded={isAccountMenuOpen}
                  onClick={() => setIsAccountMenuOpen((open) => !open)}
                  title="Account information"
                  style={{ width: 44, height: 44, borderRadius: "50%", background: isAccountMenuOpen ? accent : "#3f3f46", border: "1px solid #52525b", color: "#f4f4f5", cursor: "pointer", display: "grid", placeItems: "center", transition: "background 0.2s" }}
                >
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21a8 8 0 0 1 16 0" />
                  </svg>
                </button>
                {isAccountMenuOpen && (
                  <div role="dialog" aria-label="Account information" style={{ position: "absolute", top: 52, right: 0, width: 286, padding: 16, borderRadius: 12, background: "#202024", border: "1px solid #3f3f46", boxShadow: "0 12px 32px rgba(0,0,0,0.35)" }}>
                    <div style={{ color: "#a1a1aa", fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>Signed-in account</div>
                    <div style={{ color: "#f4f4f5", fontSize: 14, fontWeight: 600, overflowWrap: "anywhere" }}>{signedInUser?.displayName || signedInUser?.email}</div>
                    <div style={{ marginTop: 6, color: "#a1a1aa", fontSize: 12 }}>{signedInUser?.email}</div>
                    <div style={{ display: "inline-flex", marginTop: 12, padding: "4px 8px", borderRadius: 6, background: "rgba(59,130,246,0.12)", color: "#93c5fd", fontSize: 11, fontWeight: 600 }}>{adminUser ? "Administrator" : "Approved user"}</div>
                    <button type="button" onClick={() => {
                      setIsAccountMenuOpen(false);
                      requestNavigation(() => signOut(auth));
                    }} style={{ width: "100%", marginTop: 16, padding: "9px 12px", borderRadius: 7, border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.08)", color: "#fca5a5", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Log out</button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", margin: "-12px 0 24px", padding: "12px 16px", background: "#202024", border: "1px solid #3f3f46", borderRadius: 8 }}>
          <div>
            <label htmlFor="report-language" style={{ display: "block", color: "#f4f4f5", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>REPORT LANGUAGE</label>
            <span style={{ color: "#a1a1aa", fontSize: 11 }}>{reportLanguage === "en" ? "Case notes, names, IDs, and hashes stay in their original form." : "A print window opens; choose Save to PDF. Original case notes and identifiers stay unchanged."}</span>
          </div>
          <select id="report-language" value={reportLanguage} onChange={(e) => setReportLanguage(e.target.value)} style={{ minWidth: 170, padding: "9px 12px", borderRadius: 6, border: "1px solid #52525b", background: "#18181b", color: "#f4f4f5", fontSize: 13, boxSizing: "border-box" }}>
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="te">తెలుగు (Telugu)</option>
          </select>
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
              onClick={() => {
                requestNavigation(() => {
                  setTab(t);
                  if (t === "scanner") {
                    setValidationError("");
                    setCameraError("");
                  } else {
                    setIsCameraActive(false);
                  }
                });
              }}
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                    <label style={fslLabelStyle}>CASE / CRIME NUMBER</label>
                    <input
                      placeholder="e.g. FIR-2026-0142"
                      value={caseNumber}
                      onChange={(e) => setCaseNumber(e.target.value)}
                      style={fslFieldStyle}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                    <label style={fslLabelStyle}>EXHIBIT / ARTICLE NUMBER</label>
                    <input
                      placeholder="e.g. EX-01 / A1"
                      value={exhibitNumber}
                      onChange={(e) => setExhibitNumber(e.target.value)}
                      style={fslFieldStyle}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                    <label style={fslLabelStyle}>RECEIVING / CUSTODY OFFICER</label>
                    <input
                      placeholder="Defaults to operator if blank"
                      value={receivingOfficer}
                      onChange={(e) => setReceivingOfficer(e.target.value)}
                      style={fslFieldStyle}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
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
              <div style={{ ...materialCardStyle, padding: 18, borderRadius: 8, background: "#202024", boxShadow: "none" }}>
                <div style={{ color: accent, fontSize: 11, fontWeight: 800, letterSpacing: 1, marginBottom: 14 }}>SOURCE LOCATION</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 14 }}>
                  {[
                    { label: "VILLAGE", value: village, setValue: setVillage, placeholder: "Enter village" },
                    { label: "DISTRICT", value: district, setValue: setDistrict, placeholder: "Enter district" },
                    { label: "STATE", value: regionState, setValue: setRegionState, placeholder: "Enter state" },
                  ].map((field) => (
                    <div key={field.label} style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                      <label style={fslLabelStyle}>{field.label}</label>
                      <input value={field.value} onChange={(e) => field.setValue(e.target.value)} placeholder={field.placeholder} style={fslFieldStyle} />
                    </div>
                  ))}
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
                onClick={() => requestNavigation(clearForm)}
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
                  <div ref={qrRef}>
                    <QRCodeCanvas 
                      value={manifest ? "PHANIX:" + manifest.id : qrData} 
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
                    {reportLanguage === "en" ? "Download Report PDF" : "Print / Save PDF"}
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
                  }}>
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
                          transition: 'all 0.3s ease',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
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

              {cameraError && (
                <div role="alert" style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", color: "#fcd34d", fontSize: 13 }}>
                  Camera unavailable: {cameraError}
                </div>
              )}

              {isCameraActive && tab === "scanner" && (
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
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}>
                        <div style={{
                          color: 'white',
                          fontSize: '13px',
                          fontWeight: 700,
                          letterSpacing: '1.5px',
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
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
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
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'all 0.3s',
                            letterSpacing: '0.5px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
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
                    onClick={() => {
                      setValidationError("");
                      setCameraError("");
                      setIsCameraActive(true);
                    }}
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
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.25) 100%)`;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%)`;
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
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.25) 100%)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)';
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
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
                     boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                     position: 'relative',
                     overflow: 'hidden'
                   }}>
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
                      }}>
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
                            }} />
                          )}
                          <div>
                            <div style={{ 
                              fontWeight: 900, 
                              color: analysisReport.trustStatus === 'TRUSTED SEAL' ? '#6ee7b7' : (analysisReport.trustStatus === 'TAMPERED PACKAGE' || analysisReport.riskLevel === 'HIGH' ? '#f87171' : (analysisReport.riskLevel === 'MEDIUM' ? '#fbbf24' : '#f4f4f5')),
                              fontSize: analysisReport.trustStatus === 'TRUSTED SEAL' ? 26 : 22,
                              letterSpacing: '1px',
                              textTransform: 'uppercase',
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
                          filter: 'none'
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
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
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
                            ["REPORT LANGUAGE", ({ en: "English", hi: "Hindi", te: "Telugu" })[scanResult.data.reportLanguage] || "Not recorded"],
                            ["VILLAGE", scanResult.data.village || "Not recorded"],
                            ["DISTRICT", scanResult.data.district || "Not recorded"],
                            ["STATE", scanResult.data.state || "Not recorded"],
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
	                              whiteSpace: "nowrap",
	                            }}
	                          >
	                            {reportLanguage === "en" ? "Download Report PDF" : "Print / Save PDF"}
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
                                whiteSpace: "nowrap",
                              }}
                            >
                              {reportLanguage === "en" ? "Download Failed Report" : "Print / Save Failure Report"}
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

        {/* ADMIN DASHBOARD - login required, only the admin email can read the list */}
        {tab === "admin" && (() => {
          // Normalization helper supporting new nested structure and older flat fields
          const normalizeItem = (item) => {
            if (!item) return {};
            const caseNo = (item.case && item.case.no) || item.caseNo || "";
            const exhibit = (item.case && item.case.exhibit) || item.exhibitNo || "";
            const division = (item.case && item.case.division) || item.division || item.labDivision || "Digital Forensics";
            const priority = (item.case && item.case.priority) || item.priority || item.priorityLevel || "Routine";
            const seal = (item.case && item.case.seal) || item.seal || item.sealCondition || "Intact";
            const source = (item.case && item.case.source) || item.source || item.evidenceSource || "";
            const reportLanguage = (item.case && item.case.reportLanguage) || item.reportLanguage || "";
            const village = (item.case && item.case.village) || item.village || "";
            const district = (item.case && item.case.district) || item.district || "";
            const state = (item.case && item.case.state) || item.state || "";

            const officerName = (item.officer && item.officer.name) || item.operator || item.officerName || "";
            const badge = (item.officer && item.officer.badge) || item.badge || "";
            const role = (item.officer && item.officer.role) || item.role || "";
            const receivedBy = (item.officer && item.officer.receivedBy) || item.receivedBy || "";

            let dateObj = null;
            if (item.createdAt) {
              if (typeof item.createdAt.toDate === "function") {
                dateObj = item.createdAt.toDate();
              } else if (item.createdAt instanceof Date) {
                dateObj = item.createdAt;
              } else if (typeof item.createdAt === "number" || typeof item.createdAt === "string") {
                dateObj = new Date(item.createdAt);
              }
            }
            if (!dateObj && item.ts) {
              dateObj = new Date(item.ts);
            }

            const evidenceList = Array.isArray(item.evidence)
              ? item.evidence
              : Array.isArray(item.sections)
              ? item.sections
              : [];

            const evidenceText = evidenceList.map((e) => `${e.title || ""} ${e.content || ""}`).join(" ");
            const status = item.status || "SEALED";
            const hash = item.hash || "";
            const id = item.id || item.uuid || "";

            return {
              raw: item,
              id,
              caseNo,
              exhibit,
              division,
              priority,
              seal,
              source,
              reportLanguage,
              village,
              district,
              state,
              officerName,
              badge,
              role,
              receivedBy,
              dateObj,
              dateStr: dateObj ? dateObj.toLocaleString() : "Date N/A",
              isoDate: dateObj ? dateObj.toISOString().slice(0, 10) : "",
              evidenceList,
              evidenceText,
              status,
              hash
            };
          };

          const allNormalized = adminList.map(normalizeItem);

          // Metrics calculation
          const today = new Date();
          const isToday = (d) =>
            d &&
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate();

          const totalRecords = allNormalized.length;
          const recordsToday = allNormalized.filter((r) => isToday(r.dateObj)).length;
          const totalCases = new Set(allNormalized.map((r) => r.caseNo.trim()).filter(Boolean)).size;
          const totalOfficers = new Set(allNormalized.map((r) => r.officerName.trim()).filter(Boolean)).size;

          // Client-side filtering
          const filtered = allNormalized.filter((rec) => {
            // Main search matches case number, exhibit number, officer name, badge, evidence text, source, evidence ID
            if (caseSearch.trim()) {
              const q = caseSearch.trim().toLowerCase();
              const corpus = [
                rec.caseNo,
                rec.exhibit,
                rec.officerName,
                rec.badge,
                rec.evidenceText,
                rec.source,
                rec.reportLanguage,
                rec.village,
                rec.district,
                rec.state,
                rec.id
              ].join(" ").toLowerCase();
              if (!corpus.includes(q)) return false;
            }

            // Dropdown filters
            if (adminStatusFilter !== "ALL") {
              if (rec.status.toUpperCase() !== adminStatusFilter.toUpperCase()) return false;
            }
            if (adminPriorityFilter !== "ALL") {
              if (rec.priority.toLowerCase() !== adminPriorityFilter.toLowerCase()) return false;
            }
            if (adminDivisionFilter !== "ALL") {
              if (rec.division.toLowerCase() !== adminDivisionFilter.toLowerCase()) return false;
            }
            if (adminSealFilter !== "ALL") {
              if (rec.seal.toLowerCase() !== adminSealFilter.toLowerCase()) return false;
            }

            // Date Range filters
            if (adminDateFrom) {
              const fromTime = new Date(adminDateFrom + "T00:00:00").getTime();
              if (!rec.dateObj || rec.dateObj.getTime() < fromTime) return false;
            }
            if (adminDateTo) {
              const toTime = new Date(adminDateTo + "T23:59:59.999").getTime();
              if (!rec.dateObj || rec.dateObj.getTime() > toTime) return false;
            }

            return true;
          });

          // Sort records
          filtered.sort((a, b) => {
            if (adminSortBy === "newest") {
              const ta = a.dateObj ? a.dateObj.getTime() : 0;
              const tb = b.dateObj ? b.dateObj.getTime() : 0;
              return tb - ta;
            }
            if (adminSortBy === "oldest") {
              const ta = a.dateObj ? a.dateObj.getTime() : 0;
              const tb = b.dateObj ? b.dateObj.getTime() : 0;
              return ta - tb;
            }
            if (adminSortBy === "caseNo") {
              return a.caseNo.localeCompare(b.caseNo, undefined, { numeric: true, sensitivity: "base" });
            }
            return 0;
          });

          // Pagination
          const pageSize = 20;
          const totalPages = Math.ceil(filtered.length / pageSize) || 1;
          const safePage = Math.min(Math.max(adminPage, 1), totalPages);
          const startIndex = (safePage - 1) * pageSize;
          const pageRecords = filtered.slice(startIndex, startIndex + pageSize);

          // Status & Priority Badges
          const getStatusBadge = (statusStr) => {
            const s = (statusStr || "").toUpperCase();
            if (s === "SEALED") return { bg: "rgba(16,185,129,0.15)", text: "#34d399", border: "rgba(16,185,129,0.3)" };
            if (s === "VERIFIED") return { bg: "rgba(59,130,246,0.15)", text: "#60a5fa", border: "rgba(59,130,246,0.3)" };
            if (s === "TAMPERED" || s === "FLAGGED" || s === "INVALID") return { bg: "rgba(239,68,68,0.15)", text: "#f87171", border: "rgba(239,68,68,0.3)" };
            return { bg: "rgba(161,161,170,0.15)", text: "#d4d4d8", border: "rgba(161,161,170,0.3)" };
          };

          const getPriorityBadge = (prioStr) => {
            const p = (prioStr || "").toLowerCase();
            if (p.includes("court")) return { bg: "rgba(239,68,68,0.15)", text: "#f87171", border: "rgba(239,68,68,0.35)" };
            if (p.includes("urgent")) return { bg: "rgba(245,158,11,0.15)", text: "#fbbf24", border: "rgba(245,158,11,0.35)" };
            if (p.includes("re-exam")) return { bg: "rgba(168,85,247,0.15)", text: "#c084fc", border: "rgba(168,85,247,0.35)" };
            if (p.includes("supplementary")) return { bg: "rgba(6,182,212,0.15)", text: "#22d3ee", border: "rgba(6,182,212,0.35)" };
            return { bg: "rgba(59,130,246,0.15)", text: "#60a5fa", border: "rgba(59,130,246,0.35)" };
          };

          // Export results as CSV (browser-only, no libraries)
          const handleExportCSV = () => {
            if (filtered.length === 0) return;
            const headers = [
              "Evidence ID",
              "Case Number",
              "Exhibit Number",
              "Division",
              "Priority",
              "Seal Condition",
              "Source",
              "Report Language",
              "Village",
              "District",
              "State",
              "Officer Name",
              "Badge",
              "Role",
              "Received By",
              "Date Logged",
              "Status",
              "SHA256 Hash",
              "Evidence Items"
            ];
            const escapeVal = (v) => {
              if (v === null || v === undefined) return '""';
              return `"${String(v).replace(/"/g, '""')}"`;
            };
            const rows = filtered.map((r) => [
              escapeVal(r.id),
              escapeVal(r.caseNo),
              escapeVal(r.exhibit),
              escapeVal(r.division),
              escapeVal(r.priority),
              escapeVal(r.seal),
              escapeVal(r.source),
              escapeVal(({ en: "English", hi: "Hindi", te: "Telugu" })[r.reportLanguage] || r.reportLanguage),
              escapeVal(r.village),
              escapeVal(r.district),
              escapeVal(r.state),
              escapeVal(r.officerName),
              escapeVal(r.badge),
              escapeVal(r.role),
              escapeVal(r.receivedBy),
              escapeVal(r.dateStr),
              escapeVal(r.status),
              escapeVal(r.hash),
              escapeVal(r.evidenceText)
            ]);
            const csvData = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
            const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Forensic_Cases_Export_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          };

          // Download record as JSON (browser-only, no libraries)
          const handleDownloadRecordJSON = (rec) => {
            if (!rec) return;
            const jsonObj = {
              uuid: rec.id,
              status: rec.status,
              hash: rec.hash,
              createdAt: rec.dateObj ? rec.dateObj.toISOString() : null,
              case: {
                no: rec.caseNo,
                exhibit: rec.exhibit,
                division: rec.division,
                priority: rec.priority,
                seal: rec.seal,
                source: rec.source,
                reportLanguage: rec.reportLanguage,
                village: rec.village,
                district: rec.district,
                state: rec.state
              },
              officer: {
                name: rec.officerName,
                badge: rec.badge,
                role: rec.role,
                receivedBy: rec.receivedBy
              },
              evidence: rec.evidenceList,
              auditHistory: adminHistory.map((h) => ({
                action: h.action,
                by: h.by || null,
                result: h.result || null,
                time: h.time && h.time.toDate ? h.time.toDate().toISOString() : h.time || null
              }))
            };
            const blob = new Blob([JSON.stringify(jsonObj, null, 2)], { type: "application/json;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Evidence_Record_${rec.caseNo || "Case"}_${rec.exhibit || "Exhibit"}_${rec.id.slice(0, 8)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          };

          // Copy text with feedback
          const handleCopy = (text, key) => {
            if (!text) return;
            navigator.clipboard.writeText(text).then(() => {
              setAdminCopyFeedback(key);
              setTimeout(() => {
                setAdminCopyFeedback((prev) => (prev === key ? "" : prev));
              }, 2000);
            }).catch(() => {});
          };

          const hasActiveFilters = Boolean(
            caseSearch.trim() ||
            adminStatusFilter !== "ALL" ||
            adminPriorityFilter !== "ALL" ||
            adminDivisionFilter !== "ALL" ||
            adminSealFilter !== "ALL" ||
            adminDateFrom ||
            adminDateTo
          );

          const clearAllFilters = () => {
            setCaseSearch("");
            setAdminStatusFilter("ALL");
            setAdminPriorityFilter("ALL");
            setAdminDivisionFilter("ALL");
            setAdminSealFilter("ALL");
            setAdminDateFrom("");
            setAdminDateTo("");
            setAdminSortBy("newest");
            setAdminPage(1);
          };

          const pickedNormalized = adminPicked ? normalizeItem(adminPicked) : null;

          return (
            <div style={{ marginTop: 20, maxWidth: 1040, marginLeft: "auto", marginRight: "auto", padding: "0 12px", boxSizing: "border-box" }}>
              {/* ADMIN LOGIN */}
              {!adminUser && (
                <div style={{ maxWidth: 400, margin: "40px auto", padding: 32, borderRadius: 16, background: "#18181b", border: "1px solid #27272a", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontSize: 18 }}>
                      🛡️
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 19, color: "#f4f4f5", fontWeight: 700 }}>Admin Login</h3>
                      <div style={{ fontSize: 12, color: "#a1a1aa" }}>Forensic Evidence Case Dashboard</div>
                    </div>
                  </div>
                  <p style={{ margin: "12px 0 20px", fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>
                    Access to the evidence ledger is restricted. Sign in with administrative credentials to inspect case records.
                  </p>
                  <input
                    type="email"
                    placeholder="Administrator email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    style={{ width: "100%", padding: "11px 14px", marginBottom: 12, borderRadius: 8, border: "1px solid #3f3f46", background: "#09090b", color: "#f4f4f5", fontSize: 14, boxSizing: "border-box", outline: "none" }}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    style={{ width: "100%", padding: "11px 14px", marginBottom: 16, borderRadius: 8, border: "1px solid #3f3f46", background: "#09090b", color: "#f4f4f5", fontSize: 14, boxSizing: "border-box", outline: "none" }}
                  />
                  {adminError && <div style={{ color: "#fca5a5", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>{adminError}</div>}
                  <button
                    onClick={async () => {
                      setAdminError("");
                      try {
                        const credential = await signInWithEmailAndPassword(auth, adminEmail.trim(), adminPass);
                        if (credential.user.email?.toLowerCase() !== "nittalaphaneendhar@gmail.com") {
                          await signOut(auth);
                          setAdminError("This account is not the administrator account.");
                          return;
                        }
                        setAdminPass("");
                      } catch {
                        setAdminError("Login failed. Check email and password.");
                      }
                    }}
                    style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: accent, color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                  >
                    Authenticate & Access
                  </button>
                </div>
              )}

              {/* ADMIN LOGGED IN */}
              {adminUser && (
                <div>
                  {/* TOP HEADER BAR */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #27272a" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 22 }}>📁</span>
                        <h2 style={{ margin: 0, fontSize: 22, color: "#f4f4f5", fontWeight: 700, letterSpacing: "-0.5px" }}>Case Dashboard</h2>
                        <span style={{ fontSize: 11, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>
                          SECURE VAULT
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>
                        Logged in as <span style={{ color: "#f4f4f5", fontWeight: 500 }}>{adminUser.email}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={() => loadAdminList()}
                        disabled={adminLoading}
                        title="Reload up to 500 records from database"
                        style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #3f3f46", background: "#18181b", color: "#f4f4f5", fontSize: 13, cursor: adminLoading ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <span style={{ display: "inline-block", transform: adminLoading ? "rotate(180deg)" : "none", transition: "transform 0.5s" }}>🔄</span>
                        {adminLoading ? "Syncing..." : "Reload"}
                      </button>
                      <button
                        onClick={async () => {
                          await signOut(auth);
                          setAdminList([]);
                          setAdminPicked(null);
                        }}
                        style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 13, cursor: "pointer", fontWeight: 500 }}
                      >
                        Logout
                      </button>
                    </div>
                  </div>

                  {/* SUMMARY CARDS ROW (D) */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
                    <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ fontSize: 11, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Total Records</span>
                        <span style={{ color: "#3b82f6" }}>📦</span>
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 700, color: "#f4f4f5", marginTop: 6 }}>{totalRecords}</div>
                      <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>Loaded evidence items</div>
                    </div>
                    <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ fontSize: 11, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Records Today</span>
                        <span style={{ color: "#10b981" }}>📅</span>
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 700, color: "#34d399", marginTop: 6 }}>{recordsToday}</div>
                      <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>Intakes logged today</div>
                    </div>
                    <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ fontSize: 11, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Unique Cases</span>
                        <span style={{ color: "#f59e0b" }}>📑</span>
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 700, color: "#f4f4f5", marginTop: 6 }}>{totalCases}</div>
                      <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>Distinct case files</div>
                    </div>
                    <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ fontSize: 11, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Officers</span>
                        <span style={{ color: "#a855f7" }}>👮</span>
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 700, color: "#f4f4f5", marginTop: 6 }}>{totalOfficers}</div>
                      <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>Logged investigators</div>
                    </div>
                  </div>

                  {adminError && (
                    <div style={{ color: "#fca5a5", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", fontSize: 13, marginBottom: 16 }}>
                      ⚠️ {adminError}
                    </div>
                  )}

                  {/* ===================== LIST VIEW ===================== */}
                  {!adminPicked && (
                    <div>
                      {/* SEARCH AND FILTERS CARD (B) */}
                      <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "18px 20px", marginBottom: 18 }}>
                        {/* MAIN SEARCH INPUT */}
                        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                          <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
                            <span style={{ position: "absolute", left: 14, top: 11, color: "#71717a", fontSize: 15 }}>🔍</span>
                            <input
                              type="text"
                              placeholder="Search by case #, exhibit, officer, badge, evidence text, source, or ID..."
                              value={caseSearch}
                              onChange={(e) => {
                                setCaseSearch(e.target.value);
                                setAdminPage(1);
                              }}
                              style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: 8, border: "1px solid #3f3f46", background: "#09090b", color: "#f4f4f5", fontSize: 14, boxSizing: "border-box", outline: "none" }}
                            />
                            {caseSearch && (
                              <button
                                onClick={() => { setCaseSearch(""); setAdminPage(1); }}
                                style={{ position: "absolute", right: 10, top: 9, background: "none", border: "none", color: "#a1a1aa", cursor: "pointer", fontSize: 14, padding: 4 }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          <button
                            onClick={handleExportCSV}
                            title="Export filtered records as CSV (Zero libraries)"
                            style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid rgba(59,130,246,0.4)", background: "rgba(59,130,246,0.12)", color: "#60a5fa", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
                          >
                            <span>📥</span> Export CSV ({filtered.length})
                          </button>
                        </div>

                        {/* FILTER DROPDOWNS ROW */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 12 }}>
                          {/* STATUS */}
                          <div>
                            <label style={{ display: "block", fontSize: 11, color: "#a1a1aa", marginBottom: 4, fontWeight: 500 }}>Status</label>
                            <select
                              value={adminStatusFilter}
                              onChange={(e) => { setAdminStatusFilter(e.target.value); setAdminPage(1); }}
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #3f3f46", background: "#09090b", color: "#f4f4f5", fontSize: 12, outline: "none" }}
                            >
                              <option value="ALL">All Statuses</option>
                              <option value="SEALED">SEALED</option>
                              <option value="VERIFIED">VERIFIED</option>
                              <option value="FLAGGED">FLAGGED</option>
                              <option value="TAMPERED">TAMPERED</option>
                            </select>
                          </div>

                          {/* PRIORITY */}
                          <div>
                            <label style={{ display: "block", fontSize: 11, color: "#a1a1aa", marginBottom: 4, fontWeight: 500 }}>Priority</label>
                            <select
                              value={adminPriorityFilter}
                              onChange={(e) => { setAdminPriorityFilter(e.target.value); setAdminPage(1); }}
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #3f3f46", background: "#09090b", color: "#f4f4f5", fontSize: 12, outline: "none" }}
                            >
                              <option value="ALL">All Priorities</option>
                              {PRIORITY_LEVELS.map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>

                          {/* DIVISION */}
                          <div>
                            <label style={{ display: "block", fontSize: 11, color: "#a1a1aa", marginBottom: 4, fontWeight: 500 }}>Division</label>
                            <select
                              value={adminDivisionFilter}
                              onChange={(e) => { setAdminDivisionFilter(e.target.value); setAdminPage(1); }}
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #3f3f46", background: "#09090b", color: "#f4f4f5", fontSize: 12, outline: "none" }}
                            >
                              <option value="ALL">All Divisions</option>
                              {FSL_DIVISIONS.map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>

                          {/* SEAL CONDITION */}
                          <div>
                            <label style={{ display: "block", fontSize: 11, color: "#a1a1aa", marginBottom: 4, fontWeight: 500 }}>Seal Condition</label>
                            <select
                              value={adminSealFilter}
                              onChange={(e) => { setAdminSealFilter(e.target.value); setAdminPage(1); }}
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #3f3f46", background: "#09090b", color: "#f4f4f5", fontSize: 12, outline: "none" }}
                            >
                              <option value="ALL">All Seal Conditions</option>
                              {SEAL_CONDITIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          {/* DATE FROM */}
                          <div>
                            <label style={{ display: "block", fontSize: 11, color: "#a1a1aa", marginBottom: 4, fontWeight: 500 }}>From Date</label>
                            <input
                              type="date"
                              value={adminDateFrom}
                              onChange={(e) => { setAdminDateFrom(e.target.value); setAdminPage(1); }}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #3f3f46", background: "#09090b", color: "#f4f4f5", fontSize: 12, boxSizing: "border-box", outline: "none" }}
                            />
                          </div>

                          {/* DATE TO */}
                          <div>
                            <label style={{ display: "block", fontSize: 11, color: "#a1a1aa", marginBottom: 4, fontWeight: 500 }}>To Date</label>
                            <input
                              type="date"
                              value={adminDateTo}
                              onChange={(e) => { setAdminDateTo(e.target.value); setAdminPage(1); }}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #3f3f46", background: "#09090b", color: "#f4f4f5", fontSize: 12, boxSizing: "border-box", outline: "none" }}
                            />
                          </div>

                          {/* SORT ORDER */}
                          <div>
                            <label style={{ display: "block", fontSize: 11, color: "#a1a1aa", marginBottom: 4, fontWeight: 500 }}>Sort By</label>
                            <select
                              value={adminSortBy}
                              onChange={(e) => setAdminSortBy(e.target.value)}
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #3f3f46", background: "#09090b", color: "#f4f4f5", fontSize: 12, outline: "none" }}
                            >
                              <option value="newest">Newest First</option>
                              <option value="oldest">Oldest First</option>
                              <option value="caseNo">Case Number (A-Z)</option>
                            </select>
                          </div>
                        </div>

                        {/* ACTIVE FILTERS CHIPS & LIVE COUNT ROW (C) */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, paddingTop: 10, borderTop: "1px solid #27272a" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, color: "#f4f4f5", fontWeight: 600 }}>
                              Showing {filtered.length} of {allNormalized.length} records
                            </span>
                            {hasActiveFilters && (
                              <button
                                onClick={clearAllFilters}
                                style={{ padding: "4px 10px", borderRadius: 14, border: "1px solid #3f3f46", background: "transparent", color: "#a1a1aa", fontSize: 11, cursor: "pointer" }}
                              >
                                Clear all
                              </button>
                            )}
                          </div>

                          {/* CHIPS */}
                          {hasActiveFilters && (
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {caseSearch.trim() && (
                                <span style={{ fontSize: 11, background: "#27272a", color: "#e4e4e7", padding: "3px 8px", borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  Search: "{caseSearch}"
                                  <span onClick={() => { setCaseSearch(""); setAdminPage(1); }} style={{ cursor: "pointer", color: "#a1a1aa", fontWeight: "bold" }}>✕</span>
                                </span>
                              )}
                              {adminStatusFilter !== "ALL" && (
                                <span style={{ fontSize: 11, background: "#27272a", color: "#e4e4e7", padding: "3px 8px", borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  Status: {adminStatusFilter}
                                  <span onClick={() => { setAdminStatusFilter("ALL"); setAdminPage(1); }} style={{ cursor: "pointer", color: "#a1a1aa", fontWeight: "bold" }}>✕</span>
                                </span>
                              )}
                              {adminPriorityFilter !== "ALL" && (
                                <span style={{ fontSize: 11, background: "#27272a", color: "#e4e4e7", padding: "3px 8px", borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  Priority: {adminPriorityFilter}
                                  <span onClick={() => { setAdminPriorityFilter("ALL"); setAdminPage(1); }} style={{ cursor: "pointer", color: "#a1a1aa", fontWeight: "bold" }}>✕</span>
                                </span>
                              )}
                              {adminDivisionFilter !== "ALL" && (
                                <span style={{ fontSize: 11, background: "#27272a", color: "#e4e4e7", padding: "3px 8px", borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  Division: {adminDivisionFilter}
                                  <span onClick={() => { setAdminDivisionFilter("ALL"); setAdminPage(1); }} style={{ cursor: "pointer", color: "#a1a1aa", fontWeight: "bold" }}>✕</span>
                                </span>
                              )}
                              {adminSealFilter !== "ALL" && (
                                <span style={{ fontSize: 11, background: "#27272a", color: "#e4e4e7", padding: "3px 8px", borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  Seal: {adminSealFilter}
                                  <span onClick={() => { setAdminSealFilter("ALL"); setAdminPage(1); }} style={{ cursor: "pointer", color: "#a1a1aa", fontWeight: "bold" }}>✕</span>
                                </span>
                              )}
                              {adminDateFrom && (
                                <span style={{ fontSize: 11, background: "#27272a", color: "#e4e4e7", padding: "3px 8px", borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  From: {adminDateFrom}
                                  <span onClick={() => { setAdminDateFrom(""); setAdminPage(1); }} style={{ cursor: "pointer", color: "#a1a1aa", fontWeight: "bold" }}>✕</span>
                                </span>
                              )}
                              {adminDateTo && (
                                <span style={{ fontSize: 11, background: "#27272a", color: "#e4e4e7", padding: "3px 8px", borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  To: {adminDateTo}
                                  <span onClick={() => { setAdminDateTo(""); setAdminPage(1); }} style={{ cursor: "pointer", color: "#a1a1aa", fontWeight: "bold" }}>✕</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* RECORD LIST (E) */}
                      {adminLoading && (
                        <div style={{ padding: 40, textAlign: "center", color: "#a1a1aa", fontSize: 14 }}>
                          <div style={{ display: "inline-block", fontSize: 24, marginBottom: 8, animation: "spin 1s linear infinite" }}>🔄</div>
                          <div>Loading database records...</div>
                        </div>
                      )}

                      {!adminLoading && filtered.length === 0 && (
                        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: 48, textAlign: "center", color: "#a1a1aa" }}>
                          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                          <div style={{ fontSize: 16, color: "#f4f4f5", fontWeight: 600, marginBottom: 6 }}>No matching evidence records found</div>
                          <div style={{ fontSize: 13, color: "#71717a", maxWidth: 400, margin: "0 auto 16px" }}>
                            Try adjusting your search criteria, clearing dropdown filters, or broadening the date range.
                          </div>
                          {hasActiveFilters && (
                            <button
                              onClick={clearAllFilters}
                              style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #3f3f46", background: "#27272a", color: "#f4f4f5", fontSize: 13, cursor: "pointer" }}
                            >
                              Reset all filters
                            </button>
                          )}
                        </div>
                      )}

                      {/* LIST OF RECORD CARDS */}
                      {!adminLoading && filtered.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {pageRecords.map((item) => {
                            const statusBadge = getStatusBadge(item.status);
                            const priorityBadge = getPriorityBadge(item.priority);

                            return (
                              <div
                                key={item.id}
                                onClick={() => openAdminRecord(item.raw)}
                                style={{
                                  background: "#18181b",
                                  border: "1px solid #27272a",
                                  borderRadius: 12,
                                  padding: "16px 18px",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 10
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = "#3b82f6";
                                  e.currentTarget.style.background = "#1c1c20";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = "#27272a";
                                  e.currentTarget.style.background = "#18181b";
                                }}
                              >
                                {/* CARD TOP ROW: CASE / EXHIBIT & BADGES */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                    <span style={{ color: "#f4f4f5", fontSize: 15, fontWeight: 700, letterSpacing: "-0.2px" }}>
                                      Case {item.caseNo ? `#${item.caseNo}` : "Unassigned"}
                                    </span>
                                    <span style={{ color: "#71717a", fontSize: 14 }}>/</span>
                                    <span style={{ color: "#38bdf8", fontSize: 14, fontWeight: 600 }}>
                                      Exhibit {item.exhibit || "N/A"}
                                    </span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: priorityBadge.bg, color: priorityBadge.text, border: `1px solid ${priorityBadge.border}` }}>
                                      {item.priority}
                                    </span>
                                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: statusBadge.bg, color: statusBadge.text, border: `1px solid ${statusBadge.border}` }}>
                                      {item.status}
                                    </span>
                                  </div>
                                </div>

                                {/* CARD MIDDLE ROW: OFFICER, DIVISION, SEAL */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, fontSize: 13 }}>
                                  <div style={{ color: "#d4d4d8" }}>
                                    <span style={{ color: "#a1a1aa" }}>Officer:</span> {item.officerName || "Unknown"}
                                    {item.badge && <span style={{ color: "#71717a", marginLeft: 6 }}>({item.badge})</span>}
                                    {item.role && <span style={{ color: "#71717a", marginLeft: 6 }}>• {item.role}</span>}
                                  </div>
                                  <div style={{ color: "#a1a1aa", fontSize: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                                    <span>🏛️ {item.division}</span>
                                    <span>🔒 Seal: {item.seal}</span>
                                    {item.evidenceList.length > 0 && <span>📄 {item.evidenceList.length} item(s)</span>}
                                  </div>
                                </div>

                                {(item.reportLanguage || item.village || item.district || item.state) && (
                                  <div style={{ color: "#a1a1aa", fontSize: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
                                    {item.reportLanguage && <span>Report language: {({ en: "English", hi: "Hindi", te: "Telugu" })[item.reportLanguage] || item.reportLanguage}</span>}
                                    {(item.village || item.district || item.state) && <span>Location: {[item.village, item.district, item.state].filter(Boolean).join(", ")}</span>}
                                  </div>
                                )}

                                {/* CARD BOTTOM ROW: DATE & ACTION LINK */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid #222226", fontSize: 12 }}>
                                  <div style={{ color: "#71717a", display: "flex", alignItems: "center", gap: 5 }}>
                                    <span>🕒</span>
                                    <span>{item.dateStr}</span>
                                  </div>
                                  <div style={{ color: "#3b82f6", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                                    <span>View Record</span>
                                    <span>→</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* PAGINATION CONTROLS (E) */}
                      {!adminLoading && filtered.length > pageSize && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 20, padding: "14px 18px", background: "#18181b", border: "1px solid #27272a", borderRadius: 12 }}>
                          <div style={{ fontSize: 13, color: "#a1a1aa" }}>
                            Showing <span style={{ color: "#f4f4f5", fontWeight: 600 }}>{startIndex + 1}</span>–<span style={{ color: "#f4f4f5", fontWeight: 600 }}>{Math.min(startIndex + pageSize, filtered.length)}</span> of <span style={{ color: "#f4f4f5", fontWeight: 600 }}>{filtered.length}</span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button
                              onClick={() => setAdminPage((prev) => Math.max(prev - 1, 1))}
                              disabled={safePage === 1}
                              style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #3f3f46", background: safePage === 1 ? "#09090b" : "#27272a", color: safePage === 1 ? "#52525b" : "#f4f4f5", fontSize: 12, fontWeight: 500, cursor: safePage === 1 ? "not-allowed" : "pointer" }}
                            >
                              ← Previous
                            </button>

                            <div style={{ fontSize: 12, color: "#a1a1aa", padding: "0 8px" }}>
                              Page <span style={{ color: "#f4f4f5", fontWeight: 600 }}>{safePage}</span> of <span style={{ color: "#f4f4f5", fontWeight: 600 }}>{totalPages}</span>
                            </div>

                            <button
                              onClick={() => setAdminPage((prev) => Math.min(prev + 1, totalPages))}
                              disabled={safePage === totalPages}
                              style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #3f3f46", background: safePage === totalPages ? "#09090b" : "#27272a", color: safePage === totalPages ? "#52525b" : "#f4f4f5", fontSize: 12, fontWeight: 500, cursor: safePage === totalPages ? "not-allowed" : "pointer" }}
                            >
                              Next →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ===================== RECORD DETAILS VIEW (F & G) ===================== */}
                  {adminPicked && pickedNormalized && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {/* TOP ACTION BAR */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "16px 20px" }}>
                        <button
                          onClick={() => setAdminPicked(null)}
                          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #3f3f46", background: "#27272a", color: "#f4f4f5", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                        >
                          ← Back to Case List
                        </button>

                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: getPriorityBadge(pickedNormalized.priority).bg, color: getPriorityBadge(pickedNormalized.priority).text, border: `1px solid ${getPriorityBadge(pickedNormalized.priority).border}` }}>
                            {pickedNormalized.priority}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: getStatusBadge(pickedNormalized.status).bg, color: getStatusBadge(pickedNormalized.status).text, border: `1px solid ${getStatusBadge(pickedNormalized.status).border}` }}>
                            {pickedNormalized.status}
                          </span>
                          <button
                            onClick={() => handleDownloadRecordJSON(pickedNormalized)}
                            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.12)", color: "#34d399", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                          >
                            <span>💾</span> Download JSON
                          </button>
                        </div>
                      </div>

                      {/* MAIN HEADER TITLE */}
                      <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 22px" }}>
                        <div style={{ fontSize: 11, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, marginBottom: 4 }}>
                          EVIDENCE DOSSIER
                        </div>
                        <h2 style={{ margin: "0 0 6px", fontSize: 22, color: "#f4f4f5", fontWeight: 700 }}>
                          Case #{pickedNormalized.caseNo || "N/A"} • Exhibit {pickedNormalized.exhibit || "N/A"}
                        </h2>
                        <div style={{ fontSize: 13, color: "#a1a1aa" }}>
                          Logged on <span style={{ color: "#f4f4f5" }}>{pickedNormalized.dateStr}</span> • Laboratory Division: <span style={{ color: "#f4f4f5" }}>{pickedNormalized.division}</span>
                        </div>
                      </div>

                      {/* CASE INFO GROUP */}
                      <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: 20 }}>
                        <div style={{ fontSize: 12, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>📂</span> Case Information
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                          <div style={{ background: "#09090b", padding: "12px 14px", borderRadius: 8, border: "1px solid #27272a" }}>
                            <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", marginBottom: 4 }}>Case Number</div>
                            <div style={{ fontSize: 14, color: "#f4f4f5", fontWeight: 600 }}>{pickedNormalized.caseNo || "N/A"}</div>
                          </div>
                          <div style={{ background: "#09090b", padding: "12px 14px", borderRadius: 8, border: "1px solid #27272a" }}>
                            <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", marginBottom: 4 }}>Exhibit Identifier</div>
                            <div style={{ fontSize: 14, color: "#f4f4f5", fontWeight: 600 }}>{pickedNormalized.exhibit || "N/A"}</div>
                          </div>
                          <div style={{ background: "#09090b", padding: "12px 14px", borderRadius: 8, border: "1px solid #27272a" }}>
                            <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", marginBottom: 4 }}>Forensic Division</div>
                            <div style={{ fontSize: 14, color: "#f4f4f5", fontWeight: 600 }}>{pickedNormalized.division}</div>
                          </div>
                          <div style={{ background: "#09090b", padding: "12px 14px", borderRadius: 8, border: "1px solid #27272a" }}>
                            <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", marginBottom: 4 }}>Priority Level</div>
                            <div style={{ fontSize: 14, color: "#f4f4f5", fontWeight: 600 }}>{pickedNormalized.priority}</div>
                          </div>
                          <div style={{ background: "#09090b", padding: "12px 14px", borderRadius: 8, border: "1px solid #27272a" }}>
                            <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", marginBottom: 4 }}>Seal Condition</div>
                            <div style={{ fontSize: 14, color: "#f4f4f5", fontWeight: 600 }}>{pickedNormalized.seal}</div>
                          </div>
                          <div style={{ background: "#09090b", padding: "12px 14px", borderRadius: 8, border: "1px solid #27272a" }}>
                            <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", marginBottom: 4 }}>Evidence Source</div>
                            <div style={{ fontSize: 14, color: "#f4f4f5", fontWeight: 600 }}>{pickedNormalized.source || "Unspecified"}</div>
                          </div>
                          <div style={{ background: "#09090b", padding: "12px 14px", borderRadius: 8, border: "1px solid #27272a" }}>
                            <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", marginBottom: 4 }}>Report Language</div>
                            <div style={{ fontSize: 14, color: "#f4f4f5", fontWeight: 600 }}>{({ en: "English", hi: "Hindi", te: "Telugu" })[pickedNormalized.reportLanguage] || pickedNormalized.reportLanguage || "Not recorded"}</div>
                          </div>
                          <div style={{ background: "#09090b", padding: "12px 14px", borderRadius: 8, border: "1px solid #27272a" }}>
                            <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", marginBottom: 4 }}>Village</div>
                            <div style={{ fontSize: 14, color: "#f4f4f5", fontWeight: 600 }}>{pickedNormalized.village || "Not recorded"}</div>
                          </div>
                          <div style={{ background: "#09090b", padding: "12px 14px", borderRadius: 8, border: "1px solid #27272a" }}>
                            <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", marginBottom: 4 }}>District</div>
                            <div style={{ fontSize: 14, color: "#f4f4f5", fontWeight: 600 }}>{pickedNormalized.district || "Not recorded"}</div>
                          </div>
                          <div style={{ background: "#09090b", padding: "12px 14px", borderRadius: 8, border: "1px solid #27272a" }}>
                            <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", marginBottom: 4 }}>State</div>
                            <div style={{ fontSize: 14, color: "#f4f4f5", fontWeight: 600 }}>{pickedNormalized.state || "Not recorded"}</div>
                          </div>
                        </div>
                      </div>

                      {/* OFFICER INFO GROUP */}
                      <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: 20 }}>
                        <div style={{ fontSize: 12, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>👮</span> Officer & Intake Information
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                          <div style={{ background: "#09090b", padding: "12px 14px", borderRadius: 8, border: "1px solid #27272a" }}>
                            <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", marginBottom: 4 }}>Submitting Officer</div>
                            <div style={{ fontSize: 14, color: "#f4f4f5", fontWeight: 600 }}>{pickedNormalized.officerName || "N/A"}</div>
                          </div>
                          <div style={{ background: "#09090b", padding: "12px 14px", borderRadius: 8, border: "1px solid #27272a" }}>
                            <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", marginBottom: 4 }}>Badge ID</div>
                            <div style={{ fontSize: 14, color: "#f4f4f5", fontWeight: 600 }}>{pickedNormalized.badge || "N/A"}</div>
                          </div>
                          <div style={{ background: "#09090b", padding: "12px 14px", borderRadius: 8, border: "1px solid #27272a" }}>
                            <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", marginBottom: 4 }}>Official Role</div>
                            <div style={{ fontSize: 14, color: "#f4f4f5", fontWeight: 600 }}>{pickedNormalized.role || "N/A"}</div>
                          </div>
                          <div style={{ background: "#09090b", padding: "12px 14px", borderRadius: 8, border: "1px solid #27272a" }}>
                            <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", marginBottom: 4 }}>Received By</div>
                            <div style={{ fontSize: 14, color: "#f4f4f5", fontWeight: 600 }}>{pickedNormalized.receivedBy || "N/A"}</div>
                          </div>
                        </div>
                      </div>

                      {/* EVIDENCE ITEMS LIST */}
                      <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: 20 }}>
                        <div style={{ fontSize: 12, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>📝</span> Evidence Manifest & Descriptions ({pickedNormalized.evidenceList.length})
                        </div>
                        {pickedNormalized.evidenceList.length === 0 ? (
                          <div style={{ color: "#71717a", fontSize: 13, fontStyle: "italic", padding: "10px 0" }}>No evidence content sections logged.</div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {pickedNormalized.evidenceList.map((e, i) => (
                              <div key={i} style={{ background: "#09090b", borderRadius: 10, border: "1px solid #27272a", padding: 16 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                  <span style={{ fontSize: 10, background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>
                                    Item #{i + 1}
                                  </span>
                                  <span style={{ fontSize: 14, color: "#f4f4f5", fontWeight: 700 }}>{e.title || `Evidence Item ${i + 1}`}</span>
                                </div>
                                <div style={{ fontSize: 13, color: "#d4d4d8", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{e.content}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* CRYPTOGRAPHIC INTEGRITY & HASH */}
                      <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: 20 }}>
                        <div style={{ fontSize: 12, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>🔐</span> Cryptographic Proof & Integrity
                        </div>

                        {/* SHA-256 HASH */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", fontWeight: 600 }}>SHA-256 Digital Signature</div>
                            <button
                              onClick={() => handleCopy(pickedNormalized.hash, "hash")}
                              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #3f3f46", background: "#27272a", color: adminCopyFeedback === "hash" ? "#34d399" : "#e4e4e7", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                            >
                              {adminCopyFeedback === "hash" ? "✓ Copied!" : "📋 Copy Hash"}
                            </button>
                          </div>
                          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#38bdf8", background: "#09090b", padding: "12px 14px", borderRadius: 8, border: "1px solid #27272a", wordBreak: "break-all", userSelect: "all" }}>
                            {pickedNormalized.hash || "No cryptographic hash recorded."}
                          </div>
                        </div>

                        {/* EVIDENCE ID */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", fontWeight: 600 }}>Evidence Unique UUID</div>
                            <button
                              onClick={() => handleCopy(pickedNormalized.id, "uuid")}
                              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #3f3f46", background: "#27272a", color: adminCopyFeedback === "uuid" ? "#34d399" : "#e4e4e7", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                            >
                              {adminCopyFeedback === "uuid" ? "✓ Copied!" : "📋 Copy ID"}
                            </button>
                          </div>
                          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#a1a1aa", background: "#09090b", padding: "10px 14px", borderRadius: 8, border: "1px solid #27272a", wordBreak: "break-all", userSelect: "all" }}>
                            {pickedNormalized.id}
                          </div>
                        </div>
                      </div>

                      {/* HISTORY TIMELINE */}
                      <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: 20 }}>
                        <div style={{ fontSize: 12, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>⏱️</span> Chain of Custody Audit Trail
                        </div>
                        {adminHistory.length === 0 ? (
                          <div style={{ color: "#71717a", fontSize: 13, fontStyle: "italic" }}>No audit log history events recorded.</div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {adminHistory.map((h, i) => (
                              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, padding: "10px 12px", background: "#09090b", borderRadius: 8, border: "1px solid #222226", fontSize: 13 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6" }} />
                                  <span style={{ color: "#f4f4f5", fontWeight: 600 }}>{h.action || "Action"}</span>
                                  {h.result && <span style={{ color: "#a1a1aa" }}>- {h.result}</span>}
                                  {h.by && <span style={{ color: "#71717a", fontSize: 12 }}>by {h.by}</span>}
                                </div>
                                <span style={{ color: "#71717a", fontSize: 12 }}>
                                  {h.time && h.time.toDate ? h.time.toDate().toLocaleString() : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

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
                background: 'transparent',
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

      {showSaveReminder && (
        <div onClick={dismissSaveReminder} style={{ position: "fixed", inset: 0, zIndex: 11000, display: "grid", placeItems: "center", padding: 20, background: "rgba(0,0,0,0.72)" }}>
          <section role="dialog" aria-modal="true" aria-labelledby="save-reminder-title" onClick={(event) => event.stopPropagation()} style={{ width: "100%", maxWidth: 460, padding: 26, borderRadius: 14, background: "#202024", border: "1px solid #3f3f46", boxSizing: "border-box" }}>
            <h2 id="save-reminder-title" style={{ margin: "0 0 8px", color: "#f4f4f5", fontSize: 20 }}>Please download your QR and report</h2>
            <p style={{ margin: "0 0 18px", color: "#a1a1aa", fontSize: 13, lineHeight: 1.6 }}>Save both files before leaving so you have a copy of this evidence package.</p>
            <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
              <button type="button" onClick={saveQR} style={{ padding: 11, borderRadius: 8, border: "1px solid #52525b", background: "#18181b", color: "#f4f4f5", fontWeight: 600, cursor: "pointer" }}>{qrDownloaded ? "QR downloaded ✓" : "Download QR"}</button>
              <button type="button" onClick={downloadGeneratedForensicReport} style={{ padding: 11, borderRadius: 8, border: "1px solid #3b82f6", background: "rgba(59,130,246,0.12)", color: "#bfdbfe", fontWeight: 600, cursor: "pointer" }}>{reportExportStarted ? "Report export started ✓" : reportLanguage === "en" ? "Download report PDF" : "Print / save report PDF"}</button>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button type="button" onClick={dismissSaveReminder} style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #52525b", background: "transparent", color: "#e4e4e7", cursor: "pointer" }}>Stay here</button>
              <button type="button" onClick={continueWithoutSaving} style={{ padding: "9px 14px", borderRadius: 8, border: 0, background: "#3b82f6", color: "white", fontWeight: 600, cursor: "pointer" }}>{qrDownloaded && reportExportStarted ? "Continue" : "Continue without saving"}</button>
            </div>
          </section>
        </div>
      )}

      {showGeneratedNotice && !showSaveReminder && manifest && (
        <aside role="status" aria-live="polite" style={{ position: "fixed", right: 24, bottom: 24, zIndex: 9000, width: "min(420px, calc(100vw - 32px))", padding: 18, borderRadius: 14, background: "#202024", border: "1px solid #3f3f46", boxShadow: "0 16px 48px rgba(0,0,0,0.4)", boxSizing: "border-box", animation: "fadeIn 180ms ease-out" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div aria-hidden="true" style={{ width: 34, height: 34, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 10, color: "#6ee7b7", background: "rgba(16,185,129,0.12)", fontSize: 18 }}>✓</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#f4f4f5", fontSize: 14, fontWeight: 700 }}>Evidence package generated</div>
              <div style={{ marginTop: 4, color: "#a1a1aa", fontSize: 12, lineHeight: 1.5 }}>Please download the QR and report to keep your copy.</div>
            </div>
            <button type="button" aria-label="Dismiss download reminder" onClick={() => setShowGeneratedNotice(false)} style={{ border: 0, background: "transparent", color: "#a1a1aa", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button type="button" onClick={saveQR} style={{ flex: 1, padding: "9px 10px", borderRadius: 8, border: "1px solid #52525b", background: "#18181b", color: "#f4f4f5", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Download QR</button>
            <button type="button" onClick={downloadGeneratedForensicReport} style={{ flex: 1, padding: "9px 10px", borderRadius: 8, border: "1px solid #3b82f6", background: "rgba(59,130,246,0.12)", color: "#bfdbfe", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{reportLanguage === "en" ? "Download report" : "Print / save report"}</button>
          </div>
        </aside>
      )}

      {isAdminLoginOpen && !signedInUser && (
        <div onClick={() => setIsAdminLoginOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(5px)" }}>
          <section role="dialog" aria-modal="true" aria-labelledby="admin-login-title" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, padding: 28, borderRadius: 16, background: "#18181b", border: "1px solid #3f3f46", boxShadow: "0 24px 80px rgba(0,0,0,0.55)", position: "relative" }}>
            <button type="button" onClick={() => setIsAdminLoginOpen(false)} aria-label="Close admin login" style={{ position: "absolute", top: 12, right: 14, border: 0, background: "transparent", color: "#a1a1aa", fontSize: 24, cursor: "pointer" }}>×</button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontSize: 18 }}>🛡️</div>
              <div><h3 id="admin-login-title" style={{ margin: 0, fontSize: 19, color: "#f4f4f5", fontWeight: 700 }}>Authorized Account Sign In</h3><div style={{ fontSize: 12, color: "#a1a1aa" }}>Sign in to create or verify an evidence package</div></div>
            </div>
            <p style={{ margin: "12px 0 20px", fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>Use an account issued and approved by the administrator.</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setAdminError("");
              try {
                const credential = await signInWithEmailAndPassword(auth, adminEmail.trim(), adminPass);
                setAdminPass("");
                setIsAdminLoginOpen(false);
                if (credential.user.email?.toLowerCase() === "nittalaphaneendhar@gmail.com") setTab("admin");
              } catch {
                setAdminError("Login failed. Check email and password.");
              }
            }}>
              <input autoFocus type="email" placeholder="Account email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required style={{ width: "100%", padding: "11px 14px", marginBottom: 12, borderRadius: 8, border: "1px solid #3f3f46", background: "#09090b", color: "#f4f4f5", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
              <input type="password" placeholder="Password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} required style={{ width: "100%", padding: "11px 14px", marginBottom: 16, borderRadius: 8, border: "1px solid #3f3f46", background: "#09090b", color: "#f4f4f5", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
              {adminError && <div style={{ color: "#fca5a5", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>{adminError}</div>}
              <button type="submit" style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: accent, color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Sign In</button>
            </form>
          </section>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
