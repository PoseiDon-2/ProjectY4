import sys
import os
import json
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
from datetime import datetime, timedelta
import time
import warnings

# --- เพิ่มส่วน Flask ---
from flask import Flask, jsonify
app = Flask(__name__)

# --- Config & Setup ---
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

from pythainlp.tokenize import word_tokenize
from pythainlp.corpus import thai_stopwords

load_dotenv()

# *** แก้ไข: ปรับ Default Host ให้ตรงกับ Docker Service Name ***
db_user = os.getenv('DB_USERNAME', 'root')
db_pass = os.getenv('DB_PASSWORD', 'rootpassword')
db_host = os.getenv('DB_HOST', 'database') # ชื่อ service ใน docker-compose
db_port = os.getenv('DB_PORT', '3306')
db_name = os.getenv('DB_DATABASE', 'donation_db')

if db_pass:
    conn_str = f"mysql+mysqlconnector://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
else:
    conn_str = f"mysql+mysqlconnector://{db_user}@{db_host}:{db_port}/{db_name}"

# สร้าง Engine (Global)
engine = create_engine(conn_str, pool_pre_ping=True, pool_recycle=3600)

CATEGORY_MAP = {
    "education-learning": "การศึกษา เรียน โรงเรียน นักเรียน ครู ทุนการศึกษา อุปกรณ์การเรียน education",
    "environment": "สิ่งแวดล้อม ป่าไม้ ธรรมชาติ สัตว์ป่า โลกร้อน ขยะ environment",
    "elderly-care": "ผู้สูงอายุ คนชรา คนแก่ ดูแลผู้สูงอายุ elderly",
    "health-medical": "สุขภาพ แพทย์ โรงพยาบาล รักษา พยาบาล เครื่องมือแพทย์ health",
    "animals": "สัตว์ หมา แมว สุนัข จรจัด สัตว์พิการ animals",
    "disaster-relief": "ภัยพิบัติ น้ำท่วม ไฟไหม้ ช่วยเหลือฉุกเฉิน disaster",
    "poverty": "ยากไร้ ยากจน ขาดแคลน ชุมชนแออัด poverty",
    "children": "เด็ก เยาวชน กำพร้า ทารก children",
    "religion": "ศาสนา วัด ทำบุญ พระ religion",
}

BEHAVIOR_WEIGHTS = {
    'swipe_like': 1.5,
    'click_detail': 1.2,
    'view_story': 0.8,
    'swipe_pass': -1.0,
}

# --- Helper Functions (คงเดิมไว้ทั้งหมด) ---
def convert_to_python_types(obj):
    if isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)): return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32, np.float16)): return float(obj)
    elif isinstance(obj, np.ndarray): return obj.tolist()
    elif isinstance(obj, dict): return {key: convert_to_python_types(value) for key, value in obj.items()}
    elif isinstance(obj, list): return [convert_to_python_types(item) for item in obj]
    elif isinstance(obj, pd.Timestamp): return obj.isoformat()
    elif pd.isna(obj): return None
    else: return obj

def thai_tokenizer(text):
    return word_tokenize(text, engine='newmm')

def translate_keywords(pref_cats):
    if not pref_cats: return ""
    data = []
    try:
        parsed = json.loads(pref_cats)
        if isinstance(parsed, list): data = parsed
        elif isinstance(parsed, str): data = json.loads(parsed)
    except:
        clean_text = str(pref_cats).replace('[','').replace(']','').replace('"','').replace("'",'')
        data = clean_text.split(',')
    search_terms = []
    for key in data:
        key = str(key).strip()
        if key in CATEGORY_MAP: search_terms.append(CATEGORY_MAP[key])
        else: search_terms.append(key)
    return " ".join(search_terms)

def get_user_behavior_data(user_id=None, session_id=None, days_back=30):
    with engine.connect() as conn:
        if user_id:
            query = text("""
                SELECT ub.donation_request_id, ub.action_type, COUNT(*) as action_count,
                    AVG(ub.duration_ms) as avg_duration_ms, MAX(ub.created_at) as last_action_at,
                    dr.category_id, c.name as category_name, dr.title as project_title
                FROM user_behaviors ub
                JOIN donation_requests dr ON ub.donation_request_id = dr.id
                LEFT JOIN categories c ON dr.category_id = c.id
                WHERE ub.user_id = :user_id AND ub.created_at >= DATE_SUB(NOW(), INTERVAL :days_back DAY)
                GROUP BY ub.donation_request_id, ub.action_type, dr.category_id, c.name, dr.title
                ORDER BY last_action_at DESC
            """)
            params = {'user_id': user_id, 'days_back': days_back}
        elif session_id:
            query = text("""
                SELECT ub.donation_request_id, ub.action_type, COUNT(*) as action_count,
                    AVG(ub.duration_ms) as avg_duration_ms, MAX(ub.created_at) as last_action_at,
                    dr.category_id, c.name as category_name, dr.title as project_title
                FROM user_behaviors ub
                JOIN donation_requests dr ON ub.donation_request_id = dr.id
                LEFT JOIN categories c ON dr.category_id = c.id
                WHERE ub.session_id = :session_id AND ub.created_at >= DATE_SUB(NOW(), INTERVAL :days_back DAY)
                GROUP BY ub.donation_request_id, ub.action_type, dr.category_id, c.name, dr.title
                ORDER BY last_action_at DESC
            """)
            params = {'session_id': session_id, 'days_back': days_back}
        else:
            return pd.DataFrame()
        behaviors = pd.read_sql(query, conn, params=params)
    return behaviors

