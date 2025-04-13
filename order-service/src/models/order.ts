import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';  // Make sure this is pointing to the correct database config

export interface Order {
  id: string;
  customerName: string;
  item: string;        // Changed from "items" to a single "item"
  total: number;
  status: string;
}

export class OrderModel extends Model<Order> {
  public id!: string;
  public customerName!: string;
  public item!: string;  // Changed field name
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
    item: {            
      type: DataTypes.STRING,  
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
