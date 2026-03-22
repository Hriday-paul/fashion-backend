import { createClient } from 'redis';
import { Queue } from 'bullmq';
import config from '../config';

const redisUrl = `redis://${config?.redis.password}@${config.redis.host}:${config.redis.port}`

const redisPub = createClient({ url: redisUrl });
const subClient = redisPub .duplicate();

const connectRedis = async () => {
  await Promise.all([redisPub .connect(), subClient.connect()]);
  console.log('✨ Connected to Redis server');
};

// BullMQ Queue (use proper connection object)
const messageQueue = new Queue('save_messages', {
  connection: {
    host: config.redis.host,
    port: Number(config.redis.port),
  },
});

// const messageQueue = new Queue('save_messages', {
//   connection: pubClient,
// });

export { redisPub , subClient, connectRedis, messageQueue };
