import os
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import sqlite3
from datetime import datetime
import json
import PyPDF2
import random

app = Flask(__name__)
app.secret_key = 'super_secret_key'
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def get_db_connection():
    conn = sqlite3.connect('quiz_app.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NOT NULL,
            question TEXT NOT NULL,
            option1 TEXT NOT NULL,
            option2 TEXT NOT NULL,
            option3 TEXT NOT NULL,
            option4 TEXT NOT NULL,
            answer TEXT NOT NULL,
            explanation TEXT,
            FOREIGN KEY (subject_id) REFERENCES subjects (id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT NOT NULL,
            subject_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            total INTEGER NOT NULL,
            percentage REAL NOT NULL,
            grade TEXT NOT NULL,
            exam_date DATETIME NOT NULL,
            user_answers TEXT,
            FOREIGN KEY (subject_id) REFERENCES subjects (id)
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route('/')
def landing():
    return render_template('landing.html')

@app.route('/choose_role')
def choose_role():
    return render_template('choose_role.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    role = request.args.get('role', 'user')
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        if role == 'admin':
            if username == 'admin' and password == 'admin123':
                session['admin'] = True
                return redirect(url_for('admin_dashboard'))
            else:
                flash('Invalid admin credentials', 'danger')
        else:
            conn = get_db_connection()
            student = conn.execute("SELECT * FROM students WHERE username=? AND password=?", (username, password)).fetchone()
            conn.close()
            
            if student:
                session['student'] = student['username']
                return redirect(url_for('quiz_intro'))
            else:
                flash('Invalid username or password', 'danger')
            
    return render_template('login.html', role=role)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = get_db_connection()
        try:
            conn.execute("INSERT INTO students (username, password) VALUES (?, ?)", (username, password))
            conn.commit()
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('login', role='user'))
        except sqlite3.IntegrityError:
            flash('Username already exists!', 'danger')
        finally:
            conn.close()
                
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('landing'))

@app.route('/modify_password', methods=['GET', 'POST'])
def modify_password():
    if 'student' not in session:
        return redirect(url_for('login', role='user'))
        
    if request.method == 'POST':
        old_password = request.form['old_password']
        new_password = request.form['new_password']
        
        conn = get_db_connection()
        student = conn.execute("SELECT * FROM students WHERE username=? AND password=?", (session['student'], old_password)).fetchone()
        
        if student:
            conn.execute("UPDATE students SET password=? WHERE username=?", (new_password, session['student']))
            conn.commit()
            flash('Password updated successfully!', 'success')
            conn.close()
            return redirect(url_for('quiz_intro'))
        else:
            flash('Incorrect old password', 'danger')
            conn.close()
            
    return render_template('modify_password.html')

# --- Admin Routes ---
@app.route('/admin_dashboard')
def admin_dashboard():
    if 'admin' not in session: return redirect(url_for('login', role='admin'))
    
    conn = get_db_connection()
    stats = {'total_students': 0, 'total_questions': 0, 'total_exams': 0, 'avg_score': 0}
    scores_labels, scores_data = [], []
    
    stats['total_students'] = conn.execute("SELECT COUNT(*) as c FROM students").fetchone()['c']
    stats['total_questions'] = conn.execute("SELECT COUNT(*) as c FROM questions").fetchone()['c']
    
    res = conn.execute("SELECT COUNT(*) as c, AVG(percentage) as a FROM results").fetchone()
    stats['total_exams'] = res['c']
    stats['avg_score'] = round(res['a'], 2) if res['a'] else 0
    
    for row in conn.execute("SELECT grade, COUNT(*) as c FROM results GROUP BY grade").fetchall():
        scores_labels.append(row['grade'])
        scores_data.append(row['c'])
        
    conn.close()
    return render_template('admin_dashboard.html', stats=stats, scores_labels=json.dumps(scores_labels), scores_data=json.dumps(scores_data))

@app.route('/admin/subjects', methods=['GET', 'POST'])
def admin_subjects():
    if 'admin' not in session: return redirect(url_for('login', role='admin'))
    conn = get_db_connection()
    
    if request.method == 'POST':
        name = request.form['name']
        try:
            conn.execute("INSERT INTO subjects (name) VALUES (?)", (name,))
            conn.commit()
            flash('Subject added!', 'success')
        except sqlite3.IntegrityError:
            flash('Subject already exists!', 'danger')
            
    subjects = conn.execute("SELECT * FROM subjects").fetchall()
    conn.close()
    return render_template('admin_subjects.html', subjects=subjects)

@app.route('/admin/questions', methods=['GET', 'POST'])
def admin_questions():
    if 'admin' not in session: return redirect(url_for('login', role='admin'))
    conn = get_db_connection()
    
    if request.method == 'POST':
        if 'pdf_file' in request.files:
            file = request.files['pdf_file']
            subject_id = request.form['subject_id']
            num_questions = int(request.form.get('num_questions', 5))
            if file and file.filename.endswith('.pdf'):
                path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
                file.save(path)
                try:
                    pdf = PyPDF2.PdfReader(path)
                    text = "".join(page.extract_text() for page in pdf.pages)
                    
                    # Mock PDF Gen
                    words = text.split()
                    for i in range(num_questions):
                        q = "What is the significance of the following extracted text: '" + " ".join(random.sample(words, min(10, len(words)))) + "'?"
                        ans = "Sample Answer"
                        conn.execute('''
                            INSERT INTO questions (subject_id, question, option1, option2, option3, option4, answer, explanation)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        ''', (subject_id, q, "Option A", "Option B", ans, "Option D", ans, "Auto generated from PDF."))
                    conn.commit()
                    flash(f'{num_questions} Questions generated from PDF!', 'success')
                except Exception as e:
                    flash(f'Error reading PDF: {e}', 'danger')
        else:
            q = request.form['question']
            sub_id = request.form['subject_id']
            o1, o2, o3, o4 = request.form['option1'], request.form['option2'], request.form['option3'], request.form['option4']
            ans, exp = request.form['answer'], request.form['explanation']
            conn.execute('''
                INSERT INTO questions (subject_id, question, option1, option2, option3, option4, answer, explanation)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (sub_id, q, o1, o2, o3, o4, ans, exp))
            conn.commit()
            flash('Question added manually!', 'success')

    subjects = conn.execute("SELECT * FROM subjects").fetchall()
    questions = conn.execute("SELECT q.*, s.name as subject_name FROM questions q JOIN subjects s ON q.subject_id = s.id").fetchall()
    conn.close()
    return render_template('add_question.html', subjects=subjects, questions=questions)

@app.route('/admin/questions/delete/<int:q_id>')
def delete_question(q_id):
    if 'admin' not in session: return redirect(url_for('login', role='admin'))
    conn = get_db_connection()
    conn.execute("DELETE FROM questions WHERE id=?", (q_id,))
    conn.commit()
    conn.close()
    flash('Question deleted successfully', 'success')
    return redirect(url_for('admin_questions'))

@app.route('/admin/students')
def admin_students():
    if 'admin' not in session: return redirect(url_for('login', role='admin'))
    conn = get_db_connection()
    students = conn.execute("SELECT * FROM students").fetchall()
    conn.close()
    return render_template('admin_students.html', students=students)

@app.route('/admin/results')
def admin_results():
    if 'admin' not in session: return redirect(url_for('login', role='admin'))
    conn = get_db_connection()
    results = conn.execute("SELECT r.*, s.name as subject_name FROM results r JOIN subjects s ON r.subject_id=s.id ORDER BY exam_date DESC").fetchall()
    conn.close()
    return render_template('admin_results.html', results=results)

# --- Student Quiz Routes ---
@app.route('/quiz_intro')
def quiz_intro():
    if 'student' not in session: return redirect(url_for('login', role='user'))
    conn = get_db_connection()
    subjects = conn.execute("SELECT * FROM subjects").fetchall()
    conn.close()
    return render_template('index.html', username=session['student'], subjects=subjects)

@app.route('/quiz/<int:subject_id>')
def quiz(subject_id):
    if 'student' not in session: return redirect(url_for('login', role='user'))
    conn = get_db_connection()
    questions = conn.execute("SELECT id, subject_id, question, option1, option2, option3, option4 FROM questions WHERE subject_id=?", (subject_id,)).fetchall()
    subject = conn.execute("SELECT name FROM subjects WHERE id=?", (subject_id,)).fetchone()
    conn.close()
    
    if not questions:
        flash('No questions available in this subject right now.', 'warning')
        return redirect(url_for('quiz_intro'))
        
    questions_list = [dict(q) for q in questions]
    return render_template('quiz.html', questions=json.dumps(questions_list), subject=dict(subject), subject_id=subject_id)

@app.route('/submit_quiz', methods=['POST'])
def submit_quiz():
    if 'student' not in session: return jsonify({'status': 'error', 'msg': 'unauthorized'})
        
    payload = request.json
    subject_id = payload.get('subject_id')
    user_answers = payload.get('answers', {})
    
    conn = get_db_connection()
    db_questions = conn.execute("SELECT id, answer FROM questions WHERE subject_id=?", (subject_id,)).fetchall()
    
    score = 0
    total = len(db_questions)
    
    db_keys = []
    for q in db_questions:
        q_id = str(q['id'])
        db_keys.append(q_id)
        if q_id in user_answers and user_answers[q_id] == q['answer']:
            score += 1
            
    percentage = (score / total) * 100 if total > 0 else 0
    if percentage >= 90: grade = 'A'
    elif percentage >= 75: grade = 'B'
    elif percentage >= 50: grade = 'C'
    else: grade = 'Fail'
    
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO results (student_name, subject_id, score, total, percentage, grade, exam_date, user_answers)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (session['student'], subject_id, score, total, percentage, grade, datetime.now(), json.dumps(user_answers)))
    
    result_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'status': 'success', 'redirect': url_for('result', result_id=result_id)})

@app.route('/result/<int:result_id>')
def result(result_id):
    if 'student' not in session and 'admin' not in session: return redirect(url_for('login', role='user'))
    conn = get_db_connection()
    res = conn.execute("SELECT r.*, s.name as subject_name FROM results r JOIN subjects s ON r.subject_id=s.id WHERE r.id=?", (result_id,)).fetchone()
    conn.close()
    if res:
        return render_template('result.html', result=dict(res))
    return redirect(url_for('quiz_intro'))

@app.route('/review/<int:result_id>')
def review(result_id):
    if 'student' not in session and 'admin' not in session: return redirect(url_for('login', role='user'))
    conn = get_db_connection()
    res = conn.execute("SELECT * FROM results WHERE id=?", (result_id,)).fetchone()
    if not res:
        conn.close()
        return redirect(url_for('quiz_intro'))
        
    subject_id = res['subject_id']
    user_answers = json.loads(res['user_answers'])
    
    questions = conn.execute("SELECT * FROM questions WHERE subject_id=?", (subject_id,)).fetchall()
    conn.close()
    
    review_data = []
    for q in questions:
        q_id = str(q['id'])
        u_ans = user_answers.get(q_id, "Not Answered")
        review_data.append({
            'question': q['question'],
            'options': [q['option1'], q['option2'], q['option3'], q['option4']],
            'correct': q['answer'],
            'user': u_ans,
            'is_correct': u_ans == q['answer'],
            'explanation': q['explanation']
        })
        
    return render_template('review.html', review_data=review_data, result=dict(res))

@app.route('/leaderboard')
def leaderboard():
    conn = get_db_connection()
    leaders = conn.execute("SELECT student_name, MAX(score) as score, MAX(percentage) as percentage, s.name as subject_name FROM results JOIN subjects s ON results.subject_id=s.id GROUP BY student_name, subject_id ORDER BY percentage DESC LIMIT 10").fetchall()
    conn.close()
    return render_template('leaderboard.html', leaders=leaders)

if __name__ == '__main__':
    app.run(debug=True)
