import io
import math
import numpy as np
import cv2
import pywt
from PIL import Image

_face_mesh = None

def get_face_mesh():
    global _face_mesh
    if _face_mesh is None:
        try:
            import mediapipe.solutions.face_mesh as mp_face_mesh
            _face_mesh = mp_face_mesh.FaceMesh(
                static_image_mode=True,
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.4,
            )
        except (AttributeError, ImportError, ModuleNotFoundError) as e:
            print(f"[Forensics] MediaPipe solutions not found or incompatible: {e}")
            try:
                import mediapipe as mp
                if hasattr(mp, 'solutions') and hasattr(mp.solutions, 'face_mesh'):
                    _face_mesh = mp.solutions.face_mesh.FaceMesh(
                        static_image_mode=True,
                        max_num_faces=1,
                        refine_landmarks=True,
                        min_detection_confidence=0.4,
                    )
                else:
                    _face_mesh = "DISABLED"
            except Exception as e2:
                _face_mesh = "DISABLED"
    
    return _face_mesh if _face_mesh != "DISABLED" else None

def calculate_ela(cv_img: np.ndarray) -> float:
    try:
        tmp_img = Image.fromarray(cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB))
        out = io.BytesIO()
        tmp_img.save(out, format="JPEG", quality=95)
        resaved = Image.open(io.BytesIO(out.getvalue()))
        diff = np.abs(np.array(tmp_img).astype(np.float32) - np.array(resaved).astype(np.float32))
        std_dev = diff.std()
        score = np.clip((std_dev - 1.5) / 2.0, 0.0, 1.0)
        return float(score)
    except Exception:
        return 0.5

def calculate_lbp(cv_img: np.ndarray) -> float:
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
    return float(np.clip((7.0 - entropy) / 1.2, 0.0, 1.0))

def calculate_srm(cv_img: np.ndarray) -> float:
    try:
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY).astype(np.float32)
        gray = cv2.resize(gray, (512, 512))
        lap = cv2.Laplacian(gray, cv2.CV_32F)
        h_corr = np.corrcoef(lap[100, :256], lap[100, 256:512])[0, 1]
        v_corr = np.corrcoef(lap[:256, 100], lap[256:512, 100])[0, 1]
        bias = max(abs(float(h_corr)), abs(float(v_corr)))
        return float(np.clip((bias - 0.05) / 0.25, 0.0, 1.0))
    except Exception:
        return 0.5

def calculate_fft(cv_img: np.ndarray) -> (float, float):
    try:
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, (512, 512)).astype(np.float32)
        fft  = np.fft.fftshift(np.fft.fft2(gray))
        mag  = np.log1p(np.abs(fft))
        h, w = mag.shape
        cy, cx = h // 2, w // 2
        r_inner, r_outer = int(min(h, w) * 0.25), int(min(h, w) * 0.48)
        Y, X = np.ogrid[:h, :w]
        dist = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2)
        hf_mask = (dist >= r_inner) & (dist <= r_outer)
        hf_energy = mag[hf_mask].mean()
        total_energy = mag.mean()
        fft_score = np.clip((hf_energy / (total_energy + 1e-8) - 0.75) / 0.55, 0.0, 1.0)
        
        radius = min(cy, cx) * 0.9
        polar = cv2.logPolar(mag, (cx, cy), radius, cv2.WARP_FILL_OUTLIERS)
        hf_polar_slice = polar[:, int(polar.shape[1]*0.6):]
        polar_score = np.clip((hf_polar_slice.var() - 0.04) / 0.4, 0.0, 1.0)
        return float(fft_score), float(polar_score)
    except Exception:
        return 0.5, 0.5

def calculate_wavelet(cv_img: np.ndarray) -> float:
    try:
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY).astype(np.float32)
        gray = cv2.resize(gray, (512, 512))
        coeffs = pywt.dwt2(gray, 'db2')
        LL, (LH, HL, HH) = coeffs
        energy_h = np.linalg.norm(LH)
        energy_v = np.linalg.norm(HL)
        energy_d = np.linalg.norm(HH)
        total_hf = (energy_h + energy_v + energy_d) / 512.0
        if total_hf < 10.0: return 0.75
        imbalance = abs(energy_h - energy_v) / (energy_h + energy_v + 1e-6)
        return float(np.clip(imbalance * 5.0, 0.0, 1.0))
    except Exception:
        return 0.5

def calculate_face_alignment(landmarks) -> float:
    try:
        lm = landmarks
        nose_bridge = np.array([lm[168].x, lm[168].y])
        nose_tip    = np.array([lm[1].x, lm[1].y])
        mouth_center = np.array([(lm[0].x + lm[13].x)/2, (lm[0].y + lm[13].y)/2])
        vec_nose  = nose_tip - nose_bridge
        vec_mouth = mouth_center - nose_tip
        cos_theta = np.dot(vec_nose, vec_mouth) / (np.linalg.norm(vec_nose) * np.linalg.norm(vec_mouth) + 1e-6)
        angle_deg = abs(math.degrees(math.acos(np.clip(cos_theta, -1, 1))))
        skew_score = np.clip(angle_deg / 12.0, 0.0, 1.0) 
        eye_y_diff = abs(lm[133].y - lm[362].y)
        eye_skew = np.clip(eye_y_diff / 0.008, 0.0, 1.0) 
        dist_left  = np.linalg.norm(nose_tip - np.array([lm[61].x, lm[61].y]))
        dist_right = np.linalg.norm(nose_tip - np.array([lm[291].x, lm[291].y]))
        philtrum_imb = abs(dist_left - dist_right) / ((dist_left + dist_right) / 2 + 1e-6)
        philtrum_score = np.clip(philtrum_imb * 8.0, 0.0, 1.0)
        return float(max(skew_score, eye_skew, philtrum_score))
    except Exception:
        return 0.5
