import sys
import os
import json
import re
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
from datetime import datetime, timedelta
import time
import warnings
from flask import Flask, jsonify
from pythainlp.tokenize import word_tokenize
from pythainlp.corpus import thai_stopwords

# --- Config & Setup ---
app = Flask(__name__)
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

warnings.filterwarnings("ignore")
load_dotenv()

# DB Connection
db_user = os.getenv('DB_USERNAME', 'root')
db_pass = os.getenv('DB_PASSWORD', 'rootpassword')
db_host = os.getenv('DB_HOST', 'database')
db_port = os.getenv('DB_PORT', '3306')
db_name = os.getenv('DB_DATABASE', 'donation_db')

if db_pass:
    conn_str = f"mysql+mysqlconnector://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
else:
    conn_str = f"mysql+mysqlconnector://{db_user}@{db_host}:{db_port}/{db_name}"

engine = create_engine(conn_str, pool_pre_ping=True, pool_recycle=3600)

# Keywords Mapping
CATEGORY_MAP = {
    "education-learning": "การศึกษา เรียน โรงเรียน นักเรียน ครู ทุนการศึกษา อุปกรณ์การเรียน",
    "environment": "สิ่งแวดล้อม ป่าไม้ ธรรมชาติ สัตว์ป่า โลกร้อน ขยะ",
    "elderly-care": "ผู้สูงอายุ คนชรา คนแก่ ดูแลผู้สูงอายุ",
    "health-medical": "สุขภาพ แพทย์ โรงพยาบาล รักษา พยาบาล เครื่องมือแพทย์",
    "animals": "สัตว์ หมา แมว สุนัข จรจัด สัตว์พิการ",
    "disaster-relief": "ภัยพิบัติ น้ำท่วม ไฟไหม้ ช่วยเหลือฉุกเฉิน",
    "poverty": "ยากไร้ ยากจน ขาดแคลน ชุมชนแออัด",
    "children": "เด็ก เยาวชน กำพร้า ทารก",
    "religion": "ศาสนา วัด ทำบุญ พระ",
}

BEHAVIOR_WEIGHTS = {
    'swipe_like': 1.5,
    'click_detail': 1.2,
    'view_story': 0.8,
    'swipe_pass': -1.0,
}

# --- Helper Functions ---

def convert_to_python_types(obj):
    if isinstance(obj, (np.integer, np.int64)): return int(obj)
    elif isinstance(obj, (np.floating, np.float64)): return float(obj)
    elif isinstance(obj, np.ndarray): return obj.tolist()
    elif isinstance(obj, dict): return {k: convert_to_python_types(v) for k, v in obj.items()}
    elif pd.isna(obj): return None
    return obj

def clean_text(text):
    """ลบ URL และอักขระพิเศษ เก็บเฉพาะ ไทย อังกฤษ ตัวเลข"""
    if not isinstance(text, str): return ""
    text = re.sub(r'http\S+', '', text) # ลบ URL
    text = re.sub(r'[^ก-๙a-zA-Z0-9\s]', '', text) # เก็บเฉพาะตัวอักษร
    return text

def thai_tokenizer(text):
    """ตัดคำและกรอง Stopwords"""
    tokens = word_tokenize(text, engine='newmm')
    return [t for t in tokens if t not in thai_stopwords() and not t.isspace()]

def get_user_behavior_data(user_id=None, session_id=None, days_back=30):
    """ดึงข้อมูลพฤติกรรมย้อนหลัง"""
    with engine.connect() as conn:
        condition = "ub.user_id = :uid" if user_id else "ub.session_id = :sid"
        params = {'uid': user_id, 'sid': session_id, 'days': days_back}
        
        query = text(f"""
            SELECT ub.donation_request_id, ub.action_type, COUNT(*) as action_count,
                AVG(ub.duration_ms) as avg_duration_ms, MAX(ub.created_at) as last_action_at,
                c.name as category_name, dr.title
            FROM user_behaviors ub
            JOIN donation_requests dr ON ub.donation_request_id = dr.id
            LEFT JOIN categories c ON dr.category_id = c.id
            WHERE {condition} AND ub.created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
            GROUP BY ub.donation_request_id, ub.action_type, c.name, dr.title
        """)
        
        # Mapping params ให้ตรงกับ query
        q_params = {'days': days_back}
        if user_id: q_params['uid'] = user_id
        else: q_params['sid'] = session_id
            
        return pd.read_sql(query, conn, params=q_params)