def analyze_user_behavior(behaviors):
    if behaviors.empty:
        return {'keywords': '', 'category_scores': {}, 'project_scores': {}, 'total_actions': 0, 'last_action_at': None}
    
    category_scores = {}
    project_scores = {}
    keyword_parts = []
    total_actions = int(behaviors['action_count'].sum())
    last_action_at = behaviors['last_action_at'].max()
    
    for _, row in behaviors.iterrows():
        action_type = row['action_type']
        category = row['category_name'] or 'unknown'
        project_id = row['donation_request_id']
        weight = BEHAVIOR_WEIGHTS.get(action_type, 1.0)
        score = weight * int(row['action_count'])
        if row['avg_duration_ms'] and row['avg_duration_ms'] > 5000: score *= 1.2
        
        if category not in category_scores: category_scores[category] = 0
        category_scores[category] += score
        
        if project_id not in project_scores: project_scores[project_id] = 0
        project_scores[project_id] += score
    
    sorted_categories = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)[:3]
    for category, score in sorted_categories:
        if score > 0 and category in CATEGORY_MAP: keyword_parts.append(CATEGORY_MAP[category])
        elif score > 0: keyword_parts.append(category)
    
    return {
        'keywords': ' '.join(keyword_parts),
        'category_scores': convert_to_python_types(category_scores),
        'project_scores': convert_to_python_types(project_scores),
        'total_actions': total_actions,
        'last_action_at': convert_to_python_types(last_action_at)
    }

def calculate_days_left(expires_at):
    if not expires_at: return 30
    try:
        if isinstance(expires_at, str):
            try: expiry_date = pd.to_datetime(expires_at)
            except: 
                try: expiry_date = datetime.strptime(str(expires_at), '%Y-%m-%d %H:%M:%S')
                except: return 30
        else: expiry_date = expires_at
        
        if hasattr(expiry_date, 'to_pydatetime'): expiry_date = expiry_date.to_pydatetime()
        diff = expiry_date - datetime.now()
        return max(0, int(diff.days))
    except Exception: return 30

def calculate_project_factors(donations):
    project_factors = {}
    
    for idx, project in donations.iterrows():
        factors = {'progress_bonus': 1.0, 'urgency_bonus': 1.0, 'time_bonus': 1.0, 'recency_bonus': 1.0}
        
        if 'current_amount' in project and 'goal_amount' in project:
            try:
                current = float(project['current_amount'] or 0)
                goal = float(project['goal_amount'] or 0)
                if goal > 0:
                    progress = current / goal
                    if progress > 0.8: factors['progress_bonus'] = 1.3
                    elif progress > 0.5: factors['progress_bonus'] = 1.15
                    elif progress < 0.2: factors['progress_bonus'] = 0.9
            except: pass
            
        if 'urgency' in project and project['urgency']:
            try:
                urgency = str(project['urgency']).lower()
                if any(word in urgency for word in ['high', 'urgent', 'เร่งด่วน', 'วิกฤต']): factors['urgency_bonus'] = 1.2
                elif any(word in urgency for word in ['medium', 'ปานกลาง']): factors['urgency_bonus'] = 1.05
            except: pass
            
        if 'expires_at' in project:
            try:
                days_left = calculate_days_left(project['expires_at'])
                if days_left < 3: factors['time_bonus'] = 1.25
                elif days_left < 7: factors['time_bonus'] = 1.15
                elif days_left > 30: factors['time_bonus'] = 0.9
            except: pass
            
        if 'created_at' in project and project['created_at']:
            try:
                created_date = project['created_at']
                if isinstance(created_date, str): created_date = pd.to_datetime(created_date)
                if hasattr(created_date, 'to_pydatetime'): created_date = created_date.to_pydatetime()
                days_since = (datetime.now() - created_date).days
                if days_since < 3: factors['recency_bonus'] = 1.2
                elif days_since < 7: factors['recency_bonus'] = 1.1
            except: pass
        
        project_factors[project['id']] = convert_to_python_types(factors)
    return project_factors

