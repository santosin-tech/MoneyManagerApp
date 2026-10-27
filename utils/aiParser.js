// utils/aiParser.js

/**
 * Improved offline Smart Text Entry parser
 * Understands sentences like:
 * - "spent 2500 on lunch with Opay"
 * - "I paid 1500 for data on PalmPay"
 * - "received 50000 salary into UBA"
 * - "transfer 10000 from Cash to Opay"
 */
export function parseTransactionText(text = "") {
  const original = text.trim();
  if (!original) return null;

  const lower = original.toLowerCase();

  // ---------- 1. Detect Type ----------
  let type = "expense";

  if (/(received|got|salary|income|earned|credited|deposit)/i.test(lower)) {
    type = "income";
  } else if (/(transfer|moved|sent to|from .+ to )/i.test(lower)) {
    type = "transfer";
  } else if (/(spent|paid|bought|expense|debited|bought|pay)/i.test(lower)) {
    type = "expense";
  }

  // ---------- 2. Extract Amount ----------
  // Supports: 2500, 2,500, 2500.50, ₦2500, 2.5k, 2k
  let amount = 0;

  // First try normal numbers
  const amountMatch = original.match(
    /(?:₦|ngn|naira)?\s*([\d,]+(?:\.\d{1,2})?)\s*(k)?/i,
  );

  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ""));
    if (amountMatch[2]) {
      // "2k" or "2.5k"
      amount = amount * 1000;
    }
  }

  // ---------- 3. Extract Account(s) ----------
  const knownAccounts = [
    "opay",
    "palmpay",
    "palm pay",
    "uba",
    "gtb",
    "gtbank",
    "gt bank",
    "access",
    "access bank",
    "zenith",
    "zenith bank",
    "first bank",
    "firstbank",
    "cash",
    "cash at hand",
    "smartcash",
    "smart cash",
    "kuda",
    "moniepoint",
    "monie point",
    "chipper",
    "carbon",
  ];

  let account = null;
  let toAccount = null;

  // Special pattern: "from X to Y"
  const fromToMatch = lower.match(
    /from\s+([a-z0-9\s]+?)\s+to\s+([a-z0-9\s]+)/i,
  );

  if (fromToMatch) {
    account = cleanName(fromToMatch[1]);
    toAccount = cleanName(fromToMatch[2]);
    type = "transfer";
  } else {
    // Find accounts mentioned in the sentence
    for (const acc of knownAccounts) {
      if (lower.includes(acc)) {
        const cleaned = cleanName(acc);
        if (!account) {
          account = cleaned;
        } else if (!toAccount && cleaned !== account) {
          toAccount = cleaned;
        }
      }
    }
  }

  // ---------- 4. Extract Category & Note ----------
  let note = original
    .replace(/(?:₦|ngn|naira)?\s*[\d,]+(?:\.\d{1,2})?\s*k?/gi, "")
    .replace(
      /spent|paid|bought|received|got|salary|income|earned|transfer|moved|sent|from|to|on|with|into|for|using|i|my|the|a|an/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();

  const categoryMap = {
    // Food
    lunch: "Food",
    food: "Food",
    dinner: "Food",
    breakfast: "Food",
    meal: "Food",
    rice: "Food",
    chicken: "Food",
    // Transport
    transport: "Transport",
    uber: "Transport",
    bolt: "Transport",
    fuel: "Transport",
    petrol: "Transport",
    // Income
    salary: "Salary",
    payment: "Salary",
    // Bills
    rent: "Housing",
    data: "Internet",
    airtime: "Airtime",
    electricity: "Bills",
    light: "Bills",
    water: "Bills",
    // Others
    shopping: "Shopping",
    clothes: "Shopping",
    gift: "Gifts",
  };

  let category = "Other";
  for (const key in categoryMap) {
    if (lower.includes(key)) {
      category = categoryMap[key];
      break;
    }
  }

  // If note is empty, use category
  if (!note) note = category;

  // Clean note a bit more
  note = note.replace(/^(on|for|with)\s+/i, "").trim();

  return {
    type,
    amount: isNaN(amount) ? 0 : amount,
    category,
    account,
    toAccount,
    note,
    originalText: original,
  };
}

function cleanName(str = "") {
  return str
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
