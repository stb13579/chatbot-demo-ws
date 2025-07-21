# Chatbot WebSocket Demo

This project provides a minimal WebSocket server and a React + Tailwind CSS client. It can be used to experiment with WebSocket connections for a chatbot-style application or to run load tests with tools such as Gatling.

## Features

- Node.js server with a handcrafted WebSocket implementation.
- React frontend styled with Tailwind CSS and a simple SaaS look for **Acme Healthcare**.

## Running the Server

```bash
node server.js
```

Open your browser to `http://localhost:3000` and chat with the bot. Messages are echoed back with an "AI" prefix.

## Running a Load Test

To simulate thousands of concurrent connections, use [Gatling](https://gatling.io/) or a similar load testing tool. Point the WebSocket scenario at `ws://localhost:3000` and configure the desired number of virtual users.
