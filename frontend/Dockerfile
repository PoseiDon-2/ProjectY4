FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# สร้าง Build สำหรับ Production
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]