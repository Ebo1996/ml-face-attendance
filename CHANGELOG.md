# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-09-07

### Added

#### Core Features
- Initial release of Face Recognition Attendance System
- Real-time face recognition using InsightFace buffalo_l (ArcFace ResNet-50)
- 1:N face identification with similarity scoring
- Automatic attendance marking (check-in/check-out)
- JWT-based authentication with access and refresh tokens
- Role-based access control (Admin and Employee roles)

#### User Management
- Complete employee CRUD operations
- Profile management with avatar upload
- Department and position tracking
- Employee search and filtering
- Password change functionality

#### Attendance System
- Face-based check-in and check-out
- Manual attendance override by admins
- Attendance status (Present, Late, Half-Day, Absent, On Leave)
- Work hours calculation
- Attendance history with date range filtering

#### Dashboards
- Admin dashboard with company-wide statistics
- Employee dashboard with personal attendance data
- 14-day attendance trends visualization
- Monthly attendance breakdown
- Real-time status updates

#### Face Recognition
- Multi-angle face enrollment via webcam
- Face quality validation
- Duplicate detection
- 512-dimensional embedding storage
- Primary face selection

#### Reporting
- CSV export for personal attendance
- CSV export for company-wide attendance (admin only)
- Date range filtering
- Status-based filtering
- Employee-specific reports

#### Authentication
- Email and password registration/login
- Google OAuth integration ("Continue with Google")
- Automatic account creation via OAuth
- Token refresh mechanism
- Secure logout with token blacklisting

#### UI/UX
- Modern, responsive design with Tailwind CSS
- Gradient backgrounds and smooth animations
- Professional card layouts
- Mobile-first responsive design
- Loading states and error handling
- Toast notifications

#### Security
- Rate limiting (10 req/min for auth, 20 req/min for face endpoints)
- CORS protection
- Input validation and sanitization
- Secure password hashing
- HTTPS enforcement in production
- File upload validation (size and type)

#### Documentation
- Comprehensive README with installation guide
- API documentation for all endpoints
- ML architecture documentation
- Security policy documentation
- Deployment guide
- Google OAuth setup guide

#### Testing
- 58 backend tests (Django TestCase)
- 85 frontend tests (Vitest)
- Unit tests for models, serializers, views
- Integration tests for API endpoints
- Service layer tests

### Technical Details
- **Backend**: Django 5.2, Django REST Framework 3.14, MongoDB Atlas
- **Frontend**: React 18, TypeScript 5.2, Vite 5.1, Tailwind CSS 3.4
- **ML**: InsightFace 0.7.3+, ONNX Runtime 1.20+, OpenCV 4.9+
- **Database**: MongoDB Atlas with django-mongodb-backend 5.2.4
- **Authentication**: Simple JWT 5.3.1

### Performance
- Face recognition processing: <1 second
- API response time: <200ms (average)
- Face detection accuracy: 95%+
- Face recognition accuracy: 99.3%

### Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support

## [Unreleased]

### Planned Features
- Mobile applications (iOS and Android)
- Multi-language support (i18n)
- Leave management system
- Shift scheduling
- Geofencing for remote attendance
- Email notifications
- Two-factor authentication
- Advanced analytics with ML insights
- Slack/Teams integration
- Biometric device integration
- Docker containerization

---

## Version History

- **v1.0.0** (2024-09-07) - Initial stable release
- **v0.9.0** (2024-09-05) - Beta release with core features
- **v0.5.0** (2024-08-20) - Alpha release for internal testing

---

For more details, see the [commit history](https://github.com/Ebo1996/face-attendance-system/commits/main).
