const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createAcceptValue(key) {
  return crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', 'binary')
    .digest('base64');
}

function encodeMessage(str) {
  const payload = Buffer.from(str);
  const length = payload.length;
  let frame;
  if (length < 126) {
    frame = Buffer.alloc(2 + length);
    frame[1] = length;
    payload.copy(frame, 2);
  } else {
    frame = Buffer.alloc(4 + length);
    frame[1] = 126;
    frame.writeUInt16BE(length, 2);
    payload.copy(frame, 4);
  }
  frame[0] = 0x81; // FIN and text frame opcode
  return frame;
}

function decodeMessage(buffer) {
  const secondByte = buffer[1];
  const isMasked = Boolean(secondByte & 0x80);
  let length = secondByte & 0x7f;
  let offset = 2;
  if (length === 126) {
    length = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (length === 127) {
    // Note: this simple example doesn't handle payloads larger than 2^32
    length = Number(buffer.readBigUInt64BE(offset));
    offset += 8;
  }
  let mask;
  if (isMasked) {
    mask = buffer.slice(offset, offset + 4);
    offset += 4;
  }
  const payload = buffer.slice(offset, offset + length);
  if (isMasked) {
    for (let i = 0; i < payload.length; i++) {
      payload[i] ^= mask[i % 4];
    }
  }
  return payload.toString('utf8');
}

const server = http.createServer((req, res) => {
  const reqPath = req.url === '/' ? '/index.html' : decodeURIComponent(req.url);
  const filePath = path.join(__dirname, 'public', reqPath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end();
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const types = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };

    const contentType = types[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.on('upgrade', (req, socket) => {
  if (req.headers['upgrade'] !== 'websocket') {
    socket.destroy();
    return;
  }
  const acceptKey = req.headers['sec-websocket-key'];
  const acceptValue = createAcceptValue(acceptKey);
  const responseHeaders = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptValue}`
  ];
  socket.write(responseHeaders.join('\r\n') + '\r\n\r\n');

  socket.on('error', (err) => {
    console.error('WebSocket error:', err);
  });

  socket.on('data', (buffer) => {
    const message = decodeMessage(buffer);
    if (!message) return;
    const reply = `PARROT: "${message}"`;
    const delay = Math.random() * 2000;
    setTimeout(() => {
      socket.write(encodeMessage(reply));
    }, delay);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
