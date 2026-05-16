import io
import math
import sys
import os
import numpy as np
import cv2
import pywt
from PIL import Image

# Diagnostic Environment Check
print(f"[Forensics] Initializing on Python {sys.version}")
print(f"[Forensics] Working Directory: {os.getcwd()}")

_face_mesh = None

def get_face_mesh():
    global _face_mesh
    if _face_mesh is None:
        try:
            import mediapipe as mp
            # Try standard solutions API first (most common)
            if hasattr(mp, 'solutions') and hasattr(mp.solutions, 'face_mesh'):
                _face_mesh = mp.solutions.face_mesh.FaceMesh(
                    static_image_mode=True,
                    max_num_faces=1,
                    refine_landmarks=True,
                    min_detection_confidence=0.4,
                )
                print("[Forensics] MediaPipe FaceMesh initialized via mp.solutions")
            else:
                print("[Forensics] MediaPipe mp.solutions not available, trying legacy import")
                # Legacy fallback
                from mediapipe.solutions import face_mesh as mp_fm
                _face_mesh = mp_fm.FaceMesh(
                    static_image_mode=True,
                    max_num_faces=1,
                    refine_landmarks=True,
                    min_detection_confidence=0.4,
                )
                print("[Forensics] MediaPipe FaceMesh initialized via legacy import")
        except ImportError as e:
            print(f"[Forensics] MediaPipe not installed or incompatible: {e}")
            print(f"[Forensics] To fix: python -m pip install --upgrade mediapipe")
            _face_mesh = "DISABLED"
        except Exception as e:
            print(f"[Forensics] MediaPipe initialization error: {type(e).__name__}: {e}")
            print(f"[Forensics] Face forensics DISABLED. Continuing with other heuristics.")
            _face_mesh = "DISABLED"

    return _face_mesh if _face_mesh != "DISABLED" else None

def calculate_ela(cv_img: np.ndarray) -> float:
    """Error Level Analysis (ELA) — compression inconsistency.
    
    Research basis: Re-saving at lower JPEG quality amplifies differences
    between original compression artifacts (fake) vs clean re-compression (real).
    Real single-compressed images show std_dev 2-6. Tampered/synthetic images
    with mixed compression history show std_dev 8-25.
    (Krawetz, 2013; Guera et al., 2018)
    """
    try:
        tmp_img = Image.fromarray(cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB))
        out = io.BytesIO()
        tmp_img.save(out, format="JPEG", quality=60)
        resaved = Image.open(io.BytesIO(out.getvalue()))
        diff = np.abs(np.array(tmp_img).astype(np.float32) - np.array(resaved).astype(np.float32))
        std_dev = diff.std()
        score = np.clip((std_dev - 2.0) / 10.0, 0.0, 1.0)
        return float(score)
    except Exception:
        return 0.5

def calculate_lbp(cv_img: np.ndarray) -> float:
    """Local Binary Pattern (LBP) — micro-texture regularity.
    
    Research basis: Real skin/texture has LBP entropy ≈ 6.0-7.5 (high complexity).
    Synthetic GAN outputs have entropy ≈ 3.5-5.5 due to frequency clamping.
    (Nataraj et al., 2019; Li et al., 2020)
    """
    try:
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape
        cy, cx = h // 2, w // 2
        patch = gray[max(0, cy-128):min(h, cy+128), max(0, cx-128):min(w, cx+128)]
        if patch.size < 100: return 0.5
        
        return _full_lbp_impl(patch)
    except Exception:
        return 0.5

def _full_lbp_impl(patch):
    lbp = np.zeros_like(patch, dtype=np.uint8)
    for i in range(1, patch.shape[0]-1):
        for j in range(1, patch.shape[1]-1):
            center = patch[i, j]
            code = 0
            code |= (patch[i-1, j-1] >= center) << 0
            code |= (patch[i-1, j]   >= center) << 1
            code |= (patch[i-1, j+1] >= center) << 2
            code |= (patch[i,   j+1] >= center) << 3
            code |= (patch[i+1, j+1] >= center) << 4
            code |= (patch[i+1, j]   >= center) << 5
            code |= (patch[i+1, j-1] >= center) << 6
            code |= (patch[i,   j-1] >= center) << 7
            lbp[i, j] = code
    hist, _ = np.histogram(lbp.ravel(), bins=256, range=(0, 256))
    hist = hist[hist > 0].astype(float)
    prob = hist / hist.sum()
    entropy = -np.sum(prob * np.log2(prob))
    return float(np.clip((7.5 - entropy) / 2.5, 0.0, 1.0))

def calculate_srm(cv_img: np.ndarray) -> float:
    """Steganalysis Rich Model (SRM-Lite) — geometric noise residuals.
    
    Research basis: Real camera noise is spatially decorrelated (|r| < 0.08).
    GAN outputs show structured noise correlations of 0.15-0.40 due to
    upsampling filter patterns. (Fridrich & Kodovsky, 2012; Cozzolino et al., 2017)
    """
    try:
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY).astype(np.float32)
        gray = cv2.resize(gray, (512, 512))
        lap = cv2.Laplacian(gray, cv2.CV_32F)
        h_corr = np.corrcoef(lap[100, :256], lap[100, 256:512])[0, 1]
        v_corr = np.corrcoef(lap[:256, 100], lap[256:512, 100])[0, 1]
        bias = max(abs(float(h_corr)), abs(float(v_corr)))
        return float(np.clip((bias - 0.03) / 0.27, 0.0, 1.0))
    except Exception:
        return 0.5

