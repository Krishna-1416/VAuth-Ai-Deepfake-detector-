import tensorflow as tf
from tensorflow.keras.applications.xception import Xception, preprocess_input
from tensorflow.keras.preprocessing import image
import numpy as np
from PIL import Image
import cv2

# Initialize XceptionNet for feature extraction (ImageNet weights)
# Load globally for performance
IMG_SIZE = (224, 224) 

model = Xception(weights='imagenet', include_top=False, pooling='avg')

def get_fourier_score(image_path: str) -> float:
    """Detect frequency artifacts using 2D Fast Fourier Transform."""
    try:
        # Load in grayscale
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return 0.5
        
        # Calculate 2D FFT
        dft = np.fft.fft2(img)
        dft_shift = np.fft.fftshift(dft)
        
        # Magnitude Spectrum
        magnitude_spectrum = 20 * np.log(np.abs(dft_shift) + 1)
        
        # Analyze high-frequency annulus
        h, w = img.shape
        cy, cx = h // 2, w // 2
        
        # Create mask for high frequencies (outer ring)
        y, x = np.ogrid[:h, :w]
        dist_from_center = np.sqrt((x - cx)**2 + (y - cy)**2)
        
        # High pass filter (mask inner low frequencies)
        mask = dist_from_center > (min(h, w) / 4)
        high_freq_vals = magnitude_spectrum[mask]
        
        # Calculate variance of high frequencies. 
        # AI images tend to have "spikes" (checkerboard artifacts), leading to higher variance.
        variance = np.var(high_freq_vals)
        
        # Normalize variance to a 0-1 scale. 
        # Natural images typically have variance < 100 on log spectrum.
        # AI images with checkerboard artifacts can exceed 300.
        score = np.clip(variance / 400.0, 0, 1)
        return float(score)
    except Exception as e:
        print(f"Fourier analysis error: {e}")
        return 0.5

def get_image_score(image_path: str) -> float:
    """Process image and return a hybrid deepfake score (Spatial + Spectral)."""
    try:
        # 1. Spatial Analysis (Xception)
        img = Image.open(image_path).convert('RGB')
        img = img.resize(IMG_SIZE)
        x = image.img_to_array(img)
        x = np.expand_dims(x, axis=0)
        x = preprocess_input(x)
        
        features = model.predict(x)
        spatial_score = np.mean(features)
        spatial_prob = 1 / (1 + np.exp(-spatial_score)) 
        
        # 2. Spectral Analysis (Fourier)
        fourier_prob = get_fourier_score(image_path)
        
        # 3. Ensemble (Weighted Average)
        # Deepfakes often hide in the frequency domain, so we weight it heavily.
        final_score = (0.4 * spatial_prob) + (0.6 * fourier_prob)
        
        return float(final_score)
    except Exception as e:
        print(f"Error in image processing: {e}")
        return 0.5
