"""
Test script to verify InsightFace ML environment setup
"""

import sys
import os
import numpy as np

# Add apps directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps'))

print("=" * 60)
print("Testing InsightFace ML Environment Setup")
print("=" * 60)

# Test 1: Import dependencies
print("\n1. Testing dependency imports...")
try:
    import cv2
    print(f"   ✓ OpenCV version: {cv2.__version__}")
except ImportError as e:
    print(f"   ✗ OpenCV import failed: {e}")
    sys.exit(1)

try:
    import insightface
    print(f"   ✓ InsightFace version: {insightface.__version__}")
except ImportError as e:
    print(f"   ✗ InsightFace import failed: {e}")
    sys.exit(1)

try:
    import onnxruntime as ort
    print(f"   ✓ ONNX Runtime version: {ort.__version__}")
except ImportError as e:
    print(f"   ✗ ONNX Runtime import failed: {e}")
    sys.exit(1)

try:
    import sklearn
    print(f"   ✓ Scikit-learn version: {sklearn.__version__}")
except ImportError as e:
    print(f"   ✗ Scikit-learn import failed: {e}")
    sys.exit(1)

# Test 2: Import custom modules
print("\n2. Testing custom module imports...")
try:
    from ml_service.face_detector import FaceDetector, get_face_detector
    print("   ✓ FaceDetector module imported")
except ImportError as e:
    print(f"   ✗ FaceDetector import failed: {e}")
    sys.exit(1)

try:
    from ml_service.face_recognizer import FaceRecognizer, get_face_recognizer
    print("   ✓ FaceRecognizer module imported")
except ImportError as e:
    print(f"   ✗ FaceRecognizer import failed: {e}")
    sys.exit(1)

try:
    from ml_service.utils.image_utils import (
        load_image_from_bytes,
        resize_image,
        validate_image
    )
    print("   ✓ Image utilities module imported")
except ImportError as e:
    print(f"   ✗ Image utilities import failed: {e}")
    sys.exit(1)

# Test 3: Initialize Face Detector
print("\n3. Testing Face Detector initialization...")
print("   Note: This will download pretrained models on first run (~200MB)")
print("   This may take a few minutes...")

try:
    detector = get_face_detector()
    print("   ✓ Face detector initialized successfully")
except Exception as e:
    print(f"   ✗ Face detector initialization failed: {e}")
    print("   This is expected on first run if models need to be downloaded.")
    print("   The models will be downloaded to ~/.insightface/models/")
    sys.exit(1)

# Test 4: Test with synthetic image
print("\n4. Testing face detection with synthetic image...")
try:
    # Create a test image (640x640 RGB)
    test_image = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)
    
    # Validate image
    is_valid, error = validate_image(test_image)
    if not is_valid:
        print(f"   ✗ Image validation failed: {error}")
    else:
        print("   ✓ Image validation passed")
    
    # Try detection (will not find faces in random noise, but tests the pipeline)
    faces = detector.detect_faces(test_image)
    print(f"   ✓ Face detection executed (found {len(faces)} face(s))")
    print("   Note: No faces expected in random test image")
    
except Exception as e:
    print(f"   ✗ Face detection test failed: {e}")
    sys.exit(1)

# Test 5: Initialize Face Recognizer
print("\n5. Testing Face Recognizer initialization...")
try:
    recognizer = get_face_recognizer(similarity_threshold=0.6)
    print("   ✓ Face recognizer initialized successfully")
except Exception as e:
    print(f"   ✗ Face recognizer initialization failed: {e}")
    sys.exit(1)

# Test 6: Test similarity computation
print("\n6. Testing face embedding similarity...")
try:
    # Create synthetic embeddings (512-d vectors)
    embedding1 = np.random.rand(512)
    embedding2 = np.random.rand(512)
    embedding3 = embedding1 + np.random.rand(512) * 0.1  # Similar to embedding1
    
    # Test similarity computation
    similarity_different = recognizer.compute_similarity(embedding1, embedding2)
    similarity_similar = recognizer.compute_similarity(embedding1, embedding3)
    
    print(f"   ✓ Similarity (different): {similarity_different:.4f}")
    print(f"   ✓ Similarity (similar): {similarity_similar:.4f}")
    
    # Test verification
    is_match, score = recognizer.verify(embedding1, embedding3)
    print(f"   ✓ Verification test: match={is_match}, score={score:.4f}")
    
except Exception as e:
    print(f"   ✗ Similarity test failed: {e}")
    sys.exit(1)

# Test 7: Test identification (1:N matching)
print("\n7. Testing face identification (1:N matching)...")
try:
    query_embedding = np.random.rand(512)
    known_embeddings = [np.random.rand(512) for _ in range(5)]
    known_ids = [f"user_{i}" for i in range(5)]
    
    # Add query embedding to known (should match itself)
    known_embeddings.append(query_embedding)
    known_ids.append("query_user")
    
    # Test identification
    matches = recognizer.identify(query_embedding, known_embeddings, known_ids, return_top_k=3)
    
    print(f"   ✓ Identification test completed: found {len(matches)} match(es)")
    if matches:
        best_match_id, best_score = matches[0]
        print(f"   ✓ Best match: {best_match_id} (score={best_score:.4f})")
    
except Exception as e:
    print(f"   ✗ Identification test failed: {e}")
    sys.exit(1)

# Summary
print("\n" + "=" * 60)
print("✓ All tests passed! InsightFace ML environment is ready.")
print("=" * 60)
print("\nNext steps:")
print("- Models are cached in ~/.insightface/models/")
print("- Ready for Phase 10: Face Enrollment/Registration")
print("- Ready for Phase 11: Face Matching Engine")
print("=" * 60)
