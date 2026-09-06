"""
Image processing utility functions
"""

import cv2
import numpy as np
import base64
from typing import Tuple, Optional
from PIL import Image
import io
import logging

logger = logging.getLogger(__name__)


def load_image_from_path(image_path: str) -> np.ndarray:
    """
    Load image from file path.
    
    Args:
        image_path: Path to image file
        
    Returns:
        Image as numpy array (BGR format)
    """
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Failed to load image from {image_path}")
    return image


def load_image_from_bytes(image_bytes: bytes) -> np.ndarray:
    """
    Load image from bytes.
    
    Args:
        image_bytes: Image data as bytes
        
    Returns:
        Image as numpy array (BGR format)
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Failed to decode image from bytes")
    return image


def load_image_from_base64(base64_string: str) -> np.ndarray:
    """
    Load image from base64 encoded string.
    
    Args:
        base64_string: Base64 encoded image string
        
    Returns:
        Image as numpy array (BGR format)
    """
    # Remove data URL prefix if present
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    image_bytes = base64.b64decode(base64_string)
    return load_image_from_bytes(image_bytes)


def save_image(image: np.ndarray, output_path: str) -> bool:
    """
    Save image to file.
    
    Args:
        image: Image as numpy array
        output_path: Output file path
        
    Returns:
        True if successful
    """
    success = cv2.imwrite(output_path, image)
    if not success:
        logger.error(f"Failed to save image to {output_path}")
    return success


def image_to_base64(image: np.ndarray, format: str = 'JPEG') -> str:
    """
    Convert image to base64 string.
    
    Args:
        image: Image as numpy array (BGR format)
        format: Output format ('JPEG' or 'PNG')
        
    Returns:
        Base64 encoded string
    """
    # Convert BGR to RGB for PIL
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(image_rgb)
    
    # Save to bytes buffer
    buffer = io.BytesIO()
    pil_image.save(buffer, format=format)
    buffer.seek(0)
    
    # Encode to base64
    base64_string = base64.b64encode(buffer.read()).decode('utf-8')
    return f"data:image/{format.lower()};base64,{base64_string}"


def resize_image(
    image: np.ndarray,
    target_size: Optional[Tuple[int, int]] = None,
    max_size: Optional[int] = None
) -> np.ndarray:
    """
    Resize image while maintaining aspect ratio.
    
    Args:
        image: Input image
        target_size: Target (width, height), or None
        max_size: Maximum dimension (width or height), or None
        
    Returns:
        Resized image
    """
    if target_size is not None:
        return cv2.resize(image, target_size, interpolation=cv2.INTER_AREA)
    
    if max_size is not None:
        height, width = image.shape[:2]
        if max(height, width) > max_size:
            if height > width:
                new_height = max_size
                new_width = int(width * (max_size / height))
            else:
                new_width = max_size
                new_height = int(height * (max_size / width))
            return cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
    
    return image


def crop_face(image: np.ndarray, bbox: list, margin: float = 0.2) -> np.ndarray:
    """
    Crop face from image with margin.
    
    Args:
        image: Input image
        bbox: Bounding box [x1, y1, x2, y2]
        margin: Margin to add around face (as fraction of face size)
        
    Returns:
        Cropped face image
    """
    x1, y1, x2, y2 = map(int, bbox)
    
    # Add margin
    width = x2 - x1
    height = y2 - y1
    margin_x = int(width * margin)
    margin_y = int(height * margin)
    
    # Expand bbox with margin
    x1 = max(0, x1 - margin_x)
    y1 = max(0, y1 - margin_y)
    x2 = min(image.shape[1], x2 + margin_x)
    y2 = min(image.shape[0], y2 + margin_y)
    
    # Crop
    face = image[y1:y2, x1:x2]
    return face


def normalize_image(image: np.ndarray) -> np.ndarray:
    """
    Normalize image to [0, 1] range.
    
    Args:
        image: Input image (0-255)
        
    Returns:
        Normalized image (0-1)
    """
    return image.astype(np.float32) / 255.0


def denormalize_image(image: np.ndarray) -> np.ndarray:
    """
    Denormalize image from [0, 1] to [0, 255].
    
    Args:
        image: Normalized image (0-1)
        
    Returns:
        Image in [0, 255] range
    """
    return (image * 255).astype(np.uint8)


def enhance_image(image: np.ndarray) -> np.ndarray:
    """
    Enhance image quality (contrast, brightness, sharpness).
    
    Args:
        image: Input image
        
    Returns:
        Enhanced image
    """
    # Convert to LAB color space
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    
    # Merge channels
    enhanced_lab = cv2.merge([l, a, b])
    enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
    
    return enhanced


def validate_image(image: np.ndarray, min_size: int = 112) -> Tuple[bool, Optional[str]]:
    """
    Validate image for face detection.
    
    Args:
        image: Input image
        min_size: Minimum image dimension
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if image is None:
        return False, "Image is None"
    
    if len(image.shape) not in [2, 3]:
        return False, "Invalid image shape"
    
    height, width = image.shape[:2]
    
    if height < min_size or width < min_size:
        return False, f"Image too small ({width}x{height}), minimum is {min_size}x{min_size}"
    
    if len(image.shape) == 3 and image.shape[2] not in [1, 3, 4]:
        return False, f"Invalid number of channels: {image.shape[2]}"
    
    return True, None


def get_image_info(image: np.ndarray) -> dict:
    """
    Get image information.
    
    Args:
        image: Input image
        
    Returns:
        Dictionary with image info
    """
    info = {
        'shape': image.shape,
        'dtype': str(image.dtype),
        'size_bytes': image.nbytes,
    }
    
    if len(image.shape) >= 2:
        info['height'] = image.shape[0]
        info['width'] = image.shape[1]
    
    if len(image.shape) == 3:
        info['channels'] = image.shape[2]
    
    return info
