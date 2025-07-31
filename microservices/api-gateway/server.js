const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const promClient = require('prom-client');
const axios = require('axios');
const CircuitBreaker = require('circuit-breaker-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'api-gateway.log' })
  ]
});

// Configure Prometheus metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics();

const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Circuit breaker configuration
const circuitBreakerOptions = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
};

// Service URLs (in production, these would be service discovery)
const SERVICES = {
  user: process.env.USER_SERVICE_URL || 'http://user-service:3002',
  order: process.env.ORDER_SERVICE_URL || 'http://order-service:3003',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3004'
};

// Circuit breakers for each service
const circuitBreakers = {
  user: new CircuitBreaker(axios, circuitBreakerOptions),
  order: new CircuitBreaker(axios, circuitBreakerOptions),
  notification: new CircuitBreaker(axios, circuitBreakerOptions)
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    };
    
    httpRequestDurationMicroseconds.observe(labels, duration / 1000);
    httpRequestsTotal.inc(labels);
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {}
  };

  // Check downstream services
  Promise.allSettled([
    checkServiceHealth('user', '/health'),
    checkServiceHealth('order', '/health'),
    checkServiceHealth('notification', '/health')
  ]).then(results => {
    results.forEach((result, index) => {
      const serviceName = Object.keys(SERVICES)[index];
      health.services[serviceName] = result.status === 'fulfilled' ? 'healthy' : 'unhealthy';
    });

    const allHealthy = Object.values(health.services).every(status => status === 'healthy');
    res.status(allHealthy ? 200 : 503).json(health);
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// API Routes
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/orders', require('./routes/orders'));
app.use('/api/v1/notifications', require('./routes/notifications'));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Helper function to check service health
async function checkServiceHealth(serviceName, endpoint) {
  try {
    const response = await axios.get(`${SERVICES[serviceName]}${endpoint}`, {
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    throw new Error(`Service ${serviceName} is unhealthy: ${error.message}`);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`API Gateway started on port ${PORT}`);
  console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
  console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
  console.log(`❤️  Health check at http://localhost:${PORT}/health`);
});

module.exports = app; 