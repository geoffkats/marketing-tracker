# Marketing Tracker

A comprehensive marketing campaign tracking and analytics platform for educational institutions, built for Code Academy Uganda.

## 👨‍💻 Developer & Citation

**Developed by:**  
**kato Geoffrey**
**synthilogic Enterprise**
Email: katogeoffreyg@gmail.com  
GitHub: [@geoffkats](https://github.com/geoffkats)

> This project was designed and developed by kato Geoffrey  for Code Academy Uganda's marketing operations and campaign management needs.

---

## 🚀 Features

### Core Features
- **Campaign Management** - Track multiple marketing campaigns with budgets, targets, and timelines
- **UTM Builder** - Generate and manage UTM tracking links for all channels
- **Asset Manager** - Organize campaign assets with Google Drive integration
- **Data Ingestion** - Import marketing data via CSV or manual entry
- **Alert System** - Set up threshold-based alerts for key metrics

### AI-Powered Features
- **AI Strategist** - Get AI-powered campaign recommendations
- **Enrollment Forecast** - Predict campaign registration outcomes
- **Lead Nurture** - Manage and track lead follow-ups
- **Influencer ROI** - Track influencer campaign performance

### Enterprise Features
- **Multi-Project Support** - Manage multiple clients/organizations
- **Role-Based Access** - Admin, user, and viewer roles
- **Rate Limiting** - API protection against abuse
- **Audit Logging** - Track all user actions

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Prisma ORM)
- **Auth:** NextAuth.js
- **UI:** Tailwind CSS + shadcn/ui
- **Validation:** Zod

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/geoffkats/marketing-tracker.git
cd marketing-tracker
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your values
```

4. Run database migrations:
```bash
bunx prisma db push
```

5. Start the development server:
```bash
bun run dev
```

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for JWT signing |
| `NEXTAUTH_URL` | Your app URL |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret (optional) |

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Environment Setup

Generate a NextAuth secret:
```bash
openssl rand -base64 32
```

## 📊 Database Schema

The application uses PostgreSQL with the following main models:
- User, Account, Session (Authentication)
- Client (Multi-project support)
- Campaign, Asset, UTMLink (Core)
- RawData, KPITarget, AlertSetting (Analytics)
- Lead, Influencer, Forecast (Advanced)

## 🤝 Contributing

We welcome contributions to Marketing Tracker! Please follow these guidelines:

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m "feat: add new feature"`

### Code Standards
- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Write meaningful commit messages using conventional commits
- Add tests for new features when applicable
- Update documentation as needed

### Pull Request Process
1. Ensure all tests pass and code follows style guidelines
2. Update README.md if you add new features or change functionality
3. Submit PR with clear description of changes and testing approach
4. Address any review feedback promptly

### Reporting Issues
- Use GitHub Issues to report bugs or request features
- Provide detailed descriptions with steps to reproduce
- Include relevant environment information

## 📝 License

MIT License - Copyright (c) 2024 Code Academy Uganda

See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Code Academy Uganda for the opportunity to build this solution
- The open-source community for the amazing tools and libraries

---

<div align="center">

**Built with ❤️ by kat Geoffrey Synhtilogic for Code Academy Uganda**

[GitHub](https://github.com/geoffkats/marketing-tracker) · [Report Bug](https://github.com/geoffkats/marketing-tracker/issues) · [Request Feature](https://github.com/geoffkats/marketing-tracker/issues)

</div>