def analyze_user_behavior(behaviors):
    """คำนวณคะแนนความสนใจจากพฤติกรรม"""
    if behaviors.empty:
        return {'keywords': '', 'project_scores': {}, 'total_actions': 0}
    
    category_scores = {}
    project_scores = {}
    
    for _, row in behaviors.iterrows():
        score = BEHAVIOR_WEIGHTS.get(row['action_type'], 1.0) * row['action_count']
        if row['avg_duration_ms'] and row['avg_duration_ms'] > 5000: score *= 1.2
        
        cat = row['category_name'] or 'unknown'
        category_scores[cat] = category_scores.get(cat, 0) + score
        
        pid = row['donation_request_id']
        project_scores[pid] = project_scores.get(pid, 0) + score

    # สร้าง Keyword จาก Top 3 Categories
    keywords = []
    for cat, _ in sorted(category_scores.items(), key=lambda x: x[1], reverse=True)[:3]:
        keywords.append(CATEGORY_MAP.get(cat, cat))
        
    return {
        'keywords': ' '.join(keywords),
        'category_scores': convert_to_python_types(category_scores),
        'project_scores': convert_to_python_types(project_scores),
        'total_actions': int(behaviors['action_count'].sum()),
        'last_action_at': behaviors['last_action_at'].max()
    }

def calculate_project_factors(donations):
    """คำนวณโบนัสพิเศษ (ความด่วน, ใกล้หมดเวลา)"""
    factors_dict = {}
    now = datetime.now()
    
    for _, proj in donations.iterrows():
        f = {'bonus': 1.0}
        
        # 1. ความก้าวหน้า (Progress)
        if proj['goal_amount'] > 0:
            prog = proj['current_amount'] / proj['goal_amount']
            if prog > 0.8: f['bonus'] *= 1.3 # ใกล้ครบแล้ว ช่วยดันหน่อย
            elif prog < 0.2: f['bonus'] *= 0.9
            
        # 2. ความด่วน (Urgency)
        urgency = str(proj['urgency']).lower()
        if 'high' in urgency or 'urgent' in urgency: f['bonus'] *= 1.2
        
        # 3. ความสดใหม่ (Recency)
        if pd.notna(proj['created_at']):
            days_old = (now - proj['created_at']).days
            if days_old < 3: f['bonus'] *= 1.2 # เพิ่งมาใหม่
            
        factors_dict[proj['id']] = f
    return factors_dict

def generate_recommendations(user_info, donations, tfidf_model, tfidf_matrix, project_factors):
    """สร้าง Recommendation List สำหรับ 1 User"""
    uid = user_info.get('id')
    sid = user_info.get('session_id')
    
    # 1. วิเคราะห์พฤติกรรม
    behaviors = get_user_behavior_data(uid, sid)
    analysis = analyze_user_behavior(behaviors)
    
    # 2. สร้าง Search Query (Behavior + Preference)
    search_terms = analysis['keywords']
    pref_cats = user_info.get('preferred_categories', '')
    if pref_cats:
        # แปลง JSON string หรือ list เป็น text
        if isinstance(pref_cats, str) and '[' in pref_cats:
             try: pref_cats = " ".join(json.loads(pref_cats))
             except: pass
        search_terms += f" {pref_cats}"
    
    if not search_terms.strip():
        search_terms = "ช่วยเหลือ บริจาค สังคม" # Default query
        
    # 3. คำนวณ Cosine Similarity
    user_vec = tfidf_model.transform([clean_text(search_terms)])
    sim_scores = cosine_similarity(user_vec, tfidf_matrix)[0]
    
    results = []
    for idx, score in enumerate(sim_scores):
        if score < 0.01: continue # ตัดทิ้งถ้าน้อยเกินไป
        
        pid = donations.iloc[idx]['id']
        factors = project_factors.get(pid, {'bonus': 1.0})
        
        # สูตร: (TF-IDF + Behavior Score) * Bonus Factors
        behavior_boost = analysis['project_scores'].get(pid, 0) * 0.1
        final_score = (score + behavior_boost) * factors['bonus']
        
        results.append({
            'user_id': uid,
            'session_id': sid,
            'donation_request_id': pid,
            'score': float(final_score),
            'base_tfidf_score': float(score),
            'behavior_adjust': float(behavior_boost),
            'last_calculated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'metadata': json.dumps({
                'match_reason': search_terms[:50],
                'factors': factors
            }, ensure_ascii=False)
        })
        
    # เรียงลำดับและเอาแค่ Top 10
    results.sort(key=lambda x: x['score'], reverse=True)
    return results[:10]

