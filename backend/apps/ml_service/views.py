"""
API Views for Face Enrollment
"""

from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction

from .models import FaceEmbedding, FaceRegistrationSession
from .serializers import (
    FaceEmbeddingSerializer,
    FaceEnrollmentRequestSerializer,
    FaceEnrollmentResponseSerializer,
    FaceValidationRequestSerializer,
    FaceValidationResponseSerializer,
    EnrollmentStatsSerializer,
    UpdatePrimaryEmbeddingSerializer,
    FaceRegistrationSessionSerializer,
)
from .enrollment_service import get_enrollment_service

import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_face_api(request):
    """
    Validate a face image without enrolling it.
    
    POST /api/face/validate/
    Body: { "image_data": "base64..." }
    
    Returns validation result with quality metrics.
    """
    serializer = FaceValidationRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {'error': 'Invalid request data', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    image_data = serializer.validated_data['image_data']
    
    # Validate face
    enrollment_service = get_enrollment_service()
    is_valid, face_data, error_message = enrollment_service.validate_face_image(image_data)
    
    if is_valid:
        response_data = {
            'is_valid': True,
            'quality_score': face_data['quality_score'],
            'detection_confidence': face_data['detection_confidence'],
            'estimated_age': face_data.get('estimated_age'),
            'gender': face_data.get('gender'),
            'message': 'Face validation successful'
        }
    else:
        response_data = {
            'is_valid': False,
            'error': error_message
        }
    
    response_serializer = FaceValidationResponseSerializer(response_data)
    return Response(response_serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def enroll_face_api(request):
    """
    Enroll a new face for the authenticated user.
    
    POST /api/face/enroll/
    Body: {
        "image_data": "base64...",
        "is_primary": false,
        "registration_source": "WEB_UPLOAD",
        "notes": "Optional notes"
    }
    
    Returns enrollment result with embedding info.
    """
    serializer = FaceEnrollmentRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {'error': 'Invalid request data', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    image_data = serializer.validated_data['image_data']
    is_primary = serializer.validated_data.get('is_primary', False)
    registration_source = serializer.validated_data.get('registration_source', 'WEB_UPLOAD')
    notes = serializer.validated_data.get('notes', '')
    
    # Create registration session
    session = FaceRegistrationSession.objects.create(
        user=request.user,
        session_type='INITIAL',
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        ip_address=request.META.get('REMOTE_ADDR'),
    )
    
    try:
        # Validate face
        enrollment_service = get_enrollment_service()
        is_valid, face_data, error_message = enrollment_service.validate_face_image(image_data)
        
        session.attempts_count += 1
        
        if not is_valid:
            session.successful = False
            session.failure_reason = error_message
            session.completed_at = timezone.now()
            session.save()
            
            return Response(
                {
                    'success': False,
                    'error': error_message
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Enroll face
        success, face_embedding, error_message = enrollment_service.enroll_face(
            user=request.user,
            face_data=face_data,
            is_primary=is_primary,
            registration_source=registration_source,
            notes=notes
        )
        
        if not success:
            session.successful = False
            session.failure_reason = error_message
            session.completed_at = timezone.now()
            session.save()
            
            return Response(
                {
                    'success': False,
                    'error': error_message
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Success
        session.successful = True
        session.completed_at = timezone.now()
        session.save()
        
        embedding_serializer = FaceEmbeddingSerializer(face_embedding)
        response_data = {
            'success': True,
            'message': 'Face enrolled successfully',
            'embedding': embedding_serializer.data
        }
        
        response_serializer = FaceEnrollmentResponseSerializer(response_data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Face enrollment failed: {e}", exc_info=True)
        session.successful = False
        session.failure_reason = str(e)
        session.completed_at = timezone.now()
        session.save()
        
        # Return the actual error message for debugging
        return Response(
            {
                'success': False,
                'error': f'Enrollment error: {str(e)}'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_my_embeddings_api(request):
    """
    List all face embeddings for the authenticated user.
    
    GET /api/face/my-embeddings/
    
    Returns list of embeddings.
    """
    embeddings = FaceEmbedding.objects.filter(user=request.user).order_by('-is_primary', '-created_at')
    serializer = FaceEmbeddingSerializer(embeddings, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def enrollment_stats_api(request):
    """
    Get enrollment statistics for the authenticated user.
    
    GET /api/face/enrollment-stats/
    
    Returns enrollment statistics.
    """
    enrollment_service = get_enrollment_service()
    stats = enrollment_service.get_enrollment_stats(request.user)
    
    serializer = EnrollmentStatsSerializer(stats)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_primary_embedding_api(request):
    """
    Update which embedding is primary for the user.
    
    POST /api/face/set-primary/
    Body: { "embedding_id": "..." }
    
    Returns success message.
    """
    serializer = UpdatePrimaryEmbeddingSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {'error': 'Invalid request data', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    embedding_id = serializer.validated_data['embedding_id']
    
    enrollment_service = get_enrollment_service()
    success, error_message = enrollment_service.update_primary_embedding(
        request.user,
        embedding_id
    )
    
    if success:
        return Response({'message': 'Primary embedding updated successfully'})
    else:
        return Response(
            {'error': error_message},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_embedding_api(request, embedding_id):
    """
    Delete (deactivate) a face embedding.
    
    DELETE /api/face/embeddings/{embedding_id}/
    
    Returns success message.
    """
    enrollment_service = get_enrollment_service()
    success, error_message = enrollment_service.delete_embedding(
        request.user,
        embedding_id
    )
    
    if success:
        return Response({'message': 'Embedding deleted successfully'})
    else:
        return Response(
            {'error': error_message},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_registration_sessions_api(request):
    """
    List registration sessions for the authenticated user.
    
    GET /api/face/registration-sessions/
    
    Returns list of registration sessions.
    """
    sessions = FaceRegistrationSession.objects.filter(user=request.user).order_by('-started_at')[:10]
    serializer = FaceRegistrationSessionSerializer(sessions, many=True)
    return Response(serializer.data)


# =========================================================
# Face Matching Views  (Phase 11)
# =========================================================

from .matching_service import get_matching_service


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_face_api(request):
    """
    1:1 Verification — does the submitted photo match the authenticated user?

    POST /api/face/verify/
    Body: { "image_data": "data:image/jpeg;base64,..." }

    Returns match result with similarity score and confidence level.
    """
    image_data = request.data.get('image_data')
    if not image_data:
        return Response(
            {'error': 'image_data is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    matching_service = get_matching_service()
    result = matching_service.verify(image_data, request.user)

    http_status = status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST
    return Response(result, status=http_status)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def identify_face_api(request):
    """
    1:N Identification — who is this person among all enrolled users?
    Only admins can run identification against all employees.

    POST /api/face/identify/
    Body: { "image_data": "...", "top_k": 3 }

    Returns ranked list of matching users.
    """
    # Require ADMIN role for system-wide identification
    if request.user.role != 'ADMIN':
        return Response(
            {'error': 'Admin access required for face identification'},
            status=status.HTTP_403_FORBIDDEN
        )

    image_data = request.data.get('image_data')
    if not image_data:
        return Response(
            {'error': 'image_data is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    top_k = int(request.data.get('top_k', 3))
    top_k = max(1, min(top_k, 10))  # clamp 1–10

    matching_service = get_matching_service()
    result = matching_service.identify(image_data, top_k=top_k)

    http_status = status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST
    return Response(result, status=http_status)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_against_user_api(request, user_id):
    """
    Admin: Verify a photo against a specific employee (not the caller).

    POST /api/face/verify/<user_id>/
    Body: { "image_data": "..." }
    """
    if request.user.role != 'ADMIN':
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    image_data = request.data.get('image_data')
    if not image_data:
        return Response(
            {'error': 'image_data is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        target_user = User.objects.get(pk=user_id, is_active=True)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    matching_service = get_matching_service()
    result = matching_service.verify(image_data, target_user)

    http_status = status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST
    return Response(result, status=http_status)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invalidate_cache_api(request):
    """
    Admin: Flush the embedding cache (or a single user's entry).

    POST /api/face/cache/invalidate/
    Body: { "user_id": "..." }   (optional)
    """
    if request.user.role != 'ADMIN':
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    user_id = request.data.get('user_id')
    matching_service = get_matching_service()
    matching_service.invalidate_cache(user_id=user_id)

    msg = (
        f"Cache invalidated for user {user_id}"
        if user_id
        else "Entire embedding cache flushed"
    )
    return Response({'message': msg})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cache_stats_api(request):
    """
    Admin: Get embedding cache statistics.

    GET /api/face/cache/stats/
    """
    if request.user.role != 'ADMIN':
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    matching_service = get_matching_service()
    return Response(matching_service.get_cache_stats())
