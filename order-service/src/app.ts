import { startService } from './orderService';

startService().catch((error) => {
  console.error('Failed to start order service:', error);
});
