# Angel Eyes Backend

A comprehensive Node.js backend API for the Angel Eyes baby monitoring application.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based permissions
- **Baby Profile Management**: Complete baby profile system with health records
- **Real-time Monitoring**: WebSocket-based live monitoring sessions
- **AI-Powered Detection**: Safety detection system with ML integration
- **Routine Tracking**: Feeding, sleeping, and activity routine management
- **Community Platform**: Parent discussion forum with posts and comments
- **Push Notifications**: Real-time alerts and notifications
- **Data Analytics**: Comprehensive statistics and reporting

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **File Upload**: Multer
- **Cloud Storage**: Cloudinary (optional)
- **Push Notifications**: Firebase Admin SDK

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` file with your configuration.

4. Start MongoDB:
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or start your local MongoDB service
```

5. Run the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### Baby Management
- `POST /api/babies` - Create baby profile
- `GET /api/babies` - Get user's babies
- `GET /api/babies/:id` - Get single baby
- `PUT /api/babies/:id` - Update baby profile
- `DELETE /api/babies/:id` - Delete baby profile

### Monitoring
- `POST /api/monitoring/start` - Start monitoring session
- `PUT /api/monitoring/:sessionId/end` - End session
- `GET /api/monitoring/sessions` - Get sessions
- `GET /api/monitoring/active` - Get active sessions

### Detections
- `POST /api/detections` - Create detection
- `GET /api/detections` - Get detections
- `PUT /api/detections/:id/resolve` - Resolve detection
- `PUT /api/detections/:id/false-positive` - Mark as false positive

### Routines
- `POST /api/routines` - Create routine
- `GET /api/routines` - Get routines
- `POST /api/routines/entries` - Log routine entry
- `GET /api/routines/today/:babyId` - Get today's schedule

### Community
- `POST /api/community/posts` - Create post
- `GET /api/community/posts` - Get posts
- `POST /api/community/posts/:id/comments` - Add comment
- `PUT /api/community/posts/:id/like` - Like/unlike post

## WebSocket Events

### Client to Server
- `join-monitoring` - Join baby monitoring room
- `safety-alert` - Send safety alert
- `video-stream` - Video stream data

### Server to Client
- `safety-alert` - Safety alert notification
- `session-started` - Monitoring session started
- `session-ended` - Monitoring session ended
- `settings-updated` - Session settings updated

## Database Schema

### User
- Personal information and preferences
- Authentication credentials
- Device tokens for push notifications

### Baby
- Profile information and health records
- Parent and caregiver relationships
- Medical information and milestones

### MonitoringSession
- Real-time monitoring sessions
- Settings and configurations
- Statistics and alerts

### Detection
- AI-powered safety detections
- Severity levels and confidence scores
- Alert management and resolution

### Routine
- Daily routines and schedules
- Feeding, sleeping, and activity tracking
- Reminder settings

## Security Features

- **Authentication**: JWT-based with expiration
- **Authorization**: Role-based access control
- **Rate Limiting**: API request throttling
- **Input Validation**: Joi schema validation
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security headers
- **MongoDB Injection**: Query sanitization

## Development

### Running Tests
```bash
npm test
```

### Code Style
```bash
npm run lint
```

### Database Seeding
```bash
npm run seed
```

## Production Deployment

1. Set up MongoDB Atlas or dedicated MongoDB server
2. Configure environment variables for production
3. Set up SSL certificates
4. Configure reverse proxy (nginx)
5. Set up PM2 for process management
6. Configure monitoring and logging

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## License

MIT License - see LICENSE file for details
