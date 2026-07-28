"use client";

import { useEffect, useState, useRef } from "react";
import { app, auth } from "@/lib/firebase";
import {
    getFirestore,
    doc,
    getDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { ShieldAlertIcon, Mail, Compass, ArrowRight, ArrowLeft, CheckCircle2, FileText, Upload } from "lucide-react";

const ScallopDivider = ({ topColor }) => (
  <div className="w-full h-[15px] relative z-10 -mt-[1px] mb-[1px]">
    <svg width="100%" height="15" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0">
      <defs>
        <pattern id={`form-scallop-${topColor.replace('#', '')}`} x="0" y="0" width="30" height="15" patternUnits="userSpaceOnUse">
          <path d="M0,0 a15,15 0 0,0 30,0" fill={topColor} />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="15" fill={`url(#form-scallop-${topColor.replace('#', '')})`} />
    </svg>
  </div>
);

export default function UserRegistrationForm({ user, setUser, tripId, autofillData, onSuccess }) {
    const dbRef = useRef(null);
    const [dbReady, setDbReady] = useState(false);
    
    useEffect(() => {
        dbRef.current = getFirestore(app);
        setDbReady(true);
    }, []);

    const [fields, setFields] = useState([]);
    const [formValues, setFormValues] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1);

    // Consent Form State
    const [showConsent, setShowConsent] = useState(false);
    const [consentFormTemplateUrl, setConsentFormTemplateUrl] = useState("");
    const [consentTemplates, setConsentTemplates] = useState([]);
    const [consentFiles, setConsentFiles] = useState({}); // mapping: templateId -> File object
    const [tripName, setTripName] = useState("Event");

    // Student ID / Aadhaar State (for first time users only)
    const isFirstTime = !autofillData || Object.keys(autofillData).length === 0 || (!autofillData["Student ID Card Copy"] && !autofillData["Aadhaar Card Copy"]);
    const [aadhaarNum, setAadhaarNum] = useState("");
    const [aadhaarFile, setAadhaarFile] = useState(null); // stores the uploaded Google Drive URL

    // Background upload tracking states
    const [uploadingAadhaar, setUploadingAadhaar] = useState(false);
    const [uploadingConsent, setUploadingConsent] = useState({}); // mapping: templateId -> boolean
    const [uploadingDynamic, setUploadingDynamic] = useState({}); // mapping: fieldName -> boolean

    const isFieldDisabled = (fieldName) => {
        const field = fields.find(f => f.name === fieldName);
        if (!field) return false;
        return !!(autofillData && autofillData[fieldName] !== undefined && field.allowEditIfPrefilled === false);
    };

    useEffect(() => {
        if (!dbRef.current || !tripId) return;
        const fetchForm = async () => {
            try {
                const docRef = doc(dbRef.current, "trips", tripId);
                const snapshot = await getDoc(docRef);

                if (snapshot.exists()) {
                    const data = snapshot.data();
                    setTripName(data?.name || "Event");
                    setConsentFormTemplateUrl(data?.consentFormTemplateUrl || "");
                    const templates = data?.consentTemplates && data.consentTemplates.length > 0
                        ? data.consentTemplates
                        : (data?.consentFormTemplateUrl ? [{ id: "legacy-consent", name: "Completed Consent Form", templateUrl: data.consentFormTemplateUrl }] : []);
                    setConsentTemplates(templates);
                    const formFields = data?.form?.fields || [];
                    const sorted = [...formFields].sort((a, b) => a.sortOrder - b.sortOrder);
                    setFields(sorted);

                    // Initialize formValues from autofillData
                    if (autofillData) {
                        const prefilled = {};
                        sorted.forEach((field) => {
                            if (autofillData[field.name] !== undefined) {
                                prefilled[field.name] = autofillData[field.name];
                            }
                        });
                        setFormValues(prefilled);
                    }
                }
            } catch (err) {
                console.error("Error loading trip form fields:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchForm();
    }, [dbReady, tripId, autofillData]);

    const handleChange = (fieldName, value) => {
        setFormValues((prev) => ({ ...prev, [fieldName]: value }));
    };

    const uploadFileToDrive = async (file, subFolderType, fieldName) => {
        try {
            const token = await user.getIdToken();
            const base64Image = await convertToBase64(file);

            if (!base64Image || typeof base64Image !== "string" || !base64Image.startsWith("data:")) {
                throw new Error("Invalid file format. Please upload an image or a PDF.");
            }

            const uploadRes = await fetch("/api/uploadImage", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    images: [base64Image],
                    folder: "trip_registrations",
                    email: user?.email || autofillData?.email || "anonymous",
                    tripName: tripName || "Event",
                    subFolderType: subFolderType,
                }),
            });
            const data = await uploadRes.json();
            if (!uploadRes.ok) {
                throw new Error(data.error || "File upload failed");
            }
            const imageUrl = data.images[0].secure_url || data.images[0];
            return imageUrl;
        } catch (error) {
            console.error("Instant upload failed:", error);
            alert(`Upload failed for ${fieldName}: ${error.message}`);
            return null;
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    const convertToBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const loadPdfJs = () => {
      return new Promise((resolve, reject) => {
        if (window.pdfjsLib) {
          resolve(window.pdfjsLib);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
        script.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
          resolve(window.pdfjsLib);
        };
        script.onerror = () => reject(new Error("Failed to load PDF library"));
        document.head.appendChild(script);
      });
    };

    const convertPdfToJpg = async (file) => {
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      
      const pagesData = [];
      let totalHeight = 0;
      let maxWidth = 0;

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        pagesData.push({ page, viewport });
        totalHeight += viewport.height;
        maxWidth = Math.max(maxWidth, viewport.width);
      }

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.height = totalHeight;
      canvas.width = maxWidth;

      // Fill background with white to avoid black regions on JPG export
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      let currentY = 0;
      for (const { page, viewport } of pagesData) {
        const renderCanvas = document.createElement("canvas");
        renderCanvas.width = viewport.width;
        renderCanvas.height = viewport.height;
        const renderContext = renderCanvas.getContext("2d");
        
        await page.render({ canvasContext: renderContext, viewport }).promise;
        
        context.drawImage(renderCanvas, 0, currentY);
        currentY += viewport.height;
      }
      
      return canvas.toDataURL("image/jpeg", 0.85);
    };

    const downloadAsPdf = async (imageUrl, filename) => {
      try {
        if (!window.jspdf) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error("Failed to load image"));
        });

        const imgWidth = img.width;
        const imgHeight = img.height;
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const width = imgWidth * ratio;
        const height = imgHeight * ratio;
        const x = (pdfWidth - width) / 2;
        const y = (pdfHeight - height) / 2;

        doc.addImage(img, "JPEG", x, y, width, height);
        doc.save(filename);
      } catch (err) {
        console.error("PDF generation failed:", err);
        window.open(imageUrl, "_blank");
      }
    };

    const handleNext = (e) => {
      if (e) e.preventDefault();
      setStep(prev => prev + 1);
    };

    const handleBack = (e) => {
      if (e) e.preventDefault();
      setStep(prev => prev - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user || !tripId) return;

        // Prevent submission if anything is still uploading
        if (uploadingAadhaar || Object.values(uploadingConsent).some(Boolean) || Object.values(uploadingDynamic).some(Boolean)) {
            alert("Please wait for all file uploads to complete before submitting.");
            return;
        }

        setSubmitting(true);

        try {
            const token = await user.getIdToken();
            const formDataObj = { ...formValues };

            if (isFirstTime) {
                if (!aadhaarFile || typeof aadhaarFile !== "string") {
                    alert("Please upload your Student ID Card copy.");
                    setSubmitting(false);
                    return;
                }
                formDataObj["Student ID Card Copy"] = aadhaarFile;
            } else {
                const pastIdNum = autofillData["Student ID Number"] || autofillData["Aadhaar Number"];
                if (pastIdNum) {
                    formDataObj["Student ID Number"] = pastIdNum;
                }
                const pastIdCopy = autofillData["Student ID Card Copy"] || autofillData["Aadhaar Card Copy"];
                if (pastIdCopy) {
                    formDataObj["Student ID Card Copy"] = pastIdCopy;
                }
            }

            if (consentTemplates.length > 0) {
                for (const t of consentTemplates) {
                    const fileUrl = consentFiles[t.id];
                    if (!fileUrl || typeof fileUrl !== "string") {
                        alert(`Please upload the signed copy of: ${t.name}`);
                        setSubmitting(false);
                        return;
                    }
                    const fileKey = t.id === "legacy-consent" ? "Completed Consent Form" : `Completed Consent - ${t.name}`;
                    formDataObj[fileKey] = fileUrl;
                }
            }

            const res = await fetch("/api/user-registration", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ tripId, formData: formDataObj }),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Submission failed");
                return;
            }
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error("Submission error:", error);
            alert(error.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
      return (
        <div className="w-full bg-white rounded-[2rem] shadow-xl p-8 text-center border border-black/5 animate-pulse">
          <div className="text-[#3E1126] font-oswald font-bold text-xl uppercase tracking-wide">Loading Form Fields...</div>
        </div>
      );
    }

    return (
      <div className="w-full bg-white rounded-[2rem] shadow-xl overflow-hidden relative flex flex-col border border-black/5">
        
        {/* Thematic Header */}
        <div className="relative pt-8 pb-6 px-8 text-center flex flex-col items-center" style={{ backgroundColor: '#E4D5FF' }}>
          
          {/* Progress Indicators */}
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-2">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'w-8 bg-[#3E1126]' : 'w-2 bg-[#3E1126]/20'}`}></div>
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'w-8 bg-[#3E1126]' : 'w-2 bg-[#3E1126]/20'}`}></div>
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 3 ? 'w-8 bg-[#3E1126]' : 'w-2 bg-[#3E1126]/20'}`}></div>
          </div>

          <div className="w-12 h-12 bg-[#3E1126] rounded-full flex items-center justify-center shadow-md mb-3 text-white">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-oswald font-bold text-[#3E1126] uppercase tracking-wide">
            Join The Journey
          </h2>
          <p className="text-xs sm:text-sm font-medium text-[#3E1126]/70 mt-1">
            Step {step} of 3 • {step === 1 ? 'Personal Details' : step === 2 ? 'Travel Info' : 'Final Steps'}
          </p>
        </div>

        {/* Scallop transition from Header to Form Body */}
        <ScallopDivider topColor="#E4D5FF" />

        <div className="p-6 sm:p-8 bg-white relative z-20 overflow-y-auto max-h-[60vh] custom-scrollbar" data-lenis-prevent>
          
          {/* STEP 1: Basic Info & Aadhaar */}
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="space-y-1.5">
                <label className="text-xs font-oswald font-bold uppercase tracking-wider text-[#3E1126]">
                  IITM Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-zinc-100 border-2 border-transparent rounded-xl text-sm text-[#3E1126]/70 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              {isFirstTime && (
                <div className="bg-zinc-50 border-2 border-[#3E1126]/10 rounded-xl p-5 space-y-4">
                  <h4 className="font-oswald font-bold text-sm uppercase tracking-wider flex items-center gap-2 text-[#3E1126]">
                    <ShieldAlertIcon className="w-4 h-4" /> First-Time Registration
                  </h4>
                  <p className="text-xs text-[#3E1126]/80 font-medium leading-relaxed">
                    Student ID verification is mandatory for first-time event registrations. This will be securely saved for auto-filling future event forms.
                  </p>
                  


                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Student ID Card Copy (Front & Back)</label>
                    <div className="relative space-y-1.5">
                      <input
                        type="file"
                        required={!aadhaarFile}
                        accept="image/*,.pdf"
                        disabled={uploadingAadhaar}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 10 * 1024 * 1024) {
                            alert("File size must be less than 10MB");
                            e.target.value = "";
                            return;
                          }
                          setUploadingAadhaar(true);
                          const url = await uploadFileToDrive(file, "Student IDs", "Student ID Card Copy");
                          if (url) {
                            setAadhaarFile(url);
                          } else {
                            e.target.value = "";
                            setAadhaarFile(null);
                          }
                          setUploadingAadhaar(false);
                        }}
                        className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#3E1126] file:text-white hover:file:bg-[#3E1126]/80 file:cursor-pointer file:transition-colors bg-white border-2 border-zinc-200 rounded-xl p-1"
                      />
                      {uploadingAadhaar && (
                        <p className="text-xs text-amber-600 font-bold animate-pulse">Uploading file... Please wait.</p>
                      )}
                      {aadhaarFile && typeof aadhaarFile === "string" && aadhaarFile.startsWith("http") && (
                        <p className="text-xs text-green-600 font-bold">Uploaded successfully! ✅</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={uploadingAadhaar}
                  className="w-full flex justify-center items-center gap-2 text-sm font-bold text-black bg-[#FCE16D] px-6 py-3.5 rounded-full shadow-[0_4px_14px_0_rgba(252,225,109,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  {uploadingAadhaar ? "Uploading ID..." : "Continue"}
                  {!uploadingAadhaar && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Dynamic Trip Fields */}
          {step === 2 && (
            <form onSubmit={handleNext} className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
              <button 
                type="button"
                onClick={handleBack}
                className="mb-2 -mt-2 inline-flex items-center text-xs font-bold font-oswald uppercase tracking-wider text-zinc-400 hover:text-[#3E1126] transition-colors"
              >
                <ArrowLeft className="w-3 h-3 mr-1" /> Back
              </button>

              <div className="space-y-5">
                {fields.map((field) => {
                  const currentVal = formValues[field.name] || "";
                  
                  return (
                    <div key={field.id} className="space-y-1.5">
                      <label className="text-xs font-oswald font-bold uppercase tracking-wider text-[#3E1126]">
                        {field.name}
                      </label>
                      
                      {field.type === "short_text" && (
                        <input
                          type="text"
                          required
                          value={currentVal}
                          disabled={isFieldDisabled(field.name)}
                          onChange={(e) => handleChange(field.name, e.target.value)}
                          className={`w-full px-4 py-3 border-2 border-transparent rounded-xl text-sm font-medium focus:outline-none transition-all ${
                            isFieldDisabled(field.name)
                              ? "bg-zinc-100 text-zinc-400 cursor-not-allowed border-transparent"
                              : "bg-zinc-50 text-[#3E1126] focus:border-[#3E1126]/10 focus:bg-white"
                          }`}
                        />
                      )}

                      {field.type === "long_text" && (
                        <textarea
                          rows={2}
                          required
                          value={currentVal}
                          disabled={isFieldDisabled(field.name)}
                          onChange={(e) => handleChange(field.name, e.target.value)}
                          className={`w-full px-4 py-3 border-2 border-transparent rounded-xl text-sm font-medium focus:outline-none transition-all resize-none ${
                            isFieldDisabled(field.name)
                              ? "bg-zinc-100 text-zinc-400 cursor-not-allowed border-transparent"
                              : "bg-zinc-50 text-[#3E1126] focus:border-[#3E1126]/10 focus:bg-white"
                          }`}
                        />
                      )}

                      {field.type === "date" && (
                        <input
                          type="date"
                          required
                          value={currentVal}
                          disabled={isFieldDisabled(field.name)}
                          onChange={(e) => handleChange(field.name, e.target.value)}
                          className={`w-full px-4 py-3 border-2 border-transparent rounded-xl text-sm font-medium focus:outline-none transition-all ${
                            isFieldDisabled(field.name)
                              ? "bg-zinc-100 text-zinc-400 cursor-not-allowed border-transparent"
                              : "bg-zinc-50 text-[#3E1126] focus:border-[#3E1126]/10 focus:bg-white"
                          }`}
                        />
                      )}

                      {field.type === "select" && (
                        <div className="relative">
                          <select
                            required
                            value={currentVal}
                            disabled={isFieldDisabled(field.name)}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            className={`w-full px-4 py-3 border-2 border-transparent rounded-xl text-sm font-medium focus:outline-none transition-all appearance-none ${
                              isFieldDisabled(field.name)
                                ? "bg-zinc-100 text-zinc-400 cursor-not-allowed border-transparent"
                                : "bg-zinc-50 text-[#3E1126] focus:border-[#3E1126]/10 focus:bg-white"
                            }`}
                          >
                            <option value="" disabled>Select an option</option>
                            {field.options?.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      )}

                      {field.type === "radio" && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {field.options?.map((option) => {
                            const isDisabled = isFieldDisabled(field.name);
                            return (
                              <label key={option} className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                currentVal === option
                                  ? isDisabled
                                    ? 'border-zinc-300 bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                    : 'border-[#3E1126] bg-[#3E1126]/5 text-[#3E1126]'
                                  : isDisabled
                                  ? 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed opacity-50'
                                  : 'border-zinc-100 bg-zinc-50 text-zinc-500 hover:border-[#3E1126]/20'
                              }`}>
                                <input
                                  type="radio"
                                  className="hidden"
                                  name={field.name}
                                  value={option}
                                  required
                                  disabled={isDisabled}
                                  checked={currentVal === option}
                                  onChange={(e) => handleChange(field.name, e.target.value)}
                                />
                                <span className="text-sm font-bold">{option}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {field.type === "file" && (
                        <div className="space-y-1.5">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            required={!currentVal}
                            disabled={isFieldDisabled(field.name) || uploadingDynamic[field.name]}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 10 * 1024 * 1024) {
                                alert("File size must be less than 10MB");
                                e.target.value = "";
                                return;
                              }
                              setUploadingDynamic(prev => ({ ...prev, [field.name]: true }));
                              const url = await uploadFileToDrive(file, "Form Files", field.name);
                              if (url) {
                                handleChange(field.name, url);
                              } else {
                                e.target.value = "";
                                handleChange(field.name, "");
                              }
                              setUploadingDynamic(prev => ({ ...prev, [field.name]: false }));
                            }}
                            className={`w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#3E1126] file:text-white hover:file:bg-[#3E1126]/80 file:cursor-pointer file:transition-colors border-2 border-transparent rounded-xl p-1 ${
                              isFieldDisabled(field.name)
                                ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                : "bg-zinc-50"
                            }`}
                          />
                          {uploadingDynamic[field.name] && (
                            <p className="text-xs text-amber-600 font-bold animate-pulse">Uploading file... Please wait.</p>
                          )}
                          {currentVal && typeof currentVal === "string" && currentVal.startsWith("http") && (
                            <p className="text-xs text-green-600 font-bold">Uploaded successfully! ✅</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={Object.values(uploadingDynamic).some(Boolean)}
                  className="w-full flex justify-center items-center gap-2 text-sm font-bold text-black bg-[#FCE16D] px-6 py-3.5 rounded-full shadow-[0_4px_14px_0_rgba(252,225,109,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  {Object.values(uploadingDynamic).some(Boolean) ? "Uploading Files..." : "Continue"}
                  {!Object.values(uploadingDynamic).some(Boolean) && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Consent Form & Submission */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <button 
                type="button"
                onClick={handleBack}
                className="mb-2 -mt-2 inline-flex items-center text-xs font-bold font-oswald uppercase tracking-wider text-zinc-400 hover:text-[#3E1126] transition-colors"
              >
                <ArrowLeft className="w-3 h-3 mr-1" /> Back
              </button>

              {consentTemplates.length > 0 ? (
                <div className="space-y-4">
                  {consentTemplates.map((t) => (
                    <div key={t.id} className="bg-zinc-50 border-2 border-[#3E1126]/10 rounded-xl p-5 space-y-4">
                      <h4 className="font-oswald font-bold text-sm uppercase tracking-wider flex items-center gap-2 text-[#3E1126]">
                        <FileText className="w-4 h-4" /> {t.name}
                      </h4>
                      <p className="text-xs text-[#3E1126]/80 font-medium leading-relaxed">
                        Please download the template, sign it, and upload the signed copy below.
                      </p>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const parts = t.templateUrl.split("/");
                          const lastPart = parts[parts.length - 1];
                          const filename = lastPart || `${t.name}_template.pdf`;
                          const proxyUrl = `/api/downloadProxy/${encodeURIComponent(filename)}?url=${encodeURIComponent(t.templateUrl)}`;
                          window.open(proxyUrl, "_blank");
                        }}
                        className="w-full flex justify-center items-center gap-2 text-xs font-bold text-white bg-zinc-800 px-4 py-2.5 rounded-lg hover:bg-black transition-colors"
                      >
                        Download {t.name} Template
                      </button>

                      <div className="space-y-1.5 pt-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Upload Signed Copy</label>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          required={!consentFiles[t.id]}
                          disabled={uploadingConsent[t.id]}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 10 * 1024 * 1024) {
                              alert("File size must be less than 10MB");
                              e.target.value = "";
                              return;
                            }
                            setUploadingConsent((prev) => ({ ...prev, [t.id]: true }));
                            const url = await uploadFileToDrive(file, "Consent Forms", t.name);
                            if (url) {
                              setConsentFiles((prev) => ({ ...prev, [t.id]: url }));
                            } else {
                              e.target.value = "";
                              setConsentFiles((prev) => {
                                const copy = { ...prev };
                                delete copy[t.id];
                                return copy;
                              });
                            }
                            setUploadingConsent((prev) => ({ ...prev, [t.id]: false }));
                          }}
                          className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#3E1126] file:text-white hover:file:bg-[#3E1126]/80 file:cursor-pointer file:transition-colors bg-white border-2 border-zinc-200 rounded-xl p-1"
                        />
                        {uploadingConsent[t.id] && (
                          <p className="text-xs text-amber-600 font-bold animate-pulse mt-1">Uploading copy... Please wait.</p>
                        )}
                        {consentFiles[t.id] && typeof consentFiles[t.id] === "string" && consentFiles[t.id].startsWith("http") && (
                          <p className="text-xs text-green-600 font-bold mt-1">Uploaded successfully! ✅</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 text-[#3E1126]/20 mx-auto mb-3" />
                  <p className="text-sm font-medium text-zinc-500">You're almost there! Just submit your registration to complete the process.</p>
                </div>
              )}

              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="consent-check"
                  required
                  className="mt-1 w-4 h-4 cursor-pointer accent-[#3E1126] rounded-sm"
                />
                <label htmlFor="consent-check" className="text-xs font-medium text-zinc-600 cursor-pointer select-none leading-tight">
                  I agree to the <button type="button" onClick={() => setShowConsent(true)} className="font-bold text-[#3E1126] hover:underline">Terms & Conditions</button> and confirm that all provided information is accurate.
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || Object.values(uploadingConsent).some(Boolean)}
                  className="w-full flex justify-center items-center gap-2 text-sm font-bold text-white bg-[#3E1126] px-6 py-3.5 rounded-full shadow-[0_4px_14px_0_rgba(62,17,38,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : Object.values(uploadingConsent).some(Boolean) ? "Uploading Consent..." : "Submit Registration"}
                  {!submitting && !Object.values(uploadingConsent).some(Boolean) && <CheckCircle2 className="h-4 w-4" />}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal for Consent Terms Preview */}
        {showConsent && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 flex items-center justify-center backdrop-blur-sm" data-lenis-prevent>
            <div className="bg-white rounded-[2rem] max-w-lg w-full p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowConsent(false)}
                className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-800 transition-colors"
              >
                ✕
              </button>
              <h3 className="font-oswald font-bold text-xl text-[#3E1126] uppercase mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Terms & Conditions
              </h3>
              <div className="text-sm text-zinc-600 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 leading-relaxed" data-lenis-prevent>
                <p className="font-bold text-zinc-800">UNDERTAKING & CONSENT BY THE PARTICIPANT</p>
                <p>1. I hereby confirm my participation in the upcoming trip organized by the Boundless Society. I acknowledge that I am participating of my own free will.</p>
                <p>2. I certify that I am medically fit to travel and participate in the activities planned during the trip. In case of any emergency, the society coordinators are authorized to arrange medical assistance.</p>
                <p>3. I agree to abide by the code of conduct of IIT Madras and the Boundless Society. Any misbehavior, consumption of prohibited substances, or violation of safety rules will lead to immediate cancellation of my participation and disciplinary action.</p>
                <p>4. I understand that the society will take all reasonable safety precautions but shall not be held liable for any unforeseen losses, damages, or injuries.</p>
              </div>
              <div className="pt-6 mt-6 border-t border-zinc-100">
                <button
                  onClick={() => setShowConsent(false)}
                  className="w-full flex justify-center items-center gap-2 text-sm font-bold text-black bg-[#FCE16D] px-6 py-3 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  I Acknowledge
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}