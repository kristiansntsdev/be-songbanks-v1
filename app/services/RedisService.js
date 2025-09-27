import { createClient } from "redis";
import crypto from "crypto";

class RedisService {
  static client = null;
  static isConnected = false;

  static async connect() {
    if (this.client && this.isConnected) {
      return this.client;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || "redis://localhost:6379",
      });

      this.client.on("error", (err) => {
        console.error("Redis Client Error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("Redis Client Connected");
        this.isConnected = true;
      });

      this.client.on("disconnect", () => {
        console.log("Redis Client Disconnected");
        this.isConnected = false;
      });

      await this.client.connect();
      this.isConnected = true;
      return this.client;
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      this.isConnected = false;
      return null;
    }
  }

  static async disconnect() {
    if (this.client && this.isConnected) {
      try {
        await this.client.disconnect();
        this.isConnected = false;
        this.client = null;
      } catch (error) {
        console.error("Error disconnecting from Redis:", error);
      }
    }
  }

  static generateCacheKey(prefix, data) {
    const hash = crypto
      .createHash("md5")
      .update(JSON.stringify(data))
      .digest("hex");
    return `${prefix}:${hash}`;
  }

  static async get(key) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      if (!this.client || !this.isConnected) {
        return null;
      }

      const result = await this.client.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      console.error("Redis GET error:", error);
      return null;
    }
  }

  static async set(key, value, ttl = null) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      if (!this.client || !this.isConnected) {
        return false;
      }

      const stringValue = JSON.stringify(value);

      if (ttl) {
        await this.client.setEx(key, ttl, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }

      return true;
    } catch (error) {
      console.error("Redis SET error:", error);
      return false;
    }
  }

  static async del(key) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      if (!this.client || !this.isConnected) {
        return false;
      }

      await this.client.del(key);
      return true;
    } catch (error) {
      console.error("Redis DEL error:", error);
      return false;
    }
  }

  static async deletePattern(pattern) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      if (!this.client || !this.isConnected) {
        return false;
      }

      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error("Redis DELETE PATTERN error:", error);
      return false;
    }
  }

  static async exists(key) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      if (!this.client || !this.isConnected) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error("Redis EXISTS error:", error);
      return false;
    }
  }
}

export default RedisService;
