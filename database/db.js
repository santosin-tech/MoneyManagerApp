// database/db.js
import * as SQLite from "expo-sqlite";
import { seedDatabase } from "./seed";

let dbInstance = null;
let initPromise = null;
let isReady = false;

/**
 * Returns a valid database connection.
 * Uses a single shared promise so multiple calls wait for the same opening process.
 */
export async function getDatabase() {
  // If we already have a working instance, return it
  if (dbInstance && isReady) {
    return dbInstance;
  }

  // If initialization is already in progress, wait for it
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = (async () => {
    try {
      console.log("Opening database connection...");
      dbInstance = await SQLite.openDatabaseAsync("moneymanager.db");

      await dbInstance.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
      `);

      isReady = true;
      console.log("Database connection ready");
      return dbInstance;
    } catch (error) {
      console.error("Failed to open database:", error);
      dbInstance = null;
      isReady = false;
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Initialize tables + seed data
 */
export async function initializeDatabase() {
  try {
    const db = await getDatabase();

    console.log("📦 Checking database tables...");

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'other',
        balance REAL DEFAULT 0,
        currency TEXT DEFAULT 'NGN',
        icon TEXT,
        color TEXT,
        group_type TEXT DEFAULT 'Accounts',   -- Cash, Accounts, Savings, Investments, Loan
        is_hidden INTEGER DEFAULT 0,
        is_archived INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        parent_id INTEGER,
        icon TEXT,
        color TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        account_id INTEGER NOT NULL,
        to_account_id INTEGER,
        category_id INTEGER,
        subcategory_id INTEGER,
        note TEXT,
        description TEXT,
        date TEXT NOT NULL,
        is_bookmarked INTEGER DEFAULT 0,
        is_recurring INTEGER DEFAULT 0,
        recurring_id INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (account_id) REFERENCES accounts(id),
        FOREIGN KEY (to_account_id) REFERENCES accounts(id),
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (subcategory_id) REFERENCES categories(id)
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        month TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        amount REAL,
        account_id INTEGER,
        to_account_id INTEGER,
        category_id INTEGER,
        subcategory_id INTEGER,
        note TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS recurring (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        account_id INTEGER NOT NULL,
        to_account_id INTEGER,
        category_id INTEGER,
        subcategory_id INTEGER,
        note TEXT,
        frequency TEXT NOT NULL,
        start_date TEXT NOT NULL,
        next_date TEXT NOT NULL,
        end_date TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS exchange_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_currency TEXT NOT NULL,
        to_currency TEXT NOT NULL,
        rate REAL NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
    `);

    // Add account columns used by current screens to databases created by older versions.
    const accountColumns = await db.getAllAsync("PRAGMA table_info(accounts)");
    const existingAccountColumns = new Set(
      accountColumns.map((column) => column.name),
    );
    const accountColumnMigrations = [
      ["type", "TEXT NOT NULL DEFAULT 'other'"],
      ["currency", "TEXT DEFAULT 'NGN'"],
      ["icon", "TEXT"],
      ["color", "TEXT"],
      ["group_type", "TEXT DEFAULT 'Accounts'"],
      ["is_hidden", "INTEGER DEFAULT 0"],
      ["is_archived", "INTEGER DEFAULT 0"],
      ["sort_order", "INTEGER DEFAULT 0"],
      ["created_at", "TEXT"],
      ["updated_at", "TEXT"],
    ];

    for (const [columnName, columnDefinition] of accountColumnMigrations) {
      if (!existingAccountColumns.has(columnName)) {
        await db.execAsync(
          `ALTER TABLE accounts ADD COLUMN ${columnName} ${columnDefinition};`,
        );
      }
    }

    await db.execAsync(`
      UPDATE accounts
      SET type = CASE lower(COALESCE(group_type, ''))
        WHEN 'cash' THEN 'cash'
        WHEN 'savings' THEN 'savings'
        WHEN 'investments' THEN 'investment'
        WHEN 'loan' THEN 'loan'
        WHEN 'accounts' THEN 'bank'
        ELSE 'other'
      END
      WHERE type IS NULL OR TRIM(type) = '';
    `);

    await db.execAsync(`
      UPDATE accounts
      SET group_type = 'Loan'
      WHERE lower(COALESCE(type, '')) = 'loan'
        AND lower(COALESCE(group_type, '')) != 'loan';
    `);

    await seedDatabase(db);

    console.log("✅ Database fully ready");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    isReady = false;
    dbInstance = null;
    initPromise = null;
  }
}

export function isDatabaseReady() {
  return isReady;
}
