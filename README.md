# Intelligent Test Automation API

AI-powered test automation API that combines OpenAI for test step generation and Playwright for automated browser testing.

## 🏗️ Project Structure

```
intelligent-test-automation/
├── src/
│   ├── config/
│   │   └── index.js          # Configuration management
│   ├── routes/
│   │   ├── index.js          # Health check routes
│   │   └── test.js           # Test automation routes
│   ├── services/
│   │   ├── openaiService.js  # OpenAI integration
│   │   └── playwrightService.js # Playwright automation
│   └── utils/
│       └── s3Helper.js       # AWS S3 upload utility
├── tests/                    # Test files (future)
├── server.js                 # Main application entry point
├── package.json             # Dependencies and scripts
├── env.js                   # Environment configuration
└── .env                     # Environment variables (not tracked)
```

## 🚀 Features

- **AI Test Generation**: Uses OpenAI GPT-4 to generate Cucumber-style test steps
- **Browser Automation**: Executes tests using Playwright with video recording
- **Cloud Storage**: Uploads screenshots and videos to AWS S3
- **RESTful API**: Clean REST endpoints for test operations
- **Error Handling**: Comprehensive error handling and logging
- **Environment Validation**: Validates required environment variables on startup

## 📡 API Endpoints

### Health Check

```
GET /
```

Returns API status

### Generate Test Steps

```
POST /api/generate-test
Content-Type: application/json

{
  "description": "Login to the application with valid credentials"
}
```

### Run Automated Test

```
POST /api/run-test
Content-Type: application/json

{
  "steps": "Given I am on the login page\nWhen I enter valid credentials\nThen I should see the dashboard"
}
```

## 🛠️ Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file with:

   ```env
   PORT=3000
   OPENAI_API_KEY=your_openai_api_key
   AWS_REGION=your_aws_region
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   S3_BUCKET_NAME=your_s3_bucket_name
   ```

3. **Run the Server**

   ```bash
   # Development with auto-reload
   npm run dev

   # Production
   npm start

   # Debug mode
   npm run debug
   ```

## 🔧 Development Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run debug` - Start server with Node.js debugger
- `npm run server` - Alias for dev command

## 🧪 Testing

The application currently supports basic login flow testing for SimpleLogin. The test automation can be extended to support:

- Custom test step interpretation
- Multiple website testing
- Advanced Playwright actions
- Test result reporting

## 📦 Dependencies

### Runtime

- **express** - Web framework
- **axios** - HTTP client for OpenAI API
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management
- **aws-sdk** - AWS services integration
- **@playwright/test** - Browser automation

### Development

- **nodemon** - Development server with auto-reload

## 🌐 Deployment

The application is designed to work in containerized environments and includes:

- Health check endpoints
- Environment variable validation
- Error handling middleware
- Proper logging

## 🔒 Security

- API key validation on startup
- CORS enabled for cross-origin requests
- Error messages sanitized for production
- Environment-based configuration

---

Built for the Evonsys Hackathon 🚀
