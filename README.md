# Music Subscription Web Application

A Spotify-inspired music subscription service built with React, TailwindCSS, and AWS cloud services (EC2, S3, Lambda, API Gateway, and DynamoDB).

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [AWS Setup](#aws-setup)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
  - [Deployment](#deployment)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [AWS Services Configuration](#aws-services-configuration)
- [Testing](#testing)
- [Contributors](#contributors)

## Overview

This project is a cloud-based music subscription application that allows users to search for songs, subscribe to them, and manage their subscriptions. The application features a modern Spotify-inspired UI and leverages various AWS services to provide a scalable and reliable backend.

## Features

- **User Authentication**: Register and login functionality
- **Music Search**: Search songs by title, artist, year, and album
- **Subscription Management**: Subscribe to songs and remove subscriptions
- **Responsive Design**: Fully responsive Spotify-inspired UI
- **Notification System**: Toast notifications for user actions
- **AWS Integration**: Leverages EC2, S3, Lambda, API Gateway, and DynamoDB

## Technology Stack

### Frontend
- React
- React Router for navigation
- TailwindCSS for styling
- Context API for state management

### Backend
- AWS Lambda for serverless functions
- Amazon API Gateway for RESTful APIs
- Amazon DynamoDB for database storage
- Amazon S3 for storing images
- Amazon EC2 for hosting the web application

### Development Tools
- Vite for frontend bundling and development
- ESLint for code linting
- Git for version control

## Architecture

The application follows a serverless architecture pattern:

1. Frontend is hosted on an EC2 instance running Apache
2. User authentication and music data are stored in DynamoDB tables
3. API Gateway exposes RESTful endpoints that trigger Lambda functions
4. Lambda functions handle business logic and interact with DynamoDB
5. Artist images are stored in S3 buckets

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- AWS account with appropriate permissions
- AWS CLI configured locally

### AWS Setup

#### DynamoDB Setup

1. Create the following tables:
   - `login`: For user authentication data
   - `music`: For song information
   - `subscription`: For user subscriptions

```bash
# Run the table creation script
node backend/create-tables.js <studentId> <firstName> <lastName>
```

#### Import Data and S3 Setup

```bash
# Import music data and set up S3 bucket
node backend/import-music-data.js
```

#### Lambda and API Gateway Setup

1. Create Lambda functions using the provided Java/JavaScript code
2. Set up API Gateway with the following endpoints:
   - `GET /music/query`: For searching music
   - `GET /subscriptions`: For retrieving user subscriptions
   - `POST /subscriptions`: For adding subscriptions
   - `DELETE /subscriptions`: For removing subscriptions

### Frontend Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd music-subscription-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```
VITE_API_BASE_URL=https://your-api-gateway-id.execute-api.us-east-1.amazonaws.com/prod
```

4. Start the development server:
```bash
npm run dev
```

### Deployment

#### Frontend Deployment to EC2

1. Build the frontend:
```bash
npm run build
```

2. Deploy to EC2:
```bash
# Use the deployment script
ssh -i your-key.pem ubuntu@your-ec2-instance "bash -s" < backend/deploy.sh
```

3. Copy build files to EC2:
```bash
scp -i your-key.pem -r dist/* ubuntu@your-ec2-instance:/var/www/html/
```

## Usage

### Test Credentials

For testing, you can use the following credentials:

- Email: `test@example.com`
- Password: `password123`

### Application Flow

1. **Login/Register**: Users can register with a new account or login with existing credentials
2. **Music Search**: Search for songs using title, artist, year, or album
3. **Subscribe**: Click the "Subscribe" button on a song card to add it to subscriptions
4. **View Subscriptions**: View all subscribed songs in the subscription area
5. **Unsubscribe**: Remove subscriptions by clicking the "Remove" button

## Project Structure

```
music-subscription-app/
│
├── public/                      # Static assets
│
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── MusicCard/           # Music card component
│   │   └── NotificationPopup/   # Notification component
│   │
│   ├── contexts/                # React contexts
│   │   └── NotificationContext.jsx # Notification management
│   │
│   ├── pages/                   # Page components
│   │   ├── Login.jsx            # Login page
│   │   ├── Register.jsx         # Registration page
│   │   └── Main.jsx             # Main dashboard
│   │
│   ├── services/                # Service layer
│   │   └── apiService.js        # API communication
│   │
│   ├── App.jsx                  # Main app component
│   └── main.jsx                 # Entry point
│   └── index.css                # CSS
│
├── .env                         # Environment variables (not in version control)
├── .env.example                 # Example environment variables
├── package.json                 # Project dependencies
├── tailwind.config.js           # Tailwind configuration
├── vite.config.js               # Vite configuration
└── README.md                    # Project documentation
```

## API Endpoints

### Music Query
- **Endpoint**: `GET /music/query`
- **Description**: Search for music by title, artist, year, or album
- **Query Parameters**:
  - `title` (optional): Song title
  - `artist` (optional): Artist name
  - `year` (optional): Release year
  - `album` (optional): Album name

### Get Subscriptions
- **Endpoint**: `GET /subscriptions`
- **Description**: Get user's subscriptions
- **Query Parameters**:
  - `email`: User's email

### Add Subscription
- **Endpoint**: `POST /subscriptions`
- **Description**: Subscribe to a song
- **Request Body**:
  - `email`: User's email
  - `title`: Song title
  - `artist`: Artist name
  - `year`: Release year
  - `album`: Album name
  - `image_url`: Image URL

### Remove Subscription
- **Endpoint**: `DELETE /subscriptions`
- **Description**: Remove a subscription
- **Request Body**:
  - `email`: User's email
  - `music_id`: Music ID (formatted as `title#album`)

## AWS Services Configuration

### DynamoDB Tables

#### Login Table
- **Partition Key**: `email` (String)
- **Attributes**:
  - `email` (String): User's email
  - `user_name` (String): User's name
  - `password` (String): User's password

#### Music Table
- **Partition Key**: `title` (String)
- **Sort Key**: `album` (String)
- **Attributes**:
  - `title` (String): Song title
  - `artist` (String): Artist name
  - `year` (String): Release year
  - `album` (String): Album name
  - `image_url` (String): URL to artist image

#### Subscription Table
- **Partition Key**: `email` (String)
- **Sort Key**: `music_id` (String)
- **Attributes**:
  - `email` (String): User's email
  - `music_id` (String): Unique identifier for music
  - `title` (String): Song title
  - `artist` (String): Artist name
  - `year` (String): Release year
  - `album` (String): Album name
  - `image_url` (String): URL to artist image

### Lambda Function

The Lambda function handles:
- Music queries
- Subscription management
- Authentication

### S3 Bucket

Stores artist images and allows public access for image display.

## Testing

The application includes a mock implementation for testing without AWS:

```javascript
// Set to false to use real AWS implementation
const USE_MOCK_DATA = true;
```

Mock credentials:
- Email: `test@example.com`
- Password: `password123`

## Contributors

- [Nguyen Ngoc Hai](https://github.com/nngochai2)
- [Tiffany Lin](https://github.com/lintyy)
