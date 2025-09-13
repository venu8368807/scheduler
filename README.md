# Next.js Scheduler - Google Calendar Integration

A Next.js application that allows sellers to integrate their Google Calendar and buyers to book appointments. Built with TypeScript, NextAuth.js, Google Calendar API, and MongoDB.

## Features

- **Dual Role System**: Separate interfaces for Sellers and Buyers
- **Google OAuth Authentication**: Secure sign-in with Google accounts
- **Calendar Integration**: Real-time availability checking and event creation
- **Appointment Management**: View and manage scheduled appointments
- **Responsive Design**: Modern UI built with Tailwind CSS

## User Roles & Flow

### Seller
- Signs in with Google and grants calendar permissions
- Dashboard shows calendar availability and busy times
- Can view all appointments with buyers

### Buyer
- Signs in with Google
- Browse available sellers
- Select time slots and book appointments
- View all booked appointments

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: MongoDB
- **Calendar API**: Google Calendar API
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18 or later)
2. **MongoDB** (local or MongoDB Atlas)
3. **Google Cloud Console** project with Calendar API enabled
4. **Google OAuth 2.0** credentials

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd nextjs-scheduler
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.vercel.app/api/auth/callback/google` (production)
7. Copy the Client ID and Client Secret

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp env.example .env.local
```

Fill in the required values:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/nextjs-scheduler
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/nextjs-scheduler

# Encryption Key for Refresh Tokens
CRYPTO_SECRET_KEY=your_crypto_secret_key_here
```

### 5. Database Setup

#### Local MongoDB
```bash
# Install MongoDB locally
# Start MongoDB service
mongod
```

#### MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string and update `MONGODB_URI`

### 6. Generate Secrets

Generate a secure NextAuth secret:
```bash
openssl rand -base64 32
```

Generate a crypto secret key:
```bash
openssl rand -base64 32
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Deployment to Vercel

### 1. Prepare for Production

1. Update `NEXTAUTH_URL` in your environment variables to your production domain
2. Add production redirect URI in Google Cloud Console
3. Ensure all environment variables are set

### 2. Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_URL` (your Vercel domain)
   - `NEXTAUTH_SECRET`
   - `MONGODB_URI`
   - `CRYPTO_SECRET_KEY`
4. Deploy

### 3. Update Google OAuth Settings

Add your Vercel domain to authorized redirect URIs in Google Cloud Console:
- `https://your-app.vercel.app/api/auth/callback/google`

## API Endpoints

- `GET /api/auth/[...nextauth]` - NextAuth.js authentication
- `POST /api/setup` - Set user role (Seller/Buyer)
- `GET /api/user/role` - Get current user role
- `GET /api/sellers` - Get list of available sellers
- `GET /api/seller/availability` - Get seller's available time slots
- `POST /api/book` - Book an appointment
- `GET /api/appointments` - Get user's appointments

## Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # NextAuth configuration
│   │   ├── book/           # Appointment booking
│   │   ├── appointments/   # Fetch appointments
│   │   ├── sellers/        # Fetch sellers
│   │   ├── setup/          # User role setup
│   │   └── user/           # User management
│   ├── components/         # React components
│   ├── lib/               # Utility functions
│   │   ├── crypto.ts      # Encryption utilities
│   │   ├── google.ts      # Google Calendar API
│   │   └── mongodb.ts     # Database connection
│   ├── appointments/      # Appointments page
│   ├── buyer/            # Buyer pages
│   ├── seller/           # Seller pages
│   └── setup/            # Role setup page
```

## Required Google Calendar Scopes

- `openid` - OpenID Connect
- `email` - User email
- `profile` - User profile
- `https://www.googleapis.com/auth/calendar` - Calendar read/write
- `https://www.googleapis.com/auth/calendar.events` - Calendar events

## Security Features

- Encrypted refresh token storage
- Secure session management with NextAuth.js
- Environment variable protection
- MongoDB connection security

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository.
