# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CZ ID is a hypothesis-free global software platform for identifying pathogens in metagenomic sequencing data. This is a full-stack Ruby on Rails application with a React/TypeScript frontend that helps scientists identify pathogens in metagenomic sequencing data.

## Common Development Commands

### Frontend Development
- `npm start` - Start webpack development server with hot reloading
- `npm run build-img` - Build production frontend assets
- `npm run lint` - Run ESLint on JavaScript/TypeScript files
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run Jest tests
- `npm run relay` - Compile GraphQL relay queries

### Backend Development (Rails)
- `make local-start` - Start all Docker containers for local development
- `make local-start-webapp` - Start containers and webpack server (runs on http://localhost:3001)
- `make local-migrate` - Run database migrations
- `make local-seed-migrate` - Run seed migrations
- `make local-railsc` - Access Rails console
- `make local-console` - Get bash shell in web container
- `make rspec` - Run RSpec tests
- `bundle exec rubocop` - Run RuboCop linter for Ruby code
- `bundle exec rubocop --auto-correct` - Run RuboCop with auto-correction

### Database Management
- `make local-db-setup` - Create database and run seeds
- `make local-db-reset` - Reset database (drop, create, load schema, run seeds)
- `make local-migrate` - Run database migrations
- `make local-dbconsole` - Access MySQL console

### Docker Development
- `make local-init` - Set up local development environment
- `make local-build` - Build Docker containers
- `make local-stop` - Stop containers
- `make local-down` - Tear down containers

## Architecture Overview

### Backend Structure
- **Ruby on Rails 7.0** application with MySQL database
- **GraphQL API** with GraphiQL development interface
- **Background jobs** using Resque with Redis
- **Authentication** via Auth0 with JWT tokens
- **File storage** on AWS S3 with direct upload capabilities
- **Search** using Elasticsearch/OpenSearch
- **Bioinformatics workflows** dispatched via AWS Step Functions

### Frontend Structure
- **React 18** with TypeScript
- **Relay** for GraphQL client
- **Material-UI v5** and CZI Design System components
- **Webpack** for bundling with hot module replacement
- **SCSS** for styling with semantic-ui-css base

### Key Directories
- `app/` - Rails application code
  - `controllers/` - API and web controllers
  - `models/` - ActiveRecord models
  - `services/` - Business logic services
  - `jobs/` - Background job classes
  - `assets/src/` - React/TypeScript frontend code
- `spec/` - RSpec test files
- `e2e/` - Playwright end-to-end tests
- `config/` - Rails configuration
- `db/` - Database migrations and seeds

### Data Models
- **Sample** - Core entity representing uploaded sequencing data
- **Project** - Groups samples, controls access permissions
- **PipelineRun** - Tracks bioinformatics pipeline execution
- **WorkflowRun** - Handles different workflow types (AMR, consensus genome, etc.)
- **TaxonCount** - Stores taxonomic analysis results
- **User** - Authentication and authorization

### Key Features
- **Sample Upload** - Handles FASTQ file upload and metadata
- **Metagenomics Pipeline** - Identifies pathogens in samples
- **AMR Analysis** - Antimicrobial resistance detection
- **Consensus Genome** - Viral genome assembly
- **Phylogenetic Trees** - Evolutionary analysis
- **Heatmaps** - Comparative visualization
- **Bulk Downloads** - Export analysis results

## Development Notes

### Frontend Code Organization
- Components use functional components with hooks
- State management via React Context and useReducer
- API calls handled through Relay GraphQL or REST endpoints
- Type definitions in `interface/` directory
- Shared utilities in `components/utils/`

### Backend Code Organization
- Follow Rails conventions for MVC pattern
- Services handle complex business logic
- Background jobs for long-running operations
- GraphQL schema defined in `app/graphql/`
- API controllers return JSON responses

### Testing and Code Quality
- Frontend: Jest + Enzyme for unit tests
- Backend: RSpec for unit and integration tests
- E2E: Playwright for end-to-end testing
- Run `make rspec` for backend tests
- Run `npm test` for frontend tests
- **IMPORTANT**: Always run `bundle exec rubocop` before committing Ruby code to ensure style compliance
- Use `bundle exec rubocop --auto-correct` to fix most style issues automatically

### Database
- MySQL with ActiveRecord ORM
- Use `make local-migrate` to run migrations
- Seed data managed through seed migrations
- Foreign key constraints enforced

### Key Configuration
- Environment variables in `web.env` for local development
- Rails environments: development, test, staging, prod
- AWS configuration for S3, SQS, Step Functions
- Auth0 configuration for authentication
- Elasticsearch/OpenSearch for search functionality

## Workflow Types
- **mNGS** - Metagenomic Next Generation Sequencing
- **AMR** - Antimicrobial Resistance
- **Consensus Genome** - Viral genome assembly
- **Phylogenetic Tree** - Evolutionary analysis
- **Benchmark** - Pipeline performance testing