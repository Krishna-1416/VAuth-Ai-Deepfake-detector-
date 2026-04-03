import librosa
import numpy as np

def get_audio_score(audio_path: str) -> float:
    """Process audio with MFCC feature extraction and return deepfake score."""
    try:
        # Load audio at 16kHz sample rate
        y, sr = librosa.load(audio_path, sr=16000)
        
        # Extract MFCC features (fast shortcut for deepfake detection)
        # Use 13-20 coefficients
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
        
        # Calculate mean feature across time
        # This is a proxy for audio characteristics.
        # Deepfakes often have more consistent features or artifacts.
        mean_mfcc = np.mean(mfcc)
        
        # Calculate standard deviation - can also indicate synthetic/natural
        # High variability might mean natural, whereas low can mean synthesized.
        std_mfcc = np.std(mfcc)
        
        # Combine mean and std for a heuristic score
        # For hackathon, we'll normalize this value into [0, 1].
        combined_val = (mean_mfcc + std_mfcc) / 100.0  # Heuristic scaling
        
        # Use sigmoid to normalize to [0, 1]
        normalized_score = 1 / (1 + np.exp(-combined_val))
        
        return float(normalized_score)
        
    except Exception as e:
        print(f"Error in audio processing: {e}")
        return 0.5
