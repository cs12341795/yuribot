import { createLogger, stdSerializers } from 'bunyan';
import config from '../config';

const logger = createLogger({
  name: 'yuribot',
  serializers: stdSerializers,
  streams: [
    {
      stream: process.stdout,
      level: config.logger.level
    }
  ]
});

export default logger;
