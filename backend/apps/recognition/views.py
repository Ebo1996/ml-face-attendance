"""
Recognition API Views

Provides the canonical endpoints specified in the API contract:
  POST /api/face/register/   — employee enrolls their own face
  POST /api/face/recognize/  — identify a person and mark attendance
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
import logging
from config.throttles import FaceRateThrottle

logger = logging.getLogger(__name__)


# ── POST /api/face/register/ ──────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([FaceRateThrottle])
def register_face(request):
    """
    Employee registers (enrolls) their own face.

    Body:
        image_data  : base64-encoded image (JPEG / PNG)
        is_primary  : bool   (optional, default False)
        notes       : str    (optional)

    Returns:
        { success, message, embedding_id, quality_score }
    """
    image_data = request.data.get('image_data')
    if not image_data:
        return Response({'success': False, 'error': 'image_data is required'},
                        status=status.HTTP_400_BAD_REQUEST)

    is_primary          = request.data.get('is_primary', False)
    registration_source = request.data.get('registration_source', 'WEBCAM_CAPTURE')
    notes               = request.data.get('notes', '')

    # Delegate to the ml_service enrollment service
    from apps.ml_service.enrollment_service import get_enrollment_service
    svc = get_enrollment_service()

    # 1. Validate
    is_valid, face_data, err = svc.validate_face_image(image_data)
    if not is_valid:
        return Response({'success': False, 'error': err},
                        status=status.HTTP_400_BAD_REQUEST)

    # 2. Enroll
    success, embedding_obj, err = svc.enroll_face(
        user=request.user,
        face_data=face_data,
        is_primary=is_primary,
        registration_source=registration_source,
        notes=notes,
    )

    if not success:
        return Response({'success': False, 'error': err},
                        status=status.HTTP_400_BAD_REQUEST)

    logger.info(f"Face registered for user {request.user.email} "
                f"(embedding_id={embedding_obj.id})")

    return Response({
        'success': True,
        'message': 'Face registered successfully',
        'embedding_id': embedding_obj.id,
        'quality_score': embedding_obj.quality_score,
        'is_primary': embedding_obj.is_primary,
    }, status=status.HTTP_201_CREATED)


# ── POST /api/face/recognize/ ─────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([FaceRateThrottle])
def recognize_face(request):
    """
    Identify a person from a photo and, if found, record their attendance.

    Caller context:
      - Employee  → can only clock themselves in/out; the recognized
                    user_id MUST match the authenticated user.
      - Admin     → can identify any enrolled employee and mark their
                    attendance directly.

    Body:
        image_data  : base64-encoded image
        action      : 'CHECK_IN' | 'CHECK_OUT'  (default CHECK_IN)
        top_k       : int  (admin only, default 1)

    Returns:
        {
          recognized   : bool,
          employee_id  : str | null,
          employee_name: str | null,
          confidence   : float | null,
          action       : str,
          attendance   : { … } | null,
          message      : str,
          error        : str | null
        }
    """
    image_data = request.data.get('image_data')
    if not image_data:
        return Response({'recognized': False, 'error': 'image_data is required'},
                        status=status.HTTP_400_BAD_REQUEST)

    action = request.data.get('action', 'CHECK_IN').upper()
    if action not in ('CHECK_IN', 'CHECK_OUT'):
        action = 'CHECK_IN'

    is_admin = (request.user.role == 'ADMIN')

    from apps.ml_service.matching_service import get_matching_service
    from apps.attendance.service import get_attendance_service
    from django.contrib.auth import get_user_model
    User = get_user_model()

    matching_svc   = get_matching_service()
    attendance_svc = get_attendance_service()

    # ── Employee path: 1:1 verify against themselves ──────────────────
    if not is_admin:
        result = matching_svc.verify(image_data, request.user)

        if not result['success']:
            return _recognition_error(result.get('error', 'Face verification failed'))

        if not result['is_match']:
            return Response({
                'recognized': False,
                'employee_id': None,
                'employee_name': None,
                'confidence': result['similarity'],
                'action': action,
                'attendance': None,
                'message': 'Face not recognised. Please try again with a clearer photo.',
                'error': None,
            })

        recognized_user = request.user

    # ── Admin path: 1:N identify ──────────────────────────────────────
    else:
        top_k  = max(1, min(int(request.data.get('top_k', 1)), 10))
        result = matching_svc.identify(image_data, top_k=top_k)

        if not result['success']:
            return _recognition_error(result.get('error', 'Identification failed'))

        if not result['identified'] or not result['top_match']:
            return Response({
                'recognized': False,
                'employee_id': None,
                'employee_name': None,
                'confidence': None,
                'action': action,
                'attendance': None,
                'message': 'No matching employee found.',
                'error': None,
            })

        try:
            recognized_user = User.objects.get(pk=result['top_match']['user_id'],
                                               is_active=True)
        except User.DoesNotExist:
            return _recognition_error('Matched user not found or is inactive.')

    # ── Mark attendance ────────────────────────────────────────────────
    confidence = result.get('similarity') or \
                 (result.get('top_match') or {}).get('similarity')

    if action == 'CHECK_IN':
        att_result = attendance_svc.check_in_without_face(recognized_user)
    else:
        att_result = attendance_svc.check_out_without_face(recognized_user)

    full_name = (
        f"{recognized_user.first_name} {recognized_user.last_name}".strip()
        or recognized_user.email
    )

    return Response({
        'recognized':    True,
        'employee_id':   str(recognized_user.pk),
        'employee_name': full_name,
        'employee_email': recognized_user.email,
        'confidence':    round(float(confidence), 4) if confidence else None,
        'confidence_level': result.get('confidence_level') or
                            (result.get('top_match') or {}).get('confidence_level'),
        'action':        action,
        'attendance':    att_result.get('attendance'),
        'message':       att_result.get('message', 'Attendance recorded'),
        'error':         None if att_result.get('success') else att_result.get('error'),
    })


def _recognition_error(msg: str):
    return Response({
        'recognized': False,
        'employee_id': None,
        'employee_name': None,
        'confidence': None,
        'action': None,
        'attendance': None,
        'message': msg,
        'error': msg,
    }, status=status.HTTP_400_BAD_REQUEST)
