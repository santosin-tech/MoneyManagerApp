// utils/recurringEngine.js
import { getDatabase } from "../database/db";
import { createTransaction } from "../database/helpers";

/**
 * Calculate the next date based on frequency
 */
function getNextDate(currentDateStr, frequency) {
  const date = new Date(currentDateStr);

  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }

  return date.toISOString().split("T")[0];
}

/**
 * Process all due recurring transactions
 */
export async function processRecurringTransactions() {
  try {
    const db = await getDatabase();
    const today = new Date().toISOString().split("T")[0];

    // Get all active recurring rules that are due
    const dueRules = await db.getAllAsync(
      `SELECT * FROM recurring 
       WHERE is_active = 1 AND next_date <= ?`,
      today,
    );

    if (!dueRules || dueRules.length === 0) {
      return { processed: 0 };
    }

    let processed = 0;

    for (const rule of dueRules) {
      try {
        // Create the real transaction
        await createTransaction({
          type: rule.type,
          amount: rule.amount,
          account_id: rule.account_id,
          to_account_id: rule.to_account_id,
          category_id: rule.category_id,
          subcategory_id: rule.subcategory_id,
          note: rule.note || "",
          description: rule.note || `Recurring (${rule.frequency})`,
          date: rule.next_date + "T12:00:00",
        });

        // Calculate and update next_date
        const nextDate = getNextDate(rule.next_date, rule.frequency);

        await db.runAsync(
          `UPDATE recurring SET next_date = ? WHERE id = ?`,
          nextDate,
          rule.id,
        );

        processed++;
      } catch (err) {
        console.log("Failed to process recurring rule:", rule.id, err.message);
      }
    }

    console.log(`✅ Processed ${processed} recurring transactions`);
    return { processed };
  } catch (error) {
    console.log("Recurring engine error:", error.message);
    return { processed: 0, error: error.message };
  }
}