def generate_recommendations_for_user(user_info, donations, tfidf, tfidf_matrix, project_factors):
    user_id = user_info.get('id')
    session_id = user_info.get('session_id')
    preferred_cats = user_info.get('preferred_categories', '')
    
    behaviors = get_user_behavior_data(user_id=user_id, session_id=session_id)
    behavior_analysis = analyze_user_behavior(behaviors)
    
    pref_keywords = translate_keywords(preferred_cats)
    behavior_keywords = behavior_analysis['keywords']
    
    if behavior_keywords:
        combined_keywords = f"{behavior_keywords} {behavior_keywords} {pref_keywords}"
        match_source = "behavior+preference"
    elif pref_keywords.strip():
        combined_keywords = pref_keywords
        match_source = "preference"
    elif not behaviors.empty:
        combined_keywords = "ช่วยเหลือ บริจาค สังคม"
        match_source = "general"
    else:
        combined_keywords = "ช่วยเหลือ บริจาค สังคม"
        match_source = "new_user"
    
    user_vector = tfidf.transform([combined_keywords])
    cosine_sim = cosine_similarity(user_vector, tfidf_matrix)
    recommendations = []
    
    for i, tfidf_score in enumerate(cosine_sim[0]):
        project = donations.iloc[i]
        project_id = project['id']
        base_tfidf_score = float(tfidf_score)
        
        behavior_adjust = 0.0
        if project_id in behavior_analysis['project_scores']:
            behavior_adjust = float(behavior_analysis['project_scores'][project_id] * 0.1)
        
        factors = project_factors.get(project_id, {})
        total_score = base_tfidf_score + behavior_adjust
        total_score *= factors.get('progress_bonus', 1.0) * factors.get('urgency_bonus', 1.0) * factors.get('time_bonus', 1.0) * factors.get('recency_bonus', 1.0)
        
        swipe_count = 0
        like_count = 0
        skip_count = 0
        if not behaviors.empty:
            project_behaviors = behaviors[behaviors['donation_request_id'] == project_id]
            for _, bh in project_behaviors.iterrows():
                swipe_count += int(bh['action_count'])
                if bh['action_type'] == 'swipe_like': like_count += int(bh['action_count'])
                elif bh['action_type'] == 'swipe_pass': skip_count += int(bh['action_count'])
        
        if total_score > 0.01:
            try:
                metadata = {
                    'match_source': match_source,
                    'total_actions': int(behavior_analysis['total_actions']),
                    'category_scores': behavior_analysis['category_scores'],
                    'project_factors': factors
                }
                recommendation = {
                    'user_id': user_id,
                    'session_id': session_id,
                    'donation_request_id': project_id,
                    'score': float(total_score),
                    'base_tfidf_score': float(base_tfidf_score),
                    'behavior_adjust': float(behavior_adjust),
                    'swipe_count': int(swipe_count),
                    'like_count': int(like_count),
                    'skip_count': int(skip_count),
                    'last_interaction_at': behavior_analysis['last_action_at'],
                    'metadata': json.dumps(convert_to_python_types(metadata), ensure_ascii=False)
                }
                recommendations.append(recommendation)
            except: continue
    
    recommendations.sort(key=lambda x: x['score'], reverse=True)
    return recommendations[:10]

def save_recommendations_to_db(recommendations):
    if not recommendations: return
    
    df = pd.DataFrame(recommendations)
    now = pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')
    df['created_at'] = now
    df['updated_at'] = now
    df['last_calculated_at'] = now
    
    with engine.connect() as conn:
        users_with_recs = df[df['user_id'].notna()]['user_id'].unique()
        for user_id in users_with_recs:
            conn.execute(text("DELETE FROM user_recommendations WHERE user_id = :user_id"), {'user_id': user_id})
        
        sessions_with_recs = df[df['session_id'].notna()]['session_id'].unique()
        for session_id in sessions_with_recs:
            conn.execute(text("DELETE FROM user_recommendations WHERE session_id = :session_id"), {'session_id': session_id})
        
        df.to_sql('user_recommendations', con=conn, if_exists='append', index=False, chunksize=1000)
        conn.commit()

def get_active_sessions(days_back=7):
    with engine.connect() as conn:
        query = text("""
            SELECT DISTINCT session_id FROM user_behaviors
            WHERE session_id IS NOT NULL AND user_id IS NULL AND created_at >= DATE_SUB(NOW(), INTERVAL :days_back DAY)
            LIMIT 1000
        """)
        sessions = pd.read_sql(query, conn, params={'days_back': days_back})
    return sessions['session_id'].tolist()

def get_table_structure():
    with engine.connect() as conn:
        query = text("SHOW COLUMNS FROM donation_requests")
        columns = pd.read_sql(query, conn)
        return columns['Field'].tolist()

