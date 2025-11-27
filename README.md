# LifeØS - AI Compliance Rep

AI-powered compliance analysis for modern businesses. Upload documents, get instant risk assessments, severity scores, and actionable 7-day fix plans.

## Features

- **Document Upload**: PDF, PNG, JPG, WEBP support with drag-and-drop
- **OCR Extraction**: Google Cloud Vision extracts text from any document
- **AI Analysis**: GPT-4o identifies compliance risks across OSHA, HIPAA, ADA, and more
- **Actionable Reports**: Severity scores, specific fixes, and 7-day action plans
- **PDF Generation**: Professional downloadable compliance reports
- **Subscription Tiers**: Starter ($99), Growth ($299), Pro ($799)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Auth**: Clerk
- **Storage**: Firebase Storage
- **Database**: Firebase Firestore
- **AI**: OpenAI GPT-4o
- **OCR**: Google Cloud Vision
- **Payments**: Stripe
- **PDF**: PDFKit

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `env.example` to `.env.local` and fill in your credentials:

```bash
cp env.example .env.local
```

Required environment variables:

#### Clerk (Authentication)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk dashboard
- `CLERK_SECRET_KEY` - From Clerk dashboard

#### Firebase
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

#### Google Cloud Vision (OCR)
- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_CLOUD_CLIENT_EMAIL`
- `GOOGLE_CLOUD_PRIVATE_KEY`

#### OpenAI
- `OPENAI_API_KEY`

#### Stripe
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_GROWTH_PRICE_ID`
- `STRIPE_PRO_PRICE_ID`

#### App
- `NEXT_PUBLIC_APP_URL` - Your deployment URL

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Set Up External Services

#### Clerk
1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Copy API keys to `.env.local`

#### Firebase
1. Create project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Storage and Firestore
3. Create service account for admin SDK
4. Download credentials and add to `.env.local`

#### Google Cloud Vision
1. Enable Vision API in Google Cloud Console
2. Create service account with Vision API access
3. Download credentials

#### OpenAI
1. Get API key from [platform.openai.com](https://platform.openai.com)

#### Stripe
1. Create account at [stripe.com](https://stripe.com)
2. Create 3 subscription products (Starter, Growth, Pro)
3. Copy price IDs and keys to `.env.local`
4. Set up webhook endpoint: `https://yourdomain.com/api/stripe/webhook`

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

```bash
vercel --prod
```

### Build for Production

```bash
npm run build
npm run start
```

## Project Structure

```
/app
  /api
    /upload          - File upload endpoint
    /analyze         - AI compliance analysis
    /report/[id]     - Report retrieval & PDF generation
    /reports         - List user reports
    /stripe          - Payment endpoints
  /(auth)            - Sign in/up pages
  /(dashboard)       - Protected dashboard pages
  /pricing           - Pricing page
  /page.tsx          - Landing page
/components          - React components
/lib                 - Utilities and config
/agents              - AI agent logic
/prompts             - GPT prompt templates
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload document to Firebase |
| `/api/analyze` | POST | Run AI compliance analysis |
| `/api/analyze` | PUT | Analyze raw text directly |
| `/api/report/[id]` | GET | Get report by ID |
| `/api/report/[id]` | POST | Generate PDF for report |
| `/api/report/[id]` | PUT | Download PDF directly |
| `/api/reports` | GET | List user's reports |
| `/api/stripe/checkout` | POST | Create Stripe checkout |
| `/api/stripe/webhook` | POST | Stripe webhook handler |
| `/api/stripe/portal` | POST | Customer portal session |

## License

MIT

---

Built with 💙 by LifeØS

