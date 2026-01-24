# main.py ที่แก้ไขแล้ว
from fastapi import FastAPI, Query
from typing import Optional

app = FastAPI()

@app.get("/api/recommendations")
def get_recommendations(
    user_id: Optional[str] = Query(None),
    session_id: Optional[str] = Query(None)
):
    """ดึง recommendations จากตารางที่คำนวณแล้ว"""
    with engine.connect() as conn:
        if user_id:
            result = pd.read_sql(
                text("SELECT * FROM user_recommendations WHERE user_id = :user_id ORDER BY score DESC LIMIT 20"),
                conn, params={"user_id": user_id}
            )
        elif session_id:
            result = pd.read_sql(
                text("SELECT * FROM user_recommendations WHERE session_id = :session_id ORDER BY score DESC LIMIT 20"),
                conn, params={"session_id": session_id}
            )
        else:
            result = pd.DataFrame()  # ว่าง
            
        return {"data": result.to_dict(orient="records")}