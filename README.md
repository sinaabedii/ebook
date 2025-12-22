# 📚 ArianDoc

سامانه مدیریت اسناد دیجیتال هلدینگ آرین سعید - با قابلیت آپلود PDF و نمایش با جلوه‌های بصری پیشرفته

## ✨ ویژگی‌ها

- **آپلود PDF**: پشتیبانی از فایل‌های تا 500 مگابایت
- **نمایش تعاملی**: ورق زدن با انیمیشن‌های 3D حرفه‌ای
- **ریسپانسیو**: بهینه‌سازی برای تمام دستگاه‌ها
- **کنترل‌های لمسی**: پشتیبانی کامل از gestures موبایل
- **تامبنیل**: نمایش thumbnail bar برای مرور سریع
- **زوم**: بزرگ‌نمایی و کوچک‌نمایی صفحات
- **تمام صفحه**: حالت fullscreen برای مطالعه بهتر
- **API مستند**: Swagger/OpenAPI documentation

## 🏗️ معماری

### Frontend
- **Framework**: Next.js 14 + React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PDF Rendering**: pdfjs-dist
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend
- **Framework**: Django 4.2 + Django REST Framework
- **Database**: PostgreSQL / SQLite
- **Task Queue**: Celery + Redis
- **PDF Processing**: PyPDF2, pdf2image, Pillow
- **Documentation**: drf-yasg (Swagger)

## 🚀 راه‌اندازی

### پیش‌نیازها
- Node.js 18+
- Python 3.11+
- Redis (برای Celery)
- Poppler (برای pdf2image)

### Frontend

```bash
cd frontend

# نصب وابستگی‌ها
npm install

# کپی فایل environment
cp .env.local.example .env.local

# اجرای سرور توسعه
npm run dev
```

Frontend در آدرس `http://localhost:3000` اجرا می‌شود.

### Backend

```bash
cd backend

# ایجاد محیط مجازی
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# نصب وابستگی‌ها
pip install -r requirements.txt

# کپی فایل environment
cp .env.example .env

# اعمال migrations
python manage.py migrate

# ایجاد superuser
python manage.py createsuperuser

# اجرای سرور
python manage.py runserver
```

Backend در آدرس `http://localhost:8000` اجرا می‌شود.

### Celery Worker (برای پردازش PDF)

```bash
cd backend
celery -A flipbook_backend worker --loglevel=info
```

### با Docker

```bash
cd backend
docker-compose up -d
```

## 📁 ساختار پروژه

```
ebook/
├── frontend/                    # Next.js Frontend
│   ├── src/
│   │   ├── components/          # React Components
│   │   │   ├── pdf/             # PDF-related components
│   │   │   ├── layout/          # Layout components
│   │   │   └── common/          # Shared components
│   │   ├── pages/               # Next.js Pages
│   │   ├── hooks/               # Custom React Hooks
│   │   ├── api/                 # API Client
│   │   ├── types/               # TypeScript Types
│   │   └── styles/              # Global Styles
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/                     # Django Backend
│   ├── flipbook_backend/        # Project Settings
│   ├── core/                    # Core App
│   │   ├── models.py            # Database Models
│   │   ├── serializers.py       # API Serializers
│   │   ├── views.py             # API Views
│   │   └── admin.py             # Admin Panel
│   ├── pdf_processor/           # PDF Processing App
│   │   ├── services/            # Processing Services
│   │   └── tasks.py             # Celery Tasks
│   ├── requirements.txt
│   └── docker-compose.yml
│
└── README.md
```

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/books/` | لیست کتاب‌ها |
| GET | `/api/books/{id}/` | جزئیات کتاب |
| POST | `/api/upload/` | آپلود PDF |
| GET | `/api/upload/status/{id}/` | وضعیت پردازش |
| GET | `/api/pages/{book_id}/` | لیست صفحات |
| GET | `/api/pages/{book_id}/{page}/` | صفحه خاص |
| POST | `/api/bookmarks/` | ایجاد بوکمارک |

مستندات کامل API در `/swagger/` در دسترس است.

## 🛠️ توسعه

### اجرای تست‌ها

```bash
# Frontend
cd frontend
npm run lint

# Backend
cd backend
python manage.py test
```

### Build برای Production

```bash
# Frontend
cd frontend
npm run build

# Backend
python manage.py collectstatic
```

## 📊 معیارهای عملکرد

- **Mobile Lighthouse Score**: >90
- **First Page Load**: <3s برای PDF 100 صفحه‌ای
- **Page Turn FPS**: >60fps
- **Memory Usage**: <500MB برای PDFهای بزرگ

## 📝 لایسنس

MIT License

## 👥 مشارکت

برای مشارکت در پروژه:
1. Fork کنید
2. Branch جدید ایجاد کنید (`git checkout -b feature/amazing-feature`)
3. تغییرات را Commit کنید (`git commit -m 'Add amazing feature'`)
4. Push کنید (`git push origin feature/amazing-feature`)
5. Pull Request ایجاد کنید

---

ساخته شده با ❤️ توسط هلدینگ آرین سعید
