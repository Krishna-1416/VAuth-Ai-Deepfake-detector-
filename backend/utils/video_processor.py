import cv2
import random
import tempfile
import os

class VideoProcessor:
    """
    Utility for processing video files and extracting representative frames.
    """
    @staticmethod
    def extract_random_frames(video_path: str, num_frames: int = 3):
        """
        Extracts N random frames from a video file.
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames <= 0:
            raise ValueError("Video has no frames.")

        # Pick random frame indices
        frame_indices = sorted(random.sample(range(total_frames), min(num_frames, total_frames)))
        
        frames = []
        for idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            success, frame = cap.read()
            if success:
                # Convert BGR to RGB (OpenCV default is BGR)
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(frame_rgb)
        
        cap.release()
        return frames

    @staticmethod
    def save_temp_video(file_bytes: bytes):
        """
        Saves uploaded bytes to a temporary file for OpenCV to read.
        """
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
        temp_file.write(file_bytes)
        temp_file.close()
        return temp_file.name

if __name__ == "__main__":
    print("Video Processor utility ready.")
