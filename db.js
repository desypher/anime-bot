// db.js
const mysql = require("mysql2/promise");
const mongoose = require("mongoose");

let mysqlPool = null;

async function initDatabases() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MongoDB URI not provided");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB connected");
  } catch (mongoErr) {
    console.warn("⚠️ Mongo failed, trying MySQL:", mongoErr.message);

    mysqlPool = await mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USERNAME,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Test MySQL connection
    try {
      const connection = await mysqlPool.getConnection();
      await connection.ping(); // Confirm it's alive
      connection.release(); // Release back to pool

      console.log("✅ MySQL connected");
    } catch (mysqlErr) {
      console.error("❌ MySQL connection failed:", mysqlErr.message);
    }
  }
}

function isMongo() {
  return mongoose.connection?.readyState === 1;
}

module.exports = {
  initDatabases,
  isMongo,
  get mysqlPool() {
    return mysqlPool;
  },
};
