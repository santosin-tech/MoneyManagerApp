// utils/excelExport.js
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import { getDatabase } from "../database/db";

/**
 * Export transactions to an Excel file and open the share sheet
 */
export async function exportTransactionsToExcel() {
  try {
    const db = await getDatabase();

    const rows = await db.getAllAsync(`
      SELECT 
        t.date,
        t.type,
        t.amount,
        t.note,
        a.name as account_name,
        ta.name as to_account_name,
        c.name as category_name
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN accounts ta ON t.to_account_id = ta.id
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC
      LIMIT 2000
    `);

    if (!rows || rows.length === 0) {
      throw new Error("No transactions to export");
    }

    // Format data for Excel
    const data = rows.map((row) => ({
      Date: row.date ? row.date.split("T")[0] : "",
      Type: row.type,
      Amount: row.amount,
      Account: row.account_name || "",
      "To Account": row.to_account_name || "",
      Category: row.category_name || "",
      Note: row.note || "",
    }));

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    // Write to base64
    const base64 = XLSX.write(workbook, {
      type: "base64",
      bookType: "xlsx",
    });

    // Save to cache
    const fileName = `MoneyManager_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const fileUri = FileSystem.cacheDirectory + fileName;

    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Share the file
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Export Transactions",
        UTI: "com.microsoft.excel.xlsx",
      });
    } else {
      throw new Error("Sharing is not available on this device");
    }

    return {
      success: true,
      count: rows.length,
      fileName,
    };
  } catch (error) {
    console.log("Export error:", error);
    throw new Error(error.message || "Failed to export transactions");
  }
}
