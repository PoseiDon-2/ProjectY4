import os
import pandas as pd
import json
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# 1. Load Config
load_dotenv()

db_user = os.getenv('DB_USERNAME', 'root')
db_pass = os.getenv('DB_PASSWORD', '')
db_host = os.getenv('DB_HOST', '127.0.0.1')
db_port = os.getenv('DB_PORT', '3306')
db_name = os.getenv('DB_DATABASE', 'donation_db')

if db_pass:
    conn_str = f"mysql+mysqlconnector://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
else:
    conn_str = f"mysql+mysqlconnector://{db_user}@{db_host}:{db_port}/{db_name}"

try:
    print(f"🔌 Connecting to {db_name}...")
    engine = create_engine(conn_str)

    with engine.connect() as connection:
        print("✅ เชื่อมต่อสำเร็จ! กำลังดึงข้อมูล User และความสนใจ...")
        
        # 1. ดึงข้อมูล (เปลี่ยน name เป็น first_name)
        # เราดึง preferred_categories มาด้วยเพื่อดูว่า User ชอบอะไร
        query = text("SELECT id, first_name, email, preferred_categories FROM users LIMIT 5")
        df = pd.read_sql(query, connection)
        
        if not df.empty:
            print("\n📋 ตัวอย่างข้อมูล Users (สำหรับนำไปคำนวณ):")
            print("-" * 60)
            for index, row in df.iterrows():
                # ลองแกะข้อมูล preferred_categories (สมมติว่าเป็น JSON หรือ Text)
                cats = row['preferred_categories']
                if cats is None:
                    cats = "ยังไม่ระบุ"
                
                print(f"👤 {row['first_name']} | 📧 {row['email']}")
                print(f"   ❤️ สิ่งที่ชอบ: {cats}")
                print("-" * 60)
        else:
            print("❌ ไม่พบข้อมูล User ในตาราง")

except Exception as e:
    print("\n❌ Error:")
    print(e)