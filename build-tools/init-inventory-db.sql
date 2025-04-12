-- Create the inventory table if it doesn't already exist
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  productId TEXT NOT NULL,  -- Add product ID for identifying items in inventory
  items TEXT[] NOT NULL,    -- Array of items (names or IDs)
  quantity INTEGER NOT NULL DEFAULT 0,  -- Quantity of the item in stock
  total DECIMAL(10, 2) NOT NULL,  -- Total value of the inventory, or total quantity value
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Creation timestamp
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP   -- Update timestamp
);