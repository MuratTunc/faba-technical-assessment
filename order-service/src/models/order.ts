// src/models/orders.ts
import { Sequelize, Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';  // Make sure this is pointing to the correct database config

export interface Order {
  id: string;
  customerName: string;
  items: string[];
  total: number;
  status: string;
}

export class OrderModel extends Model<Order> {
  public id!: string;
  public customerName!: string;
  public items!: string[];
  public total!: number;
  public status!: string;
}

OrderModel.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    items: {
      type: DataTypes.JSON, // JSON field for an array of items
      allowNull: false,
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,  // Pass Sequelize instance
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,  // Enable timestamps
  }
);
