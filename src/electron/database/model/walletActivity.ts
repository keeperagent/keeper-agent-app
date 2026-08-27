import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "WalletActivity",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      walletId: { type: DataTypes.INTEGER, allowNull: false },
      walletGroupId: { type: DataTypes.INTEGER, allowNull: true },
      walletAddress: { type: DataTypes.STRING, allowNull: false },

      chain: { type: DataTypes.STRING, allowNull: false },
      txHash: { type: DataTypes.STRING, allowNull: true },
      actionType: { type: DataTypes.STRING, allowNull: false },
      protocol: { type: DataTypes.STRING, allowNull: true },
      source: { type: DataTypes.STRING, allowNull: true },
      receiverAddress: { type: DataTypes.STRING, allowNull: true },

      token0Address: { type: DataTypes.STRING, allowNull: true },
      token0Symbol: { type: DataTypes.STRING, allowNull: true },
      token0Amount: { type: DataTypes.STRING, allowNull: true },
      token0UsdValue: { type: DataTypes.FLOAT, allowNull: true },

      token1Address: { type: DataTypes.STRING, allowNull: true },
      token1Symbol: { type: DataTypes.STRING, allowNull: true },
      token1Amount: { type: DataTypes.STRING, allowNull: true },
      token1UsdValue: { type: DataTypes.FLOAT, allowNull: true },

      createAt: { type: DataTypes.INTEGER, allowNull: false },
      updateAt: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
      indexes: [
        { fields: ["walletAddress", "createAt"] },
        { fields: ["walletGroupId", "createAt"] },
      ],
    },
  );
