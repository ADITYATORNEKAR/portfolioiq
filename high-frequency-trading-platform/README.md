# High-Frequency Trading Platform

This repository contains a high-frequency trading platform that integrates causal inference and multi-agent systems. The project is structured as a monorepo, with separate directories for the frontend and backend components.

## Project Structure

```
high-frequency-trading-platform
├── frontend          # Frontend application built with Next.js and Tailwind CSS
│   ├── public        # Static assets (images, fonts)
│   ├── src           # Source code for the frontend
│   │   ├── components # Reusable React components
│   │   ├── pages      # Next.js pages
│   │   ├── styles     # Global styles and Tailwind CSS configurations
│   │   └── utils      # Utility functions and helpers
│   ├── tailwind.config.js # Tailwind CSS configuration
│   ├── next.config.js     # Next.js configuration
│   ├── package.json        # NPM dependencies and scripts
│   └── README.md           # Frontend documentation
├── backend           # Backend application built with FastAPI
│   ├── app           # Main application directory
│   │   ├── api       # FastAPI route definitions
│   │   ├── models    # Data models and schemas
│   │   ├── services  # Business logic and data processing
│   │   └── main.py   # Entry point for the FastAPI application
│   ├── requirements.txt # Python dependencies
│   ├── Dockerfile    # Docker image instructions
│   └── README.md     # Backend documentation
├── .gitignore        # Git ignore file for Node and Python environments
├── docker-compose.yml # Docker Compose configuration
├── CI_CD_config.yml  # CI/CD configuration for automated workflows
└── README.md         # Overall project documentation
```

## Features

- **High-Frequency Trading**: Implements algorithms for executing trades at high speeds.
- **Causal Inference**: Utilizes advanced statistical methods to infer causal relationships in trading data.
- **Multi-Agent Systems**: Supports multiple agents interacting within the trading environment.

## Getting Started

### Prerequisites

- Node.js and npm for the frontend
- Python 3.8+ for the backend
- Docker and Docker Compose for containerization

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd high-frequency-trading-platform
   ```

2. Set up the frontend:
   ```
   cd frontend
   npm install
   ```

3. Set up the backend:
   ```
   cd backend
   pip install -r requirements.txt
   ```

### Running the Application

- To run the frontend:
  ```
  cd frontend
  npm run dev
  ```

- To run the backend:
  ```
  cd backend
  uvicorn app.main:app --reload
  ```

### CI/CD

The project includes a CI/CD configuration file (`CI_CD_config.yml`) for automated testing and deployment. Ensure your CI/CD environment is set up to use this configuration.

## Documentation

Refer to the individual `README.md` files in the `frontend` and `backend` directories for more detailed documentation on each component.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.