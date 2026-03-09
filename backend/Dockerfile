FROM php:8.2-fpm

# ติดตั้ง dependencies ที่ Laravel และ MySQL ต้องการ
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    curl

# ติดตั้ง PHP Extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# ติดตั้ง Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . .

# ลง library ต่างๆ ของ Laravel
RUN composer install

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]