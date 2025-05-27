# North Playbook - Personal Development Platform

A comprehensive NextJS application powered by AWS Amplify Gen 2 that helps users create their personal development journey through AI-powered insights, guided exercises, and beautiful storytelling.

## 🌟 Features

- **User Authentication**: Secure signup/login with AWS Cognito
- **Personal Development Exercises**: Guided exercises covering mindset, motivation, goals, reflection, gratitude, and vision
- **Multi-Media Support**: Upload text, audio, and video responses
- **AI-Powered Analysis**: Claude AI analyzes responses for personalized insights
- **Beautiful Playbook**: Magazine-style digital playbook of your journey
- **PDF Export**: Download your complete playbook as a beautiful PDF
- **Progress Tracking**: Monitor growth and insights over time
- **Responsive Design**: Modern, beautiful UI with Material Design
- **AWS Integration**: Fully hosted on AWS with Amplify Gen 2

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Framework**: Material-UI (MUI) with custom North branding
- **Backend**: AWS Amplify Gen 2
- **Authentication**: AWS Cognito
- **Database**: AWS DynamoDB (via Amplify Data)
- **Storage**: AWS S3 (via Amplify Storage)
- **AI Integration**: Claude AI for response analysis
- **Deployment**: AWS Amplify Hosting

## 🛠️ Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate permissions
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd north-playbook
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure AWS Amplify**
   ```bash
   # Initialize Amplify (if not already done)
   npx @aws-amplify/backend-cli@latest generate schema --yes
   
   # Deploy the backend
   npx @aws-amplify/backend-cli@latest deploy
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
north-playbook/
├── amplify/                 # AWS Amplify Gen 2 backend configuration
│   ├── auth/               # Authentication configuration
│   ├── data/               # Database schema and API
│   ├── storage/            # S3 storage configuration
│   └── backend.ts          # Main backend configuration
├── src/
│   ├── app/                # Next.js app router pages
│   │   ├── auth/           # Authentication page
│   │   ├── dashboard/      # User dashboard
│   │   ├── exercises/      # Exercise listing and individual exercises
│   │   ├── playbook/       # Personal playbook view
│   │   └── page.tsx        # Landing page
│   ├── components/         # Reusable React components
│   │   ├── layout/         # Navigation and layout components
│   │   └── providers/      # Context providers
│   └── lib/                # Utility functions and configurations
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

## 🎨 Key Components

### Authentication
- Secure user registration and login
- Profile management with user attributes
- Protected routes for authenticated users

### Exercises System
- Categorized personal development exercises
- Support for text, audio, and video responses
- Progress tracking and completion status

### AI Integration
- Claude AI analysis of user responses
- Personalized insights and recommendations
- Mood and sentiment analysis

### Playbook Generation
- Beautiful magazine-style layout
- PDF export functionality
- Shareable personal development stories

## 🚀 Deployment

### AWS Amplify Hosting

1. **Connect your repository to Amplify**
   ```bash
   # Using Amplify CLI
   amplify init
   amplify add hosting
   amplify publish
   ```

2. **Or deploy via AWS Console**
   - Go to AWS Amplify Console
   - Connect your Git repository
   - Configure build settings
   - Deploy automatically on push

### Environment Variables

The application uses AWS Amplify's automatic configuration. No manual environment variables are required for basic functionality.

## 🔧 Configuration

### Amplify Backend

The backend is configured in the `amplify/` directory:

- **Authentication**: Email-based signup with required user attributes
- **Data**: GraphQL API with user profiles, exercises, responses, and insights
- **Storage**: S3 bucket for media uploads with proper access controls

### Material-UI Theme

Custom theme configuration in `src/lib/theme.ts` with North branding:
- Primary color: Deep blue (#1a237e)
- Secondary color: Vibrant orange (#ff6b35)
- Custom component styling for buttons, cards, and navigation

## 📱 Usage

1. **Sign Up**: Create an account with email and basic profile information
2. **Explore Exercises**: Browse categorized personal development exercises
3. **Complete Exercises**: Respond with text, audio, or video
4. **View Insights**: Get AI-powered analysis and recommendations
5. **Build Playbook**: Watch your personal development story grow
6. **Export PDF**: Download your complete journey as a beautiful PDF

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the North team

## 🎯 Roadmap

- [ ] Advanced AI insights with trend analysis
- [ ] Social sharing features
- [ ] Mobile app development
- [ ] Integration with wearable devices
- [ ] Group challenges and community features
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

---

**Built with ❤️ by North - Empowering personal growth through technology.**
