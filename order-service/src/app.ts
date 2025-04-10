import { startService } from './services/orderService'

startService().catch((error) => {
  console.error('Failed to start order service:', error);
});
