# Nexly: Smart Web Resource Capture & Knowledge Management

## Overview
Nexly is a full-stack solution for capturing, organizing, and retrieving web content efficiently. It features a browser extension for instant content capture, a React-based web dashboard, and a scalable AWS-backed backend. Nexly leverages AI for intelligent tagging and search, and integrates with ServiceNow for enterprise workflows.

## Features
- **Browser Extension**: Capture text and images from any web page in one click.
- **Smart Tagging**: AI-powered automatic tag and category generation.
- **Cloud Storage**: All resources are securely stored in AWS (DynamoDB, S3).
- **Instant Search**: Context-aware search and Copilot AI chat for fast answers.
- **Email Notifications**: Users receive notifications when resources are saved.
- **Admin Dashboard**: View all resource categories and user activity.
- **ServiceNow Integration**: Syncs data for enterprise reporting and automation.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Framer Motion, Vite
- **Extension**: JavaScript, Chrome Extension APIs
- **Backend**: Node.js, Express.js, AWS Lambda, DynamoDB, S3
- **Integrations**: OpenAI API, ServiceNow REST API, AWS SES (email)
- **Deployment**: AWS Amplify (frontend), AWS Lambda/API Gateway (backend)

## Getting Started

### Prerequisites
- Node.js & npm
- AWS account (for backend deployment)
- Chrome (for extension)




### INSTALLATION

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/Nexly.git
   cd Nexly
   ```
2. **No need to Install dependencies:**

3. **Run the backend locally:**
   ```sh
   cd Extension_backend/updated_version/nexly_project/backend
   node app.js
   ```
4. **Run the frontend locally:**
   ```sh
   cd ../../../../../
   npm run dev
   ```
6. **Load the extension in Chrome:**
   - Go to `chrome://extensions/`
   - Enable Developer Mode
   - Click "Load unpacked" and select the `extension` folder

## Usage
- Use the browser extension to capture content from any web page.
- View, search, and manage your resources in the web dashboard.
- Admins can monitor all resources and categories.
- Receive email notifications for new resources.
- Integrate with ServiceNow for advanced workflows.

## Project Structure
```
project_daemon/
├── Extension_backend/
│   └── updated_version/
│       └── nexly_project/
│           ├── backend/         # Node.js/Express backend
│           └── extension/       # Chrome extension source
├── src/                        # React frontend
│   ├── components/
│   ├── contexts/
│   ├── pages/
│   └── ...
├── public/
├── package.json
├── vite.config.js
└── ...
```

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
This project is licensed under the MIT License.

## Contact
For questions or support, please open an issue or contact the maintainer at [g.obulreddy3690@.com].