def save_to_db(recs):
    """บันทึกลง DB แบบลบของเก่าแล้วลงใหม่"""
    if not recs: return
    
    # --- ส่วนที่แก้ไข ---
    # แปลงข้อมูลใน dict แต่ละอันให้เป็น Python type พื้นฐานก่อนสร้าง DataFrame
    clean_recs = []
    for rec in recs:
        clean_recs.append(convert_to_python_types(rec))
    
    df = pd.DataFrame(clean_recs)
    # ------------------
    
    with engine.connect() as conn:
        # ลบของเก่าเฉพาะ User/Session ที่เราคำนวณใหม่
        uids = df['user_id'].dropna().unique().tolist()
        sids = df['session_id'].dropna().unique().tolist()
        
        if uids:
            # ใช้ text() ครอบ query SQL
            conn.execute(text(f"DELETE FROM user_recommendations WHERE user_id IN ({','.join([':id'+str(i) for i in range(len(uids))])})"), 
            {f'id{i}': uid for i, uid in enumerate(uids)})
        if sids:
            conn.execute(text(f"DELETE FROM user_recommendations WHERE session_id IN ({','.join([':id'+str(i) for i in range(len(sids))])})"), 
            {f'id{i}': sid for i, sid in enumerate(sids)})
            
        df.to_sql('user_recommendations', conn, if_exists='append', index=False, chunksize=500)
        conn.commit()

# --- Main Process ---

def process_logic():
    stats = {'users': 0, 'guests': 0, 'recs': 0}
    
    with engine.connect() as conn:
        # 1. Load Projects (Active & Approved)
        donations = pd.read_sql(text("""
            SELECT dr.*, c.name as category_name 
            FROM donation_requests dr
            LEFT JOIN categories c ON dr.category_id = c.id
            WHERE dr.status = 'APPROVED' AND (dr.expires_at IS NULL OR dr.expires_at > NOW())
            ORDER BY dr.created_at DESC LIMIT 500
        """), conn)
        
        if donations.empty: return stats
        
        # 2. Prepare TF-IDF
        # รวม Text ทั้งหมดเพื่อทำ Indexing
        donations['combined_text'] = (
            donations['title'].fillna('') + " " + 
            donations['description'].fillna('') + " " + 
            donations['category_name'].fillna('')
        ).apply(clean_text)
        
        tfidf = TfidfVectorizer(tokenizer=thai_tokenizer, max_features=1000)
        tfidf_matrix = tfidf.fit_transform(donations['combined_text'])
        project_factors = calculate_project_factors(donations)
        
        all_recs = []
        
        # 3. Process Users (Members)
        users = pd.read_sql(text("SELECT id, preferred_categories FROM users WHERE status='ACTIVE' LIMIT 1000"), conn)
        for _, u in users.iterrows():
            all_recs.extend(generate_recommendations(u.to_dict(), donations, tfidf, tfidf_matrix, project_factors))
        stats['users'] = len(users)
        
        # 4. Process Guests (Active Sessions)
        sessions = pd.read_sql(text("SELECT DISTINCT session_id FROM user_behaviors WHERE user_id IS NULL AND created_at > DATE_SUB(NOW(), INTERVAL 3 DAY) LIMIT 50"), conn)
        for _, s in sessions.iterrows():
            all_recs.extend(generate_recommendations({'session_id': s['session_id']}, donations, tfidf, tfidf_matrix, project_factors))
        stats['guests'] = len(sessions)
        
        # 5. Save
        if all_recs:
            save_to_db(all_recs)
            stats['recs'] = len(all_recs)
            
    return stats

# --- Routes ---

@app.route('/', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "Recommender"}), 200

@app.route('/run', methods=['GET'])
def run_task():
    try:
        start = time.time()
        result = process_logic()
        duration = time.time() - start
        return jsonify({
            "status": "success", 
            "duration": f"{duration:.2f}s", 
            "stats": result
        })
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)