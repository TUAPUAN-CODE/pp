import React, { useState, useEffect, useRef } from "react";
import { Modal, Box, Typography, TextField, Button, IconButton, Tooltip, Alert, useTheme, Divider, DialogContent, Dialog, Autocomplete } from "@mui/material";
import { styled } from "@mui/system";
import { IoClose, IoInformationCircle } from "react-icons/io5";
import QrScanner from "qr-scanner";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const API_URL = import.meta.env.VITE_API_URL;

// Data Verification Modal Component
const DataVerificationModal = ({
  open,
  onClose,
  onConfirm,
  onCancel,
  primaryBatch,
  secondaryBatch
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  // const currentTime = new Date().toLocaleString('th-TH', {
  //   year: 'numeric',
  //   month: '2-digit',
  //   day: '2-digit',
  //   hour: '2-digit',
  //   minute: '2-digit',
  //   second: '2-digit'
  // });

  const handleConfirmData = async () => {
    setLoading(true);

    try {
      // ส่งข้อมูล batch mat ไปยัง API
      const response = await fetch(`${API_URL}/api/coldstorages/scan/sap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          mat: primaryBatch,
          batch: secondaryBatch,
        })
      });

      const data = await response.json();

      if (response.ok) {
        onConfirm(data);
      } else {
        console.error('API Error:', data.message);
        // Handle error - you might want to show error message
      }
    } catch (error) {
      console.error('Network Error:', error);
      // Handle network error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason === 'backdropClick') return;
        onClose();
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogContent>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <IoClose />
        </IconButton>

        <Typography variant="h6" sx={{ mb: 3, color: "#545454", textAlign: 'center' }}>
          ตรวจสอบข้อมูลก่อนส่ง
        </Typography>

        <Box sx={{
          backgroundColor: '#f8f9fa',
          borderRadius: 2,
          p: 3,
          mb: 3,
          border: '1px solid #e9ecef'
        }}>
          {/* <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AccessTimeIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              เวลาสแกน
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 3, color: '#495057' }}>
            {currentTime}
          </Typography> */}

          {/* <Divider sx={{ my: 2 }} /> */}

          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
            ข้อมูล Batch Material
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#6c757d', mb: 0.5 }}>
              Raw Material:
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'medium', color: '#212529' }}>
              {primaryBatch}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ color: '#6c757d', mb: 0.5 }}>
              Batch:
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'medium', color: '#212529' }}>
              {secondaryBatch}
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนกดยืนยัน เมื่อยืนยันแล้วข้อมูลจะถูกส่งไปยังระบบ
        </Alert>

        <Box sx={{ display: "flex", justifyContent: "space-between", pt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={onCancel}
            disabled={loading}
            sx={{
              borderColor: "#E74A3B",
              color: "#E74A3B",
              '&:hover': {
                borderColor: "#C0392B",
                backgroundColor: "#ffeaea"
              }
            }}
          >
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckCircleIcon />}
            onClick={handleConfirmData}
            disabled={loading}
            sx={{
              backgroundColor: "#41a2e6",
              '&:hover': {
                backgroundColor: "#3498db"
              }
            }}
          >
            {loading ? "กำลังส่งข้อมูล..." : "ยืนยันและส่งข้อมูล"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const CameraActivationModal = ({
  open,
  onClose,
  onConfirm,
  primaryBatch,
  secondaryBatch,
  setPrimaryBatch,
  setSecondaryBatch,
}) => {
  const theme = useTheme();
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState("");
  const [primaryError, setPrimaryError] = useState(false);
  const [secondaryError, setSecondaryError] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isRawMaterialFocused, setIsRawMaterialFocused] = useState(false);

  // State for Data Verification Modal
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Auto-focus and simulate click on Raw Materials field when modal opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (autocompleteRef.current && inputRef.current) {
          const inputElement = inputRef.current.querySelector('input');
          if (inputElement) {
            inputElement.focus();
            setIsRawMaterialFocused(true);
            // Simulate click to open dropdown
            inputElement.click();
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle scanner input
  useEffect(() => {
    if (!open) return;

    const handleKeyPress = (e) => {
      if (isRawMaterialFocused && e.key === 'Enter') {
        processScannerInput();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [open, isRawMaterialFocused, inputValue]);

  const processScannerInput = () => {
    if (!inputValue) return;

    // Example input: 11M1EL003002|08FFXNCT38|301598575|270.000|KG
    const parts = inputValue.split('|');
    if (parts.length >= 2) {
      const var1 = parts[0].substring(0, 12); // First 12 characters
      const var2 = parts[1].substring(0, 10); // First 10 characters of second part

      console.log('Scanner input processed:', { var1, var2 });

      setPrimaryBatch(var1);
      setSecondaryBatch(var2);
      setInputValue(var1);

      // Simulate the scan success flow
      setScanSuccess(true);
      setTimeout(() => {
        setShowVerificationModal(true);
        setProcessing(false);
        setScanSuccess(false);
      }, 300);
    }
  };

  const fetchRawMaterials = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/rawmat/AllSearch`, { credentials: "include" });
      const data = await response.json();

      if (data.success) {
        const uniqueMaterials = Array.from(
          new Map(data.data.map(item => [item.mat, item])).values()
        );
        setRawMaterials(uniqueMaterials);
      } else {
        console.error("Failed to fetch raw materials:", data.message);
        setError("ไม่สามารถดึงข้อมูลวัตถุดิบได้");
      }
    } catch (err) {
      console.error("Error fetching raw materials:", err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);

        const qrScanner = new QrScanner(
          videoRef.current,
          async (result) => {
            handleScannedData(result.data);
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        qrScannerRef.current = qrScanner;
        qrScanner.start();
      }
    } catch (err) {
      setError("ไม่สามารถเปิดกล้องได้. โปรดตรวจสอบการยอมรับของอุปกรณ์");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
    }
    setCameraActive(false);
  };

  const resetForm = () => {
    setPrimaryBatch("");
    setSecondaryBatch("");
    setError("");
    setPrimaryError(false);
    setSecondaryError(false);
    setScanSuccess(false);
    setProcessing(false);
    setInputValue('');
    setIsRawMaterialFocused(false);
  };

  const handleClose = () => {
    onClose();
    stopCamera();
    resetForm();
  };

  const handleVerificationClose = () => {
    setShowVerificationModal(false);
  };

  const handleVerificationCancel = () => {
    setShowVerificationModal(false);
    // กลับไปที่หน้าเดิมให้แก้ไขข้อมูล
  };

  const handleVerificationConfirm = (apiResponse) => {
    // ปิดทุก modal
    setShowVerificationModal(false);
    handleClose();

    // เรียก onConfirm เพื่อแจ้งให้ parent component ทราบ
    onConfirm(primaryBatch, secondaryBatch, apiResponse);
  };

  const handleScannedData = async (result) => {
    if (processing) return;

    setProcessing(true);

    try {
      const qrParts = result.split("|");

      if (qrParts.length < 2) {
        setError("รูปแบบ QR Code ไม่ถูกต้อง ต้องมีข้อมูล Raw Material และ Batch");
        setProcessing(false);
        return;
      }

      const rawMaterial = qrParts[0].trim();
      const batch = qrParts[1].trim().toUpperCase();

      if (batch.length !== 10) {
        setError(`Batch ต้องมี 10 ตัวอักษร (ได้รับ ${batch.length} ตัวอักษร)`);
        setSecondaryError(true);
        setProcessing(false);
        return;
      }

      setPrimaryBatch(rawMaterial);
      setSecondaryBatch(batch);
      setInputValue(rawMaterial);
      setPrimaryError(false);
      setSecondaryError(false);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/api/checkRawMat?mat=${encodeURIComponent(rawMaterial)}`
        );
        const data = await response.json();

        if (response.ok) {
          setScanSuccess(true);
          setTimeout(() => {
            setShowVerificationModal(true);
            setProcessing(false);
            setScanSuccess(false);
          }, 300);
        } else {
          setPrimaryError(true);
          setError(data.message || "ไม่พบข้อมูลวัตถุดิบในฐานข้อมูล");
          setProcessing(false);
        }
      } catch (err) {
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
        setProcessing(false);
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการประมวลผล QR Code");
      setProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (processing) return;
    setProcessing(true);

    let hasError = false;

    if (!primaryBatch) {
      setPrimaryError(true);
      setError("กรุณากรอกข้อมูล Raw Material");
      hasError = true;
    } else {
      setPrimaryError(false);
    }

    if (!secondaryBatch) {
      setSecondaryError(true);
      setError("กรุณากรอกข้อมูล Batch");
      hasError = true;
    } else if (secondaryBatch.length !== 10) {
      setSecondaryError(true);
      setError("Batch ต้องมี 10 ตัวอักษรเท่านั้น");
      hasError = true;
    } else {
      setSecondaryError(false);
    }

    if (!hasError) {
      try {
        const response = await fetch(
          `${API_URL}/api/checkRawMat?mat=${encodeURIComponent(primaryBatch)}`
        );
        const data = await response.json();

        if (response.ok) {
          // เปิด modal ตรวจสอบข้อมูลแทนการเรียก onConfirm โดยตรง
          setShowVerificationModal(true);
          setProcessing(false);
        } else {
          setPrimaryError(true);
          setError(data.message || "ไม่พบข้อมูลวัตถุดิบในฐานข้อมูล");
          setProcessing(false);
        }
      } catch (err) {
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
        setProcessing(false);
      }
    } else {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (open) {
      startCamera();
      fetchRawMaterials();
      setScanSuccess(false);
    }
    return () => {
      stopCamera();
    };
  }, [open]);

  const isFormValid = primaryBatch && secondaryBatch && secondaryBatch.length === 10;

  return (
    <>
      <Dialog
        open={open}
        onClose={(e, reason) => {
          if (reason === 'backdropClick') return;
          handleClose();
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <IoClose />
          </IconButton>

          <Typography variant="h6" sx={{ mb: 2, color: "#545454" }}>
            สแกน Qr Code เพื่อรับข้อมูลวัตถุดิบ
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {scanSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              สแกน QR Code สำเร็จ! กำลังดำเนินการต่อ...
            </Alert>
          )}

          <Divider />

          <video
            ref={videoRef}
            style={{
              width: "100%",
              marginBottom: theme.spacing(2),
              marginTop: "15px",
              borderRadius: "4px",
              border: scanSuccess ? "2px solid #4CAF50" : "2px solid #f0f0f0"
            }}
            autoPlay
            muted
          />

          <Box>
            <Autocomplete
              ref={autocompleteRef}
              id="raw-material-autocomplete"
              options={rawMaterials}
              fullWidth
              loading={loading}
              value={rawMaterials.find(mat => mat.mat === primaryBatch) || null}
              onChange={(event, newValue) => {
                setPrimaryBatch(newValue ? newValue.mat : '');
                setPrimaryError(false);
                setError("");
              }}
              inputValue={inputValue}
              onInputChange={(event, newInputValue) => {
                setInputValue(newInputValue);
              }}
              getOptionLabel={(option) => `${option.mat}`}
              isOptionEqualToValue={(option, value) => option.mat === value.mat}
              renderInput={(params) => (
                <TextField
                  {...params}
                  ref={inputRef}
                  label="Raw Materials (พร้อมรับข้อมูลจากสแกนเนอร์)"
                  error={primaryError}
                  helperText={primaryError ? (error || "กรุณาเลือก Raw Material") : ""}
                  size="small"
                  margin="normal"
                  required
                  onFocus={() => setIsRawMaterialFocused(true)}
                  onBlur={() => setIsRawMaterialFocused(false)}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        <IoInformationCircle color={theme.palette.info.main} />
                        {params.InputProps.endAdornment}
                      </>
                    ),
                    readOnly: scanSuccess
                  }}
                  sx={{
                    '& label': {
                      color: isRawMaterialFocused ? theme.palette.primary.main : 'inherit',
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: isRawMaterialFocused ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.23)',
                      },
                      '&:hover fieldset': {
                        borderColor: isRawMaterialFocused ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.23)',
                      },
                    },
                  }}
                />
              )}
              loadingText="กำลังโหลดข้อมูล..."
              noOptionsText="ไม่พบข้อมูลวัตถุดิบที่ตรงกัน"
              open={isRawMaterialFocused}
              onOpen={() => setIsRawMaterialFocused(true)}
              onClose={() => setIsRawMaterialFocused(false)}
            />

            <Tooltip title="กรุณากรอกข้อมูล Batch (ต้องกรอก 10 ตัวอักษรเท่านั้น)">
              <TextField
                fullWidth
                label="Batch (ต้องกรอก 10 ตัวอักษร)"
                size="small"
                value={secondaryBatch}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  if (value.length <= 10) {
                    setSecondaryBatch(value);
                    setSecondaryError(false);
                    setError("");
                    setScanSuccess(false);
                  }
                }}
                error={secondaryError}
                helperText={secondaryError ?
                  (secondaryBatch.length === 0 ? "กรุณากรอกข้อมูล Batch" : "Batch ต้องมี 10 ตัวอักษรเท่านั้น")
                  : ""}
                margin="normal"
                required
                InputProps={{
                  endAdornment: <IoInformationCircle color={theme.palette.info.main} />,
                  readOnly: scanSuccess
                }}
                inputProps={{
                  maxLength: 10,
                  pattern: ".{10}",
                  style: { textTransform: 'uppercase' }
                }}
              />
            </Tooltip>

            <Divider sx={{ mt: 1 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between", pt: 3 }}>
              <Button
                variant="contained"
                startIcon={<CancelIcon />}
                style={{ backgroundColor: "#E74A3B", color: "#fff" }}
                onClick={handleClose}
              >
                ยกเลิก
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckCircleIcon />}
                style={{
                  backgroundColor: isFormValid ? "#41a2e6" : "#cccccc",
                  color: "#fff",
                }}
                onClick={handleConfirm}
                disabled={!isFormValid || processing}
              >
                ยืนยัน
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Data Verification Modal */}
      <DataVerificationModal
        open={showVerificationModal}
        onClose={handleVerificationClose}
        onConfirm={handleVerificationConfirm}
        onCancel={handleVerificationCancel}
        primaryBatch={primaryBatch}
        secondaryBatch={secondaryBatch}
      />
    </>
  );
};

export default CameraActivationModal;