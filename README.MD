# Master List Project with Express and MongoDB

This project is a simple API built with TypeScript, Express, and MongoDB. It allows users to create, read, update, and delete lists in a MongoDB database. It also provides AI-generated suggestions for new list items.

## Getting Started

Follow these steps to set up and run the project locally:

- Install Node.js from [nodejs.org](https://nodejs.org/)
- Install Docker from [docker.com](https://www.docker.com/)
- Pull the MongoDB Docker image: `docker pull mongo`
- Start the MongoDB container: `docker run --name mongodb -d -p 27017:27017 -v mongo-data:/data/db mongo`
- Install backend dependencies: `npm install`
- Install frontend dependencies: `cd frontend && npm install`
- Create an `.env` file at the project root with values for `AUTH_KEY` and `OPENAI_API_KEY`
- Start the application from project root: `npm run dev:all`

To run the tests:

- Unit tests can be run at any time: `npm run test:unit`
- Integration tests require the Docker container to be running: `npm run test:integration`
- End to end tests require the Docker container and server to be running: `npm run test:endtoend`
- To run all tests, the Docker container and server must be running: `npm run test:all`
