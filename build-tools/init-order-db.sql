-- build-tools/init-order-db.sql

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(255) PRIMARY KEY,           -- Corresponds to the 'id' field in the Sequelize model
  customerName VARCHAR(255) NOT NULL,     -- Corresponds to 'customerName'
  item JSON NOT NULL,                     -- Updated field: now stores a single item in JSON format
  total FLOAT NOT NULL,                   -- Corresponds to the 'total' field
  status VARCHAR(255) NOT NULL,           -- Corresponds to 'status'
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Sequelize auto-generates this
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP   -- Sequelize auto-generates this
);
