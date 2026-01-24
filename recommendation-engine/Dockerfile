FROM python:3.9-slim

WORKDIR /app

# ลง dependencies พื้นฐานที่จำเป็นสำหรับ numpy/pandas
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# เปิด Port 5000
EXPOSE 5000

# สั่งรันไฟล์ recommender.py ที่แก้แล้ว
CMD ["python", "recommender.py"]