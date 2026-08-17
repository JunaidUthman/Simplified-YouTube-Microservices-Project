# Simplified YouTube Microservices Platform

A simplified microservices-based YouTube architecture featuring decoupled services, object storage for direct video streaming, and containerized development environment.

## 📁 Repository Structure

```
Junaid_Tube/
├── apps/
│   ├── user-service/              # NestJS User Management Microservice
│   ├── video-service/             # Video Metadata API Microservice (Node.js/Python)
│   ├── auth-service/              # Authentication Microservice
│   └── frontend/                  # React / HTML5 Video Player UI
├── docker-compose.yml             # Hot-reload Docker Compose setup
├── .env.example
├── .gitignore
└── README.md
```

## 🚀 Microservices Architecture

- **User Management Service (`apps/user-service`)**: NestJS microservice performing full user CRUD operations backed by PostgreSQL.
- **Video API (`apps/video-service`)**: Serves video metadata (titles, descriptions, storage URLs).
- **Object Storage (MinIO / S3)**: Hosts `.mp4` video files. Video player frontend fetches videos directly from MinIO to prevent backend bottlenecks.
- **API Gateway (NGINX)**: Handles routing in Kubernetes deployment.

## ⚡ Running locally with Docker Compose

```bash
docker-compose up --build
```

- **User Microservice**: http://localhost:3001
- **PostgreSQL**: localhost:5432

## 🧪 Testing User Service

```bash
cd apps/user-service
npm test
```
