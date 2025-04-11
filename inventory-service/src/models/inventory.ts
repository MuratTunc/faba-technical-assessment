// src/models/inventoryModel.ts
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';  

interface InventoryAttributes {
  id: string;
  items: string[];
  total: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class InventoryModel extends Model<InventoryAttributes> {}

InventoryModel.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    items: {
      type: DataTypes.ARRAY(DataTypes.STRING), // Store an array of item names or IDs
      allowNull: false,
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Inventory',
    tableName: 'inventories', // Table name
    timestamps: true,
    updatedAt: 'updatedAt',
  }
);

export default InventoryModel;
