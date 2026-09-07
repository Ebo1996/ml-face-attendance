"""
ML package — standalone face-recognition layer.

This package is intentionally separate from the Django app layer
(apps/ml_service/) so that ML code can be developed, tested and
imported independently of Django.

Structure (matches spec):
  ml/
  ├── models/           — cached ONNX model files (auto-downloaded)
  ├── face_detector.py  — SCRFD face detection wrapper
  ├── face_recognizer.py — ArcFace recognition wrapper
  ├── embedding_service.py — end-to-end embed pipeline
  └── matching_service.py  — cosine-similarity matching engine
"""
