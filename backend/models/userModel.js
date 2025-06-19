import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/db.js";
import { hashPassword, comparePassword } from "../utils/hashPassword.js";

class User extends Model {
  // compare typed password with hashed database password
  async comparePassword(candidatePassword) {
    return comparePassword(candidatePassword, this.password);
  }
}

// user model
User.init(
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      trim: true,
      validate: {
        len: [3, 20],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6],
      },
    },
    isFirstLogin: {
      type: DataTypes.BOOLEAN,
      defaultValue: true, // new users true
    },
  },
  {
    sequelize, // insures user model to database connection
    modelName: "User",
    hooks: {
      // hash password before saving the user
      beforeCreate: async (user) => {
        user.password = await hashPassword(user.password);
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          user.password = await hashPassword(user.password);
        }
      },
    },
  },
);

export default User;