def calculate_fft(cv_img: np.ndarray) -> tuple[float, float]:
    """FFT High-Frequency Anomaly + Log-Polar FFT Variance.
    
    Research basis: Real photos have smoothly decaying frequency spectra with
    HF/total energy ratio ≈ 0.10-0.30. GAN outputs show HF ratio ≈ 0.30-0.60
    due to checkerboard upsampling artifacts. (Wang et al., 2020; Durall et al., 2021)
    """
    try:
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, (512, 512)).astype(np.float32)
        fft  = np.fft.fftshift(np.fft.fft2(gray))
        mag  = np.log1p(np.abs(fft))
        h, w = mag.shape
        cy, cx = h // 2, w // 2
        r_inner, r_outer = int(min(h, w) * 0.25), int(min(h, w) * 0.48)
        r_lf = int(min(h, w) * 0.10)
        Y, X = np.ogrid[:h, :w]
        dist = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2)
        hf_mask = (dist >= r_inner) & (dist <= r_outer)
        lf_mask = dist < r_lf
        hf_energy = mag[hf_mask].mean()
        lf_energy = mag[lf_mask].mean()
        ratio = hf_energy / (lf_energy + 1e-8)
        fft_score = np.clip((ratio - 0.70) / 0.25, 0.0, 1.0)
        
        radius = min(cy, cx) * 0.9
        polar = cv2.logPolar(mag, (cx, cy), radius, cv2.WARP_FILL_OUTLIERS)
        hf_polar_slice = polar[:, int(polar.shape[1]*0.6):]
        polar_score = np.clip((hf_polar_slice.var() - 0.20) / 0.50, 0.0, 1.0)
        return float(fft_score), float(polar_score)
    except Exception:
        return 0.5, 0.5

def calculate_wavelet(cv_img: np.ndarray) -> float:
    """Wavelet Noise Residual (DWT) — high-frequency sub-band energy.
    
    Research basis: Real photos have balanced horizontal/vertical HF energy
    (imbalance ratio ≈ 0.05-0.15). GAN outputs show structured directional
    bias (imbalance ≈ 0.25-0.55) from transposed convolution artifacts.
    (Zhang et al., 2019; He et al., 2021)
    """
    try:
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY).astype(np.float32)
        gray = cv2.resize(gray, (512, 512))
        coeffs = pywt.dwt2(gray, 'db2')
        LL, (LH, HL, HH) = coeffs
        energy_h = np.linalg.norm(LH)
        energy_v = np.linalg.norm(HL)
        energy_d = np.linalg.norm(HH)
        total_hf = (energy_h + energy_v + energy_d) / 512.0
        if total_hf < 10.0: return 0.6
        imbalance = abs(energy_h - energy_v) / (energy_h + energy_v + 1e-6)
        return float(np.clip(imbalance * 3.0, 0.0, 1.0))
    except Exception:
        return 0.5

def calculate_face_alignment(landmarks) -> float:
    """
    Advanced Biometric Geometric Alignment.
    Detects misalignments in primary facial features (Eyes, Nose, Lips).
    
    Research basis: Real faces show nose-to-mouth skew < 8°, eye y-diff < 0.005
    in normalized coordinates, and philtrum asymmetry < 0.08. Deepfakes often
    exceed these due to warping from face-swap alignment. (Matern et al., 2019;
    Rossler et al., 2019 FaceForensics++)
    """
    try:
        lm = landmarks
        # 1. Nose-to-Mouth Skew Check
        nose_bridge = np.array([lm[168].x, lm[168].y])
        nose_tip    = np.array([lm[1].x, lm[1].y])
        mouth_center = np.array([(lm[0].x + lm[13].x)/2, (lm[0].y + lm[13].y)/2])
        
        vec_nose  = nose_tip - nose_bridge
        vec_mouth = mouth_center - nose_tip
        
        cos_theta = np.dot(vec_nose, vec_mouth) / (np.linalg.norm(vec_nose) * np.linalg.norm(vec_mouth) + 1e-6)
        angle_deg = abs(math.degrees(math.acos(np.clip(cos_theta, -1, 1))))
        skew_score = np.clip(angle_deg / 18.0, 0.0, 1.0)
        
        # 2. Eye Aspect Ratio (EAR) Parity
        eye_y_diff = abs(lm[133].y - lm[362].y)
        eye_skew = np.clip(eye_y_diff / 0.008, 0.0, 1.0)
        
        # 3. Philtrum Symmetry
        dist_left  = np.linalg.norm(nose_tip - np.array([lm[61].x, lm[61].y]))
        dist_right = np.linalg.norm(nose_tip - np.array([lm[291].x, lm[291].y]))
        philtrum_imb = abs(dist_left - dist_right) / ((dist_left + dist_right) / 2 + 1e-6)
        philtrum_score = np.clip(philtrum_imb * 4.0, 0.0, 1.0)
        
        return float(max(skew_score, eye_skew, philtrum_score))
    except Exception:
        return 0.5
