// api-gateway/src/utils/gracefulShutdown.ts
import http from 'http';
import logger from './logger';
import { Channel } from 'amqplib';

export const gracefulShutdown = (server: http.Server, channel: Channel) => {
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    
    // Close RabbitMQ channel
    if (channel) {
      channel.close()
        .then(() => {
          logger.info('🐇 RabbitMQ channel closed');
        })
        .catch((err) => {
          logger.error('❌ Error closing RabbitMQ channel:', err);
        });
    }

    // Close the HTTP server
    server.close(() => {
      logger.info('Closed out remaining connections');
      process.exit(0); // Exit the process after cleanup
    });

    // Force shutdown if the cleanup takes longer than 10 seconds
    setTimeout(() => {
      logger.error('Forcefully shutting down due to timeout');
      process.exit(1);
    }, 10000);
  });

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    
    // Close RabbitMQ channel
    if (channel) {
      channel.close()
        .then(() => {
          logger.info('🐇 RabbitMQ channel closed');
        })
        .catch((err) => {
          logger.error('❌ Error closing RabbitMQ channel:', err);
        });
    }

    // Close the HTTP server
    server.close(() => {
      logger.info('Closed out remaining connections');
      process.exit(0); // Exit the process after cleanup
    });

    setTimeout(() => {
      logger.error('Forcefully shutting down due to timeout');
      process.exit(1);
    }, 10000);
  });
};
