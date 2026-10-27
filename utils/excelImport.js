// utils/excelImport.js
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as XLSX from "xlsx";
import { getDatabase } from "../database/db";
import { createTransaction } from "../database/helpers";

/**
 * Opens file picker and returns parsed Excel data
 */
export async function pickAndParseExcel() {
  try {
    // 1. Pick the file
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    console.log("Picked file:", asset.name);

    // 2. Read the file using fetch + arrayBuffer (most reliable in Expo Go)
    const response = await fetch(asset.uri);
    const arrayBuffer = await response.arrayBuffer();

    // 3. Convert ArrayBuffer to base64 using a pure JS method
    const base64 = arrayBufferToBase64(arrayBuffer);

    // 4. Parse with SheetJS (more tolerant)
    let workbook;
    try {
      workbook = XLSX.read(base64, {
        type: "base64",
        cellDates: true,
        raw: false,
      });
    } catch (parseError) {
      console.log(
        "SheetJS warning (usually safe to ignore):",
        parseError.message,
      );
      // Sometimes SheetJS still returns a partial workbook even after throwing
      // We try once more with different options
      workbook = XLSX.read(base64, { type: "base64", dense: true });
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    console.log("Successfully parsed rows:", jsonData.length);

    return {
      fileName: asset.name,
      rowCount: jsonData.length,
      data: jsonData,
    };
  } catch (error) {
    console.log("Excel import error:", error);
    throw new Error(error.message || "Failed to read Excel file");
  }
}

/**
 * Reliable ArrayBuffer → Base64 converter for React Native
 */
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return global.btoa(binary);
}

/**
 * Tries to find a column value using multiple possible header names
 */
function getColumn(row, possibleNames) {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== "") {
      return String(row[name]).trim();
    }
  }
  // Also try case-insensitive match
  const keys = Object.keys(row);
  for (const name of possibleNames) {
    const found = keys.find((k) => k.toLowerCase() === name.toLowerCase());
    if (found && row[found] !== "") {
      return String(row[found]).trim();
    }
  }
  return "";
}

/**
 * Convert one Excel row into our transaction format
 */
function mapRowToTransaction(row) {
  const dateRaw = getColumn(row, ["Date", "date", "DATE", "Transaction Date"]);
  const accountName = getColumn(row, [
    "Account",
    "account",
    "From Account",
    "Wallet",
  ]);
  const categoryName = getColumn(row, [
    "Category",
    "category",
    "Main Category",
  ]);
  const subCategoryName = getColumn(row, [
    "Subcategory",
    "Sub Category",
    "subcategory",
    "Sub-Category",
  ]);
  const note = getColumn(row, [
    "Note",
    "Notes",
    "Description",
    "Memo",
    "Remark",
  ]);
  const typeRaw = getColumn(row, [
    "Income/Expense",
    "Type",
    "Transaction Type",
    "In/Out",
  ]);
  const amountRaw = getColumn(row, ["Amount", "NGN", "Value", "Money", "Sum"]);

  // Determine type
  let type = "expense";
  const typeLower = typeRaw.toLowerCase();
  if (typeLower.includes("income") || typeLower.includes("in")) {
    type = "income";
  } else if (typeLower.includes("transfer")) {
    type = "transfer";
  }

  // Parse amount (remove currency symbols and commas)
  let amount = parseFloat(String(amountRaw).replace(/[^0-9.-]/g, ""));
  if (isNaN(amount) || amount === 0) return null;

  // Make amount always positive (we use type to decide sign)
  amount = Math.abs(amount);

  // Parse date
  let date = new Date().toISOString().split("T")[0];
  if (dateRaw) {
    const parsed = new Date(dateRaw);
    if (!isNaN(parsed.getTime())) {
      date = parsed.toISOString().split("T")[0];
    }
  }

  return {
    type,
    amount,
    accountName,
    categoryName,
    subCategoryName,
    note,
    date: date + "T12:00:00",
  };
}

/**
 * Find or create an account by name
 */
async function findOrCreateAccount(db, name) {
  if (!name) name = "Cash at Hand";

  let account = await db.getFirstAsync(
    `SELECT * FROM accounts WHERE name = ? COLLATE NOCASE AND is_archived = 0`,
    name,
  );

  if (!account) {
    const result = await db.runAsync(
      `INSERT INTO accounts (name, type, balance, currency, color, sort_order)
       VALUES (?, 'cash', 0, 'NGN', '#4CAF50', 99)`,
      name,
    );
    account = { id: result.lastInsertRowId, name };
  }

  return account;
}

/**
 * Find or create a category by name and type
 */
async function findOrCreateCategory(db, name, type, parentId = null) {
  if (!name) return null;

  let category = await db.getFirstAsync(
    `SELECT * FROM categories 
     WHERE name = ? COLLATE NOCASE AND type = ? AND is_active = 1`,
    name,
    type,
  );

  if (!category) {
    const result = await db.runAsync(
      `INSERT INTO categories (name, type, parent_id, color, sort_order, is_active)
       VALUES (?, ?, ?, ?, 99, 1)`,
      name,
      type,
      parentId,
      type === "income" ? "#4CAF50" : "#FF5A5F",
    );
    category = { id: result.lastInsertRowId, name };
  }

  return category;
}

/**
 * Main import function – maps and saves all rows
 */
export async function importTransactionsFromExcel(onProgress) {
  const parsed = await pickAndParseExcel();
  if (!parsed) return { cancelled: true };

  const db = await getDatabase();
  let successCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const mapped = mapRowToTransaction(row);

    if (!mapped) {
      skippedCount++;
      continue;
    }

    try {
      // Find or create account
      const account = await findOrCreateAccount(db, mapped.accountName);

      // Find or create category (only for income/expense)
      let categoryId = null;
      if (mapped.type !== "transfer" && mapped.categoryName) {
        const category = await findOrCreateCategory(
          db,
          mapped.categoryName,
          mapped.type,
        );
        categoryId = category?.id || null;
      }

      // Create the transaction (this also updates balances)
      await createTransaction({
        type: mapped.type,
        amount: mapped.amount,
        account_id: account.id,
        to_account_id: null,
        category_id: categoryId,
        subcategory_id: null,
        note: mapped.note || mapped.categoryName || "",
        description: mapped.note || "",
        date: mapped.date,
      });

      successCount++;
    } catch (err) {
      skippedCount++;
      errors.push(`Row ${i + 1}: ${err.message}`);
    }

    // Report progress
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: parsed.data.length,
        successCount,
        skippedCount,
      });
    }
  }

  return {
    cancelled: false,
    fileName: parsed.fileName,
    totalRows: parsed.rowCount,
    successCount,
    skippedCount,
    errors: errors.slice(0, 5), // only first 5 errors
  };
}
