// utils/noteSuggestions.js
import { getDatabase } from "../database/db";

/**
 * Returns up to 8 previous notes that match the search text
 */
export async function getNoteSuggestions(searchText = "") {
  try {
    const db = await getDatabase();
    const text = searchText.trim().toLowerCase();

    let rows;

    if (text.length === 0) {
      // When field is empty → show most recent unique notes
      rows = await db.getAllAsync(`
        SELECT DISTINCT note
        FROM transactions
        WHERE note IS NOT NULL AND note != ''
        ORDER BY id DESC
        LIMIT 8
      `);
    } else {
      // Filter while typing
      rows = await db.getAllAsync(
        `
        SELECT DISTINCT note
        FROM transactions
        WHERE note IS NOT NULL 
          AND note != ''
          AND LOWER(note) LIKE ?
        ORDER BY id DESC
        LIMIT 8
        `,
        [`%${text}%`],
      );
    }

    return (rows || []).map((r) => r.note).filter(Boolean);
  } catch (error) {
    console.log("Note suggestions error:", error.message);
    return [];
  }
}