def process_recommendations_logic():
    # ฟังก์ชันนี้คือ Logic เดิมของคุณ
    stats = {'users': 0, 'guests': 0, 'recs': 0, 'projects': 0}
    
    donation_columns = get_table_structure()
    
    with engine.connect() as conn:
        users = pd.read_sql(text("SELECT id, first_name, preferred_categories FROM users WHERE status = 'ACTIVE' LIMIT 1000"), conn)
        
        select_columns = ["dr.id", "dr.title", "dr.description", "dr.category_id", "c.name as category_name", "dr.created_at"]
        optional_columns = ["dr.urgency", "dr.location", "dr.current_amount", "dr.goal_amount", "dr.expires_at", "dr.images", "dr.contact_phone", "dr.detailed_address"]
        for col in optional_columns:
            col_name = col.split()[-1] if ' as ' in col else col.split('.')[-1]
            if col_name in donation_columns: select_columns.append(col)
        
        query = f"""
            SELECT {', '.join(select_columns)}
            FROM donation_requests dr
            LEFT JOIN categories c ON dr.category_id = c.id
            WHERE dr.status = 'APPROVED' AND (dr.expires_at IS NULL OR dr.expires_at > NOW())
            ORDER BY dr.created_at DESC LIMIT 500
        """
        donations = pd.read_sql(text(query), conn)
    
    if donations.empty: return stats
    stats['projects'] = len(donations)
    
    th_stop = list(thai_stopwords())
    combined_series = pd.Series('', index=donations.index)
    if 'category_name' in donations.columns: combined_series = combined_series.str.cat(donations['category_name'].fillna(''), sep=' ')
    if 'title' in donations.columns: combined_series = combined_series.str.cat(donations['title'].fillna(''), sep=' ')
    if 'description' in donations.columns: combined_series = combined_series.str.cat(donations['description'].fillna(''), sep=' ')
    if 'urgency' in donations.columns: combined_series = combined_series.str.cat(donations['urgency'].fillna(''), sep=' ')
    if 'location' in donations.columns: combined_series = combined_series.str.cat(donations['location'].fillna(''), sep=' ')
    
    donations['combined'] = combined_series.str.strip()
    
    tfidf = TfidfVectorizer(tokenizer=thai_tokenizer, token_pattern=None, stop_words=th_stop, max_features=1000, min_df=1, max_df=0.95, ngram_range=(1, 2))
    try:
        tfidf_matrix = tfidf.fit_transform(donations['combined'])
    except ValueError:
        from sklearn.feature_extraction.text import CountVectorizer
        tfidf = CountVectorizer(tokenizer=thai_tokenizer, token_pattern=None, stop_words=th_stop, max_features=500)
        tfidf_matrix = tfidf.fit_transform(donations['combined'])
    
    project_factors = calculate_project_factors(donations)
    all_recommendations = []
    
    for _, user in users.iterrows():
        recommendations = generate_recommendations_for_user(user.to_dict(), donations, tfidf, tfidf_matrix, project_factors)
        all_recommendations.extend(recommendations)
    stats['users'] = len(users)
    
    active_sessions = get_active_sessions(days_back=3)
    if active_sessions:
        for session_id in active_sessions[:50]:
            user_info = {'session_id': session_id, 'first_name': f'Guest_{session_id[:8]}'}
            recommendations = generate_recommendations_for_user(user_info, donations, tfidf, tfidf_matrix, project_factors)
            all_recommendations.extend(recommendations)
        stats['guests'] = len(active_sessions[:50])
    
    if all_recommendations:
        save_recommendations_to_db(all_recommendations)
        stats['recs'] = len(all_recommendations)
    
    return stats

def cleanup_old_recommendations(days_keep=7):
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM user_recommendations WHERE last_calculated_at < DATE_SUB(NOW(), INTERVAL :d DAY)"), {'d': days_keep})
        conn.commit()

# --- Main Service ---

# 1. Route สำหรับตรวจสอบสถานะ
@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "running", "service": "Recommendation Engine"}), 200

# 2. Route ที่ Laravel จะยิงเข้ามาสั่งให้ทำงาน
@app.route('/run', methods=['GET'])
def trigger_recommendation():
    start_time = time.time()
    try:
        cleanup_old_recommendations(days_keep=7)
        stats = process_recommendations_logic()
        
        duration = time.time() - start_time
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        result = {
            "status": "success",
            "timestamp": timestamp,
            "duration_seconds": round(duration, 2),
            "stats": stats
        }
        print(f"[{timestamp}] SUCCESS | {result}")
        return jsonify(result), 200
        
    except Exception as e:
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] ERROR: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    # รันเซิร์ฟเวอร์ Flask ที่พอร์ต 5000
    app.run(host='0.0.0.0', port=5000)