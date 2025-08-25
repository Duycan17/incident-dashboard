# 🔧 Cấu hình API Endpoints

Hướng dẫn thay đổi API endpoints một cách dễ dàng trong Incident Dashboard.

## 📁 Files cấu hình

### 1. **`.env.local`** - File cấu hình chính
```bash
# Reviews Service - Backend service cung cấp dữ liệu reviews
REVIEWS_UPSTREAM_URL=http://128.199.96.56:8005/reviews

# ML Explanation Service - Service AI để giải thích kết quả phân loại
ML_EXPLAIN_SERVICE_URL=http://202.44.47.12:5000/explain

# Data Storage Path - Đường dẫn lưu trữ dữ liệu
DATA_VOLUME_PATH=/app/data
```

### 2. **`lib/config.ts`** - File config trung tâm
Chứa tất cả cấu hình của ứng dụng, bao gồm:
- Upstream services URLs
- Data storage paths
- API settings
- ML configuration
- Metrics configuration

## 🚀 Cách thay đổi endpoints

### Option 1: Thay đổi trong `.env.local` (Khuyến nghị)
```bash
# Thay đổi Reviews service
REVIEWS_UPSTREAM_URL=http://your-new-server.com:8005/reviews

# Thay đổi ML service
ML_EXPLAIN_SERVICE_URL=http://your-ml-server.com:5000/explain

# Thay đổi data path
DATA_VOLUME_PATH=/custom/data/path
```

### Option 2: Thay đổi trong `lib/config.ts`
```typescript
export const API_CONFIG = {
  UPSTREAM_SERVICES: {
    REVIEWS: process.env.REVIEWS_UPSTREAM_URL || "http://your-default-server.com:8005/reviews",
    ML_EXPLAIN: process.env.ML_EXPLAIN_SERVICE_URL || "http://your-ml-server.com:5000/explain",
  },
  // ... other configs
}
```

### Option 3: Environment variables trong Docker
```yaml
# docker-compose.yml
environment:
  - REVIEWS_UPSTREAM_URL=http://your-server.com:8005/reviews
  - ML_EXPLAIN_SERVICE_URL=http://your-ml-server.com:5000/explain
  - DATA_VOLUME_PATH=/app/data
```

## 🔄 Sau khi thay đổi config

1. **Restart ứng dụng:**
```bash
# Nếu dùng Docker
docker compose restart

# Nếu dùng development mode
npm run dev
```

2. **Test endpoints:**
```bash
# Test status
curl http://localhost:3002/apiv2/status

# Test reviews
curl http://localhost:3002/apiv2/reviews

# Test explain
curl -X POST http://localhost:3002/apiv2/explain \
  -H "Content-Type: application/json" \
  -d '{"text":"Test incident text"}'

# Test metrics
curl http://localhost:3002/apiv2/metrics
```

## 📊 Các endpoints có sẵn

| Endpoint | Method | Mô tả |
|----------|---------|-------|
| `/apiv2/status` | GET | Trạng thái hệ thống |
| `/apiv2/reviews` | GET | Danh sách reviews |
| `/apiv2/reviews/verify` | POST | Xác minh human feedback |
| `/apiv2/reviews/stats` | GET | Thống kê reviews |
| `/apiv2/explain` | POST | AI explanation cho text |
| `/apiv2/metrics` | GET | Performance metrics |

## ⚙️ Cấu hình nâng cao

### Timeout và Cache
```typescript
// lib/config.ts
SETTINGS: {
  DEFAULT_PAGE_SIZE: 5,
  CACHE_CONTROL: "no-store",
  REQUEST_TIMEOUT: 10000, // 10 seconds
}
```

### ML Service Settings
```typescript
ML: {
  DEFAULT_MAX_LENGTH: 128,
  DEFAULT_TOP_K: 5,
  DEFAULT_RETURN_ALL: false,
}
```

### Metrics Configuration
```typescript
METRICS: {
  CONFIDENCE_THRESHOLDS: {
    HIGH: 0.8,
    MEDIUM: 0.5,
  },
  TIME_RANGES: {
    LAST_24H: 24 * 60 * 60 * 1000,
    LAST_7_DAYS: 7 * 24 * 60 * 60 * 1000,
    LAST_30_DAYS: 30 * 24 * 60 * 60 * 1000,
  },
}
```

## 🔍 Troubleshooting

### Lỗi thường gặp:
1. **Upstream error (500)** - Kiểm tra URL và tính khả dụng của upstream service
2. **404 Not Found** - Restart ứng dụng sau khi thay đổi config
3. **Environment variables không hoạt động** - Đảm bảo file `.env.local` ở đúng thư mục root

### Debug:
```bash
# Kiểm tra config được load
curl http://localhost:3002/apiv2/status

# Xem logs
docker logs incident-dashboard-incident-dashboard-1
```
