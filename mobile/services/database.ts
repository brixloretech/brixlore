import * as SQLite from "expo-sqlite";

export type DownloadMetadata = {
  id?: number;
  contentId: string;
  filePath: string;
  expiresAt: number;
  createdAt: number;
  fileSize?: number;
  title?: string;
};

export type NotificationMetadata = {
  id?: number;
  notificationId: string;
  title: string;
  body: string;
  data: string; // JSON string
  receivedAt: number;
  read: number; // 0 or 1 (boolean)
  type: string;
};

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    // Already initialized
    if (this.db) {
      return;
    }

    this.initPromise = this._initializeDatabase();
    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  private async _initializeDatabase(): Promise<void> {
    try {
      console.log("[Database] Initializing SQLite database...");
      this.db = await SQLite.openDatabaseAsync("downloads.db");
      console.log("[Database] Database opened successfully");
      await this.createTables();
      console.log("[Database] Tables created successfully");
    } catch (error) {
      console.error("[Database] Failed to initialize database:", error);
      this.db = null;
      // Don't throw - allow app to continue without local database
      // Database features will be disabled but app remains functional
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      console.warn(
        "[Database] Cannot create tables - database not initialized",
      );
      return;
    }

    try {
      await this.db.runAsync(
        `CREATE TABLE IF NOT EXISTS downloads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contentId TEXT UNIQUE NOT NULL,
        filePath TEXT NOT NULL,
        expiresAt INTEGER NOT NULL,
        createdAt INTEGER NOT NULL,
        fileSize INTEGER,
        title TEXT
      )`,
      );
      await this.db.runAsync(
        "CREATE INDEX IF NOT EXISTS idx_content_id ON downloads(contentId)",
      );
      await this.db.runAsync(
        "CREATE INDEX IF NOT EXISTS idx_expires_at ON downloads(expiresAt)",
      );

      await this.db.runAsync(
        `CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        notificationId TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        data TEXT,
        receivedAt INTEGER NOT NULL,
        read INTEGER DEFAULT 0,
        type TEXT DEFAULT 'info'
      )`,
      );
      await this.db.runAsync(
        "CREATE INDEX IF NOT EXISTS idx_notification_id ON notifications(notificationId)",
      );
      await this.db.runAsync(
        "CREATE INDEX IF NOT EXISTS idx_notification_received ON notifications(receivedAt)",
      );
      await this.db.runAsync(
        "CREATE INDEX IF NOT EXISTS idx_notification_read ON notifications(read)",
      );
    } catch (error) {
      console.error("[Database] Failed to create tables:", error);
      throw error;
    }
  }

  async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error(
        "Database initialization failed. Some features may be unavailable.",
      );
    }
    return this.db;
  }

  async insertDownload(metadata: DownloadMetadata): Promise<number> {
    const db = await this.getDatabase();

    const result = await db.runAsync(
      `INSERT INTO downloads (contentId, filePath, expiresAt, createdAt, fileSize, title)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        metadata.contentId,
        metadata.filePath,
        metadata.expiresAt,
        metadata.createdAt || Date.now(),
        metadata.fileSize || null,
        metadata.title || null,
      ],
    );

    return result.lastInsertRowId;
  }

  async getDownloadByContentId(
    contentId: string,
  ): Promise<DownloadMetadata | null> {
    const db = await this.getDatabase();

    const result = await db.getFirstAsync<DownloadMetadata>(
      `SELECT * FROM downloads WHERE contentId = ?`,
      [contentId],
    );

    return result || null;
  }

  async getAllDownloads(): Promise<DownloadMetadata[]> {
    const db = await this.getDatabase();

    const result = await db.getAllAsync<DownloadMetadata>(
      `SELECT * FROM downloads ORDER BY createdAt DESC`,
    );

    return result || [];
  }

  async deleteDownload(contentId: string): Promise<boolean> {
    const db = await this.getDatabase();

    const result = await db.runAsync(
      `DELETE FROM downloads WHERE contentId = ?`,
      [contentId],
    );

    return result.changes > 0;
  }

  async deleteExpiredDownloads(): Promise<number> {
    const db = await this.getDatabase();
    const now = Date.now();

    const result = await db.runAsync(
      `DELETE FROM downloads WHERE expiresAt < ?`,
      [now],
    );

    return result.changes;
  }

  async updateDownloadPath(
    contentId: string,
    filePath: string,
  ): Promise<boolean> {
    const db = await this.getDatabase();

    const result = await db.runAsync(
      `UPDATE downloads SET filePath = ? WHERE contentId = ?`,
      [filePath, contentId],
    );

    return result.changes > 0;
  }

  async insertNotification(metadata: NotificationMetadata): Promise<number> {
    const db = await this.getDatabase();

    const result = await db.runAsync(
      `INSERT OR REPLACE INTO notifications (notificationId, title, body, data, receivedAt, read, type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        metadata.notificationId,
        metadata.title,
        metadata.body,
        metadata.data,
        metadata.receivedAt,
        metadata.read,
        metadata.type || "info",
      ],
    );

    return result.lastInsertRowId;
  }

  async getAllNotifications(): Promise<NotificationMetadata[]> {
    const db = await this.getDatabase();

    const result = await db.getAllAsync<NotificationMetadata>(
      `SELECT * FROM notifications ORDER BY receivedAt DESC`,
    );

    return result || [];
  }

  async getUnreadNotifications(): Promise<NotificationMetadata[]> {
    const db = await this.getDatabase();

    const result = await db.getAllAsync<NotificationMetadata>(
      `SELECT * FROM notifications WHERE read = 0 ORDER BY receivedAt DESC`,
    );

    return result || [];
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    const db = await this.getDatabase();

    const result = await db.runAsync(
      `UPDATE notifications SET read = 1 WHERE notificationId = ?`,
      [notificationId],
    );

    return result.changes > 0;
  }

  async markAllAsRead(): Promise<number> {
    const db = await this.getDatabase();

    const result = await db.runAsync(
      `UPDATE notifications SET read = 1 WHERE read = 0`,
    );

    return result.changes;
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    const db = await this.getDatabase();

    const result = await db.runAsync(
      `DELETE FROM notifications WHERE notificationId = ?`,
      [notificationId],
    );

    return result.changes > 0;
  }

  async deleteAllNotifications(): Promise<number> {
    const db = await this.getDatabase();

    const result = await db.runAsync(`DELETE FROM notifications`);

    return result.changes;
  }
}

export const databaseService = new DatabaseService();
