import handler from './convert.js';

const mockReq = {
  headers: {
    origin: 'http://localhost:3000'
  },
  query: {
    url: encodeURIComponent('https://petapixel.com/feed/')
  },
  method: 'GET'
};

const mockRes = {
  statusCode: 200,
  headers: {},
  setHeader(name, val) {
    this.headers[name] = val;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    console.log('JSON RESPONSE:', this.statusCode, data);
    return this;
  },
  send(data) {
    console.log('SEND RESPONSE:', this.statusCode, data.substring(0, 200) + '...');
    return this;
  },
  end() {
    console.log('RESPONSE ENDED');
  }
};

console.log('Running test on handler...');
handler(mockReq, mockRes)
  .then(() => console.log('Handler test complete!'))
  .catch(err => {
    console.error('Handler test failed:', err);
    process.exit(1);
  });
