# MockRoute - Clean Architecture

Ứng dụng Express + Pug tổ chức theo Clean Architecture.

## Cài đặt

```bash
npm install
```

## Chạy dev

```bash
npm run dev
```

Mở: `http://localhost:3000`

## Chạy production

```bash
npm start
```

## Cấu trúc
- `src/domain/`: entities, quy tắc nghiệp vụ thuần.
- `src/application/`: use-cases điều phối logic.
- `src/interfaces/http/`: controller, routes Express.
- `src/infrastructure/web/`: khởi tạo server Express.
- `index.js`: entrypoint chạy app.
- `views/`, `public/`: UI và static assets.
