# North Playbook

A comprehensive personal development application built with Next.js 15, AWS Amplify Gen 2, and Material-UI. Track your growth journey through interactive exercises, maintain a beautiful digital playbook, and gain AI-powered insights into your development patterns.

## 🌟 Features

### 📚 Exercise System
- **8 Comprehensive Exercises** across 6 development categories
- **Interactive Responses**: Text, audio, and video submissions
- **Progress Tracking**: Monitor completion and growth over time
- **Preview Modals**: Quick exercise overview before starting

### 📖 Digital Playbook
- **Multiple View Modes**: Timeline, category-based, and magazine layouts
- **Rich Media Support**: Images, audio, and video integration
- **AI-Generated Insights**: Personalized analysis of your entries
- **PDF Export**: Download your complete development story
- **Magazine-Style Layout**: Professional, visually stunning presentation

### 📊 Progress & Analytics
- **Progress Tracking**: Visual progress bars and completion statistics
- **AI Insights**: Personalized recommendations and pattern analysis
- **Category Analysis**: Deep dive into each development area
- **Activity Timeline**: Track your development journey over time

### 🎨 Modern UI/UX
- **Material-UI Design**: Clean, professional interface
- **Responsive Layout**: Works perfectly on all devices
- **Dark/Light Themes**: Customizable appearance
- **Smooth Animations**: Engaging user experience

## 🚀 Tech Stack

- **Frontend**: Next.js 15 with React 19 and TypeScript
- **Backend**: AWS Amplify Gen 2 with Cognito authentication
- **UI Framework**: Material-UI (MUI) v6
- **Styling**: Emotion CSS-in-JS
- **Media Handling**: Custom audio/video players with full controls
- **PDF Generation**: React-to-print for export functionality
- **Image Management**: Drag-and-drop upload with preview galleries

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- AWS CLI configured
- AWS Amplify CLI

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/IhaveAnIdea/north-playbook.git
   cd north-playbook
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure AWS Amplify**
   ```bash
   # If you have an existing Cognito user pool
   aws cognito-idp describe-user-pool --user-pool-id YOUR_USER_POOL_ID
   
   # Update amplify-outputs.json with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🌐 Deployment

### Deploy to AWS Amplify

1. **Connect to GitHub**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click "New app" → "Host web app"
   - Connect your GitHub repository

2. **Configure Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
         - .next/cache/**/*
   ```

3. **Environment Variables**
   Set up the following environment variables in Amplify:
   - `NEXT_PUBLIC_AWS_REGION`: Your AWS region
   - `NEXT_PUBLIC_USER_POOL_ID`: Your Cognito User Pool ID
   - `NEXT_PUBLIC_USER_POOL_CLIENT_ID`: Your Cognito App Client ID

4. **Deploy**
   - Save and deploy
   - Your app will be available at the provided Amplify URL

## 📁 Project Structure

```
north-playbook/
├── src/
│   ├── app/                    # Next.js 15 app router
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Main dashboard
│   │   ├── exercises/         # Exercise system
│   │   ├── playbook/          # Digital playbook
│   │   ├── progress/          # Progress tracking
│   │   ├── insights/          # AI insights
│   │   ├── profile/           # User profile
│   │   └── settings/          # App settings
│   ├── components/            # Reusable React components
│   │   ├── exercises/         # Exercise-related components
│   │   ├── layout/            # Layout components
│   │   ├── media/             # Media handling components
│   │   └── playbook/          # Playbook components
│   ├── data/                  # Sample data and types
│   └── lib/                   # Utility functions and configs
├── amplify/                   # AWS Amplify configuration
└── public/                    # Static assets
```

## 🎯 Key Features Breakdown

### Exercise Categories
1. **Mindset**: Cognitive reframing and mental models
2. **Motivation**: Goal setting and drive enhancement
3. **Goals**: Strategic planning and achievement tracking
4. **Reflection**: Self-awareness and introspection
5. **Gratitude**: Appreciation and positive psychology
6. **Vision**: Future planning and aspiration setting

### Playbook Views
- **Timeline View**: Chronological journey through your development
- **Category View**: Organized by development areas
- **Magazine View**: Professional, publication-style layout with:
  - Cover page with featured images
  - Multi-column text layouts
  - Integrated media players
  - AI insights and analysis

### AI Insights
- **Pattern Recognition**: Identify trends in your responses
- **Personalized Recommendations**: Tailored suggestions for growth
- **Mood Analysis**: Track emotional patterns over time
- **Learning Style Detection**: Optimize based on your preferences

## 🔧 Configuration

### AWS Amplify Setup
The app uses AWS Amplify Gen 2 for backend services. Key configurations:

- **Authentication**: Cognito User Pools with email/password
- **Storage**: S3 for media file uploads
- **API**: GraphQL for data operations (if needed)

### Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_AWS_REGION=us-west-2
NEXT_PUBLIC_USER_POOL_ID=us-west-2_xxxxxxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Material-UI](https://mui.com/)
- Backend powered by [AWS Amplify](https://aws.amazon.com/amplify/)
- Icons from [Material Icons](https://mui.com/material-ui/material-icons/)

## 📞 Support

For support, email your-email@example.com or create an issue in this repository.

---

**Start your personal development journey today with North Playbook!** 🚀
