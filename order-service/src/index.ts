import { sequelize } from './config/database';  // Import Sequelize instance from config
import { OrderModel } from './models/order';    // Import your Order model to register it with Sequelize

// Sync the models with the database
sequelize.sync({ force: false })  // Set to `true` only if you want to drop tables during dev (be cautious)
  .then(() => {
    console.log('✅ Tables synced with the database');
    // You can start other services or consumers here
  })
  .catch((error) => {
    console.error('❌ Error syncing tables:', error);
  });
