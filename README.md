# 🚀 Custom Rate Limiter API

✅ **The design of this API is fully done by me, not by any AI tool.**  
✅ **I have reviewed each and every line of code by myself.**

---

## 🧠 Rate Limiting Strategies

### 🧮 1. Sliding Window

Only **X requests** are allowed in a defined time window.

📝 **Example**: 5 requests per 60 seconds

👉 **Hinglish**: _(Ek fixed time slot mein X requests hi jaa sakti hai)_

---

### 💧 2. Token Bucket

**Tokens** are added every second. Each request consumes **1 token**.  
If no token is available, the request is delayed.

👉 **Hinglish**: _(Har second ek token milta hai, aur request tabhi allow hoti jab token available ho)_

## 🌐 API Endpoints

### 1. `POST /apis/register`

**Purpose**: Register an application and store its rate limit config in Redis.

#### 📦 Sample Payload

```json
{
  "baseUrl": "https://jsonplaceholder.typicode.com/posts",
  "rateLimit": {
    "strategy": "sliding-window",
    "requestCount": 5,
    "timeWindow": 10
  },
  "expiryHours": 2
}
```

📝 **Strategy can be either**:

- `"sliding-window"`
- `"token-bucket"`

---

### 2. `GET /apis/:appId`

**Purpose**: Proxy your request through this endpoint and apply rate-limiting.

#### 🔁 How It Works:

- ✅ **Rate limiter logic is applied**
- If **allowed** → request is forwarded to the actual target
- If **rejected** → request is queued via **RabbitMQ** and retried after a delay

✅ Real proxy request is handled through **Axios**  
🔄 Automatically retries based on the **rate-limiting strategy** using **Redis + RabbitMQ**


## 🏗️ Design Patterns Used

This project makes use of multiple design patterns:

| Pattern       | Usage                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Strategy**  | Used to choose between `slidingWindow` and `tokenBucket` dynamically (alag alag algorithm choose karne ke liye)                 |
| **Factory**   | Strategy objects creation can be easily managed (object creation ko centralize karne ke liye)                                   |
| **Proxy**     | `proxy.controller.ts` acts like a forwarder (middleware ke tarah forward karta hai requests)                                    |
| **Facade**    | `worker.ts` acts as a simplified interface to RabbitMQ + strategies (complex logic ko simple interface mein wrap kiya gaya hai) |
| **Visitor**   | Rate limit logic visits app-level configs (modular aur visitable logic for each request)                                        |
| **Singleton** | Redis, RabbitMQ channels are singleton instances (ek hi instance baar baar use hota hai)                                        |

---

## 📁 Folder Structure

```plaintext
src/
├── config/                  # RabbitMQ, Redis, Logger config
│   ├── logger.ts
│   ├── rabbitMq.ts
│   └── redisConnection.ts
├── controller/              # Business logic controllers
│   ├── proxy.controller.ts
│   └── register.controller.ts
├── helper/                  # Any helper utilities
├── middleware/              # Middleware functions
├── rateLimiterStrategy/     # Strategy implementations with queue worker , that is used in index.ts
│   ├── slidingWindowCounter.ts
│   ├── tokenBucket.ts
│   └── worker.ts
├── routes/                  # Express routes
├── types/                   # TypeScript type declarations
│   ├── controllers.ts
│   ├── middleware.ts
│   ├── rateLimiterStrategy.ts
├── .env                     # Environment variables
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
├── tsconfig.json



```

## 🚀 How to Run

```bash
npm install
npm run build
npm run dev
```

## 🛠️ Technologies Used

- **Node.js**
- **TypeScript**
- **Express.js**
- **Redis**
- **RabbitMQ**
- **Axios**
