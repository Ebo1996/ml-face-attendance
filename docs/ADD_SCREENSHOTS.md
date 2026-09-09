# Adding Screenshots to README

## Instructions

To add the registration page screenshot you provided to the README, follow these steps:

### 1. Save the Screenshot

Save the registration page image as:
```
docs/screenshots/register.png
```

### 2. The README is Already Updated

The README.md file has been updated to include a reference to this screenshot in the Screenshots section.

### 3. Current Screenshot Structure

```
docs/
└── screenshots/
    ├── register.png          ← Your registration page screenshot
    ├── admin-dashboard.png   ← Add admin dashboard screenshot here
    ├── employee-dashboard.png ← Add employee dashboard screenshot here
    ├── face-enrollment.png   ← Add face enrollment screenshot here
    ├── check-in.png          ← Add check-in screenshot here
    ├── employee-management.png ← Add employee management screenshot here
    └── reports.png           ← Add reports screenshot here
```

### 4. How to Capture Additional Screenshots

For the best README presentation, capture these screenshots:

#### Admin Dashboard
- Navigate to: `http://localhost:3000/admin/dashboard`
- Login as admin
- Capture full page showing:
  - Total employees count
  - Today's attendance stats
  - 14-day trend chart
  - Monthly breakdown

#### Employee Dashboard
- Navigate to: `http://localhost:3000/dashboard`
- Login as employee
- Capture full page showing:
  - Today's attendance status
  - Personal calendar
  - Work hours summary
  - Recent attendance history

#### Face Enrollment
- Navigate to: `http://localhost:3000/face-enrollment`
- Start enrollment process
- Capture the webcam capture screen with guidance

#### Check-In
- Navigate to: `http://localhost:3000/attendance`
- Click "Check In"
- Capture the face recognition in progress with confidence score

#### Employee Management
- Navigate to: `http://localhost:3000/admin/employees`
- Login as admin
- Capture the employee list with search bar and filters visible

#### Reports
- Navigate to: `http://localhost:3000/admin/reports` or `/reports`
- Capture the page showing:
  - Date range filters
  - Download cards
  - CSV format documentation

### 5. Screenshot Requirements

For best results:

- **Format**: PNG (for transparency and quality)
- **Resolution**: 1920x1080 or higher
- **Browser**: Use Chrome or Edge for best rendering
- **Zoom**: 100% browser zoom
- **Tool**: Use Windows Snipping Tool, Snagit, or browser DevTools

### 6. Optimizing Screenshots

To keep the README loading fast, optimize images:

```bash
# Using ImageMagick (if installed)
magick docs/screenshots/register.png -resize 800x -quality 85 docs/screenshots/register.png

# Or use online tools:
# - TinyPNG (https://tinypng.com/)
# - Squoosh (https://squoosh.app/)
```

### 7. Adding More Screenshots

To add additional screenshots to the README, edit the Screenshots section in README.md:

```markdown
<div align="center">
  <img src="docs/screenshots/your-new-screenshot.png" alt="Description" width="800"/>
  <p><em>Descriptive caption for the screenshot</em></p>
</div>
```

### 8. Alternative: Using GitHub Issues

If you don't want to commit images to the repository, you can:

1. Create a GitHub issue
2. Upload screenshots to the issue
3. Copy the image URLs
4. Update README.md to use those URLs

Example:
```markdown
![Registration Page](https://user-images.githubusercontent.com/12345/image.png)
```

---

## Quick Command to Capture Current Screen

### Windows (PowerShell)
```powershell
# Press Windows + Shift + S to use Snipping Tool
# Then save to: docs\screenshots\register.png
```

### macOS
```bash
# Press Command + Shift + 4
# Select area and save to: docs/screenshots/register.png
```

### Linux
```bash
# Using gnome-screenshot
gnome-screenshot -a -f docs/screenshots/register.png
```

---

## Current Status

✅ **README.md** - Updated with screenshot placeholders
✅ **Directory Structure** - Created `docs/screenshots/` folder
⏳ **Screenshots** - Waiting for you to add the images

Once you add the screenshots, the README will display them automatically!
