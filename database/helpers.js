// database/helpers.js
import { getDatabase } from "./db";
import { TransactionSchema, validate } from "../schemas";

// ======================
// ACCOUNTS
// ======================

/**
 * Get all visible accounts ordered by sort_order
 */
export async function getAllAccounts() {
  const db = await getDatabase();
  return await db.getAllAsync(`
    SELECT * FROM accounts 
    WHERE is_hidden = 0 AND is_archived = 0
    ORDER BY sort_order ASC, name ASC
  `);
}

/**
 * Get a single account by ID
 */
export async function getAccountById(id) {
  const db = await getDatabase();
  return await db.getFirstAsync(`SELECT * FROM accounts WHERE id = ?`, id);
}

/**
 * Update account balance
 */
export async function updateAccountBalance(accountId, newBalance) {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE accounts SET balance = ?, updated_at = datetime('now') WHERE id = ?`,
    newBalance,
    accountId,
  );
}

// ======================
// CATEGORIES
// ======================

/**
 * Get all top-level categories (no parent)
 * Optionally filter by type: 'income' or 'expense'
 */
export async function getTopLevelCategories(type = null) {
  const db = await getDatabase();

  if (type) {
    return await db.getAllAsync(
      `SELECT * FROM categories 
       WHERE parent_id IS NULL AND type = ? AND is_active = 1
       ORDER BY sort_order ASC, name ASC`,
      type,
    );
  }

  return await db.getAllAsync(`
    SELECT * FROM categories 
    WHERE parent_id IS NULL AND is_active = 1
    ORDER BY type ASC, sort_order ASC, name ASC
  `);
}

/**
 * Get sub-categories of a parent category
 */
export async function getSubCategories(parentId) {
  const db = await getDatabase();
  return await db.getAllAsync(
    `SELECT * FROM categories 
     WHERE parent_id = ? AND is_active = 1
     ORDER BY sort_order ASC, name ASC`,
    parentId,
  );
}

/**
 * Get a category with all its sub-categories
 */
export async function getCategoryWithSubs(categoryId) {
  const db = await getDatabase();

  const category = await db.getFirstAsync(
    `SELECT * FROM categories WHERE id = ?`,
    categoryId,
  );

  if (!category) return null;

  const subCategories = await getSubCategories(categoryId);

  return {
    ...category,
    subCategories,
  };
}

// ======================
// TRANSACTIONS
// ======================

/**
 * Insert a new transaction and update account balances
 * This is the core double-entry logic
 */
export async function createTransaction(data) {
  // 1. Validate the data first
  const cleanData = validate(TransactionSchema, data);

  const db = await getDatabase();

  const {
    type,
    amount,
    account_id,
    to_account_id = null,
    category_id = null,
    subcategory_id = null,
    note = "",
    description = "",
    date = new Date().toISOString(),
  } = cleanData;

  // 2. Insert the transaction
  const result = await db.runAsync(
    `INSERT INTO transactions 
      (type, amount, account_id, to_account_id, category_id, subcategory_id, note, description, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    type,
    amount,
    account_id,
    to_account_id,
    category_id,
    subcategory_id,
    note,
    description,
    date,
  );

  const transactionId = result.lastInsertRowId;

  // 3. Update account balances (double-entry)
  if (type === "income") {
    await db.runAsync(
      `UPDATE accounts SET balance = balance + ?, updated_at = datetime('now') WHERE id = ?`,
      amount,
      account_id,
    );
  } else if (type === "expense") {
    await db.runAsync(
      `UPDATE accounts SET balance = balance - ?, updated_at = datetime('now') WHERE id = ?`,
      amount,
      account_id,
    );
  } else if (type === "transfer") {
    await db.runAsync(
      `UPDATE accounts SET balance = balance - ?, updated_at = datetime('now') WHERE id = ?`,
      amount,
      account_id,
    );
    if (to_account_id) {
      await db.runAsync(
        `UPDATE accounts SET balance = balance + ?, updated_at = datetime('now') WHERE id = ?`,
        amount,
        to_account_id,
      );
    }
  }

  return transactionId;
}

/**
 * Get recent transactions (with account & category names)
 */
export async function getRecentTransactions(limit = 20) {
  const db = await getDatabase();

  return await db.getAllAsync(
    `
    SELECT 
      t.*,
      a.name as account_name,
      c.name as category_name,
      sc.name as subcategory_name
    FROM transactions t
    LEFT JOIN accounts a ON t.account_id = a.id
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN categories sc ON t.subcategory_id = sc.id
    ORDER BY t.date DESC, t.id DESC
    LIMIT ?
    `,
    limit,
  );
}

/**
 * Get transactions for a specific date range
 */
export async function getTransactionsByDateRange(startDate, endDate) {
  const db = await getDatabase();

  return await db.getAllAsync(
    `
    SELECT 
      t.*,
      a.name as account_name,
      c.name as category_name
    FROM transactions t
    LEFT JOIN accounts a ON t.account_id = a.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.date BETWEEN ? AND ?
    ORDER BY t.date DESC
    `,
    startDate,
    endDate,
  );
}

/**
 * Toggle bookmark status of a transaction
 */
export async function toggleBookmark(transactionId, currentValue) {
  const db = await getDatabase();
  const newValue = currentValue ? 0 : 1;

  await db.runAsync(
    `UPDATE transactions SET is_bookmarked = ?, updated_at = datetime('now') WHERE id = ?`,
    newValue,
    transactionId,
  );

  return newValue;
}

// Clear all transactions and reset account balances
export async function clearAllTransactions() {
  const db = await getDatabase();

  // Delete every transaction
  await db.runAsync(`DELETE FROM transactions`);

  // Reset all account balances to zero
  await db.runAsync(`UPDATE accounts SET balance = 0`);

  return true;
}

/**
 * Create account if name does not exist,
 * or update (override) the existing account if the name already exists.
 *
 * @param {Object} data
 * @param {string} data.name          - Account name
 * @param {string} data.group_type    - Cash | Accounts | Savings | Investments | Loan
 * @param {number} [data.balance=0]   - Starting balance (only used when creating)
 * @param {number} [data.is_hidden=0]
 * @returns {Promise<{id: number, action: 'created' | 'updated'}>}
 */
export async function upsertAccount({
  name,
  group_type = "Accounts",
  balance = 0,
  is_hidden = 0,
}) {
  if (!name || !name.trim()) {
    throw new Error("Account name is required");
  }

  const db = await getDatabase();
  const trimmedName = name.trim();

  // 1. Check if an account with this name already exists
  const existing = await db.getFirstAsync(
    `SELECT id FROM accounts WHERE LOWER(name) = LOWER(?)`,
    [trimmedName],
  );

  if (existing) {
    // 2. Name exists → UPDATE (override)
    await db.runAsync(
      `UPDATE accounts 
       SET group_type = ?, is_hidden = ?, type = ?
       WHERE id = ?`,
      [group_type, is_hidden, group_type, existing.id],
    );

    return { id: existing.id, action: "updated" };
  } else {
    // 3. Name does not exist → CREATE
    // Get next sort_order for this group
    const maxRow = await db.getFirstAsync(
      `SELECT MAX(sort_order) as maxOrder FROM accounts WHERE group_type = ?`,
      [group_type],
    );
    const nextOrder = (maxRow?.maxOrder ?? 0) + 1;

    const result = await db.runAsync(
      `INSERT INTO accounts (name, balance, type, group_type, is_hidden, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [trimmedName, balance, group_type, group_type, is_hidden, nextOrder],
    );

    return { id: result.lastInsertRowId, action: "created" };
  }
}
