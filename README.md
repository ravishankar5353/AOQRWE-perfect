# AOQRWE - Online Quiz Platform

Welcome to the **AOQRWE Online Quiz Platform**, a sophisticated, fully functional Python Flask application designed for streamlined test administration and student evaluation.

## 🚀 Features

### For Admins (Controllers)
- **AI-Assisted Question Generation:** Upload educational PDFs, and the system uses `PyPDF2` to auto-generate quiz questions instantly.
- **Manual Configuration:** Create targeted test questions manually with a beautiful UI.
- **Subject Management:** Create and catalog multiple subjects with ease.
- **Dashboard Analytics:** Access dynamic Chart.js dashboards to view total students, average scores, and grade distributions.
- **Database Oversight:** Manage registered users and securely examine student results directly from the admin panel.

### For Students
- **Interactive Quiz Interface:** Sleek, distraction-free environment for test-taking.
- **Dynamic Status Tracking:** Grid system allowing students to jump between questions and clearly identify answered vs. unanswered questions.
- **Strict Timers:** Global timer automatically tracks the duration based on question quantity.
- **Comprehensive Review:** Instantly access a breakdown of correct vs. incorrect answers, along with personalized explanations.
- **Exporting Options:** One-click functionality to download detailed PDF outcome reports.

## 🛠️ Tech Stack
- **Backend:** Python, Flask
- **Database:** SQLite (No external server required)
- **Frontend Toolkit:** HTML5, CSS3, JavaScript
- **Styling:** Bootstrap 5, Bootstrap Icons, Google Fonts (Inter)
- **Utilities:** PyPDF2 (PDF logic), html2pdf.js (Export logic), Chart.js (Data viz)

## ⚙️ Installation & Local Usage

1. **Clone the repository**
   ```bash
   git clone https://github.com/ravishankar5353/AOQRWE-perfect.git
   cd AOQRWE-perfect/quiz_app
   ```

2. **Install dependencies**
   Ensure Python is installed, then run:
   ```bash
   pip install flask PyPDF2
   ```

3. **Run the Application**
   The application initializes its own SQLite database automatically upon startup.
   ```bash
   python app.py
   ```
   *Navigate to `http://127.0.0.1:5000/` in your browser.*

#
*Built with ❤️ for educational environments.*
