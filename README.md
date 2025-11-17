# Circle.so + Google Tasks Integration

Integration between Circle.so community and Google Tasks API using Google Cloud Functions.

## Project Details

- **Project Name**: circle-tasks-integration
- **Google Cloud Project ID**: onboarding-tasks-automation
- **Domain**: citylifestyle.com
- **Circle Community**: https://citylifestyle.circle.so
- **GitHub**: ryrykerr/circle-tasks-integration

## Architecture

This project uses Google Cloud Functions (Node.js 20) to provide REST API endpoints that integrate Circle.so with Google Tasks.

### Functions

1. **getTasks** - Retrieve tasks from Google Tasks API
2. **completeTask** - Mark a task as complete
3. **uncompleteTask** - Mark a task as incomplete

### Authentication

Uses Google Service Account with domain-wide delegation for secure API access.

## Setup

See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.

## Deployment

```bash
./deploy.sh
```

## Development

Each function is self-contained in its own directory with individual `package.json` files.

## Security

- Service account credentials are never committed to git
- All sensitive files are excluded via `.gitignore`
- Domain-wide delegation restricts access scope

## License

Proprietary
