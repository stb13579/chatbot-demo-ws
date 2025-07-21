# Chatbot WebSocket Demo

This project provides a minimal WebSocket server and HTML client. It can be used to load test WebSocket connections for a chatbot-style application when combined with an external tool such as Gatling.

## Features

- Node.js server with a handcrafted WebSocket implementation.
- Simple HTML page that connects to the server and sends messages.

## Running the Server

```bash
node server.js
```

Open your browser to `http://localhost:3000` and interact with the chatbot. Messages are echoed back with a short "AI" prefix.

## Running a Load Test

To simulate thousands of concurrent connections, use [Gatling](https://gatling.io/) or a similar load testing tool. Point the WebSocket scenario at `ws://localhost:3000` and configure the desired number of virtual users.
