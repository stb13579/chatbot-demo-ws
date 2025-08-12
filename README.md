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

To gracefully end a session, send the message `close` and the server will close the WebSocket connection.

## Running a Load Test

To simulate thousands of concurrent connections, use [Gatling](https://gatling.io/) or a similar load testing tool. Point the WebSocket scenario at `ws://localhost:3000` and configure the desired number of virtual users. There is a companion sample load test available [WebSockets JS load test](https://github.com/stb13579/WebSocketTestJS).

## Docker and ngrok

This repository includes a `Dockerfile` and `docker-compose.yml` to expose the server through [ngrok](https://ngrok.com) for remote load testing.

1. Create an ngrok account and obtain an auth token.
2. Copy `.env.example` to `.env` and add your token: `NGROK_AUTHTOKEN=<token>`.
3. Start the stack:

```bash
docker compose up --build
```

The ngrok service will print a forwarding URL such as `https://XXXX.ngrok-free.app`. Use this URL in your remote load testing tool to target the WebSocket server.
