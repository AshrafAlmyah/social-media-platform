# Nexus - Social Media Platform

A modern social media platform built with NestJS, TypeORM, PostgreSQL, Passport authentication, and React.

![Nexus Social Media](https://via.placeholder.com/800x400/1a1a2e/d946ef?text=Nexus+Social+Media)

## Features

- 🔐 **Authentication** - JWT-based auth with Passport
- 👤 **User Profiles** - Customizable profiles with avatar, bio, and cover images
- 📝 **Posts** - Create, view, and delete posts with optional images
- ❤️ **Likes** - Like and unlike posts
- 💬 **Comments** - Add comments to posts
- 👥 **Follow System** - Follow and unfollow users
- 🔍 **Search** - Search for users
- 📱 **Responsive Design** - Beautiful dark theme UI

## Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeORM** - ORM for TypeScript
- **PostgreSQL** - Database
- **Passport** - Authentication middleware
- **JWT** - JSON Web Tokens for auth
- **bcrypt** - Password hashing

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management
- **React Router** - Routing

## Prerequisites

- Node.js (v18+)
- PostgreSQL
- npm or yarn

## Setup

### 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE social_media;
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your database credentials

# Start development server
npm run start:dev
```

The backend will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=social_media

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

PORT=3001
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/search?q=query` - Search users
- `GET /api/users/:username` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/:username/follow` - Follow user
- `DELETE /api/users/:username/follow` - Unfollow user
- `GET /api/users/:username/followers` - Get followers
- `GET /api/users/:username/following` - Get following

### Posts
- `POST /api/posts` - Create post
- `GET /api/posts` - Get all posts
- `GET /api/posts/feed` - Get feed (posts from followed users)
- `GET /api/posts/user/:username` - Get user's posts
- `GET /api/posts/:id` - Get single post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like post
- `DELETE /api/posts/:id/like` - Unlike post

### Comments
- `POST /api/posts/:postId/comments` - Add comment
- `GET /api/posts/:postId/comments` - Get comments
- `DELETE /api/posts/:postId/comments/:id` - Delete comment

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # Users module
│   │   ├── posts/          # Posts module
│   │   ├── comments/       # Comments module
│   │   ├── app.module.ts   # Main app module
│   │   └── main.ts         # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/            # API functions
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand store
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   └── package.json
│
└── README.md
```

## License

MIT

















# social-media-platform
