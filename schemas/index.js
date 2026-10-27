// schemas/index.js
import { z } from "zod";

// ======================
// ACCOUNT
// ======================
export const AccountSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Account name is required"),
  type: z.enum([
    "cash",
    "bank",
    "card",
    "savings",
    "loan",
    "investment",
    "other",
  ]),
  balance: z.number().default(0),
  currency: z.string().default("NGN"),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  sort_order: z.number().default(0),
  is_hidden: z.number().default(0),
  is_archived: z.number().default(0),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// ======================
// CATEGORY
// ======================
export const CategorySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Category name is required"),
  type: z.enum(["income", "expense"]),
  parent_id: z.number().nullable().optional(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  sort_order: z.number().default(0),
  is_active: z.number().default(1),
  created_at: z.string().optional(),
});

// ======================
// TRANSACTION
// ======================
export const TransactionSchema = z.object({
  id: z.number().optional(),
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.number().positive("Amount must be greater than 0"),
  account_id: z.number({ required_error: "Account is required" }),
  to_account_id: z.number().nullable().optional(),
  category_id: z.number().nullable().optional(),
  subcategory_id: z.number().nullable().optional(),
  note: z.string().optional().default(""),
  description: z.string().optional().default(""),
  date: z.string().min(1, "Date is required"),
  is_bookmarked: z.number().default(0),
  is_recurring: z.number().default(0),
  recurring_id: z.number().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// ======================
// BUDGET
// ======================
export const BudgetSchema = z.object({
  id: z.number().optional(),
  category_id: z.number({ required_error: "Category is required" }),
  amount: z.number().positive("Budget amount must be greater than 0"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in format YYYY-MM"),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// ======================
// BOOKMARK
// ======================
export const BookmarkSchema = z.object({
  id: z.number().optional(),
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.number().positive().optional().nullable(),
  account_id: z.number().optional().nullable(),
  to_account_id: z.number().optional().nullable(),
  category_id: z.number().optional().nullable(),
  subcategory_id: z.number().optional().nullable(),
  note: z.string().optional().default(""),
  created_at: z.string().optional(),
});

// ======================
// RECURRING
// ======================
export const RecurringSchema = z.object({
  id: z.number().optional(),
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.number().positive("Amount must be greater than 0"),
  account_id: z.number({ required_error: "Account is required" }),
  to_account_id: z.number().nullable().optional(),
  category_id: z.number().nullable().optional(),
  subcategory_id: z.number().nullable().optional(),
  note: z.string().optional().default(""),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  start_date: z.string().min(1),
  next_date: z.string().min(1),
  end_date: z.string().nullable().optional(),
  is_active: z.number().default(1),
  created_at: z.string().optional(),
});

// ======================
// EXCHANGE RATE
// ======================
export const ExchangeRateSchema = z.object({
  id: z.number().optional(),
  from_currency: z.string().min(3).max(3),
  to_currency: z.string().min(3).max(3),
  rate: z.number().positive(),
  updated_at: z.string().optional(),
});

// ======================
// VALIDATION HELPER
// ======================
export function validate(schema, data) {
  const result = schema.safeParse(data);

  if (!result.success) {
    const messages = result.error.errors.map((err) => err.message);
    throw new Error(messages.join(" | "));
  }

  return result.data;
}

// ======================
// FORM SCHEMAS (for UI)
// ======================

// Common fields that most forms share
const BaseFormFields = {
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a valid number greater than 0",
    }),
  account_id: z.number({ required_error: "Please select an account" }),
  note: z.string().optional().default(""),
  date: z.string().min(1, "Date is required"),
};

// Income Form
export const IncomeFormSchema = z.object({
  ...BaseFormFields,
  type: z.literal("income"),
  category_id: z.number({ required_error: "Please select a category" }),
  subcategory_id: z.number().nullable().optional(),
});

// Expense Form
export const ExpenseFormSchema = z.object({
  ...BaseFormFields,
  type: z.literal("expense"),
  category_id: z.number({ required_error: "Please select a category" }),
  subcategory_id: z.number().nullable().optional(),
});

// Transfer Form
export const TransferFormSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a valid number greater than 0",
    }),
  type: z.literal("transfer"),
  account_id: z.number({ required_error: "Please select source account" }),
  to_account_id: z.number({
    required_error: "Please select destination account",
  }),
  note: z.string().optional().default(""),
  date: z.string().min(1, "Date is required"),
  // Optional fee for transfers
  fee: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: "Fee must be a valid number",
    }),
});

/**
 * Helper to get the correct form schema based on transaction type
 */
export function getFormSchema(type) {
  switch (type) {
    case "income":
      return IncomeFormSchema;
    case "expense":
      return ExpenseFormSchema;
    case "transfer":
      return TransferFormSchema;
    default:
      throw new Error("Invalid transaction type");
  }
}

/**
 * Convert form data (strings) into clean data ready for the database
 */
export function formToTransactionData(formData) {
  const amount = Number(formData.amount);
  const fee = formData.fee ? Number(formData.fee) : 0;

  return {
    type: formData.type,
    amount: amount,
    account_id: formData.account_id,
    to_account_id: formData.to_account_id || null,
    category_id: formData.category_id || null,
    subcategory_id: formData.subcategory_id || null,
    note: formData.note || "",
    description: formData.note || "",
    date: formData.date,
    // We can handle fee as a separate expense later if needed
  };
}

// ======================
// AI VOICE / TEXT PARSING RESULT
// ======================
/**
 * This is the shape that our offline NLP engine will produce
 * Example: "Spent 1500 naira on Garri and Milk using Cash"
 */
export const AIParseResultSchema = z.object({
  amount: z.number().positive().nullable(),
  type: z.enum(["income", "expense", "transfer"]).nullable(),
  account_name: z.string().nullable().optional(),
  account_id: z.number().nullable().optional(),
  category_name: z.string().nullable().optional(),
  category_id: z.number().nullable().optional(),
  subcategory_name: z.string().nullable().optional(),
  subcategory_id: z.number().nullable().optional(),
  note: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).optional(), // 0 to 1
  raw_text: z.string().optional(),
});

// ======================
// NOTIFICATION PAYLOAD
// ======================
export const NotificationPayloadSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  data: z
    .object({
      type: z.enum([
        "budget_warning",
        "budget_exceeded",
        "recurring_reminder",
        "general",
      ]),
      category_id: z.number().optional(),
      budget_id: z.number().optional(),
      recurring_id: z.number().optional(),
      percentage: z.number().optional(),
    })
    .optional(),
});

// ======================
// BUDGET RECOMMENDATION (AI)
// ======================
export const BudgetRecommendationSchema = z.object({
  category_id: z.number(),
  category_name: z.string(),
  recommended_amount: z.number().positive(),
  current_average: z.number().optional(),
  reason: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const BudgetRecommendationListSchema = z.array(
  BudgetRecommendationSchema,
);

// ======================
// AI INSIGHT QUERY
// ======================
/**
 * Used when the user asks the AI Hub questions like:
 * "How much did I spend on food this month?"
 */
export const AIInsightQuerySchema = z.object({
  question: z.string().min(3, "Question is too short"),
  period: z
    .enum([
      "today",
      "this_week",
      "this_month",
      "last_month",
      "this_year",
      "custom",
    ])
    .optional()
    .default("this_month"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

// ======================
// AI INSIGHT RESPONSE
// ======================
export const AIInsightResponseSchema = z.object({
  answer: z.string(),
  total_amount: z.number().optional(),
  comparison: z.string().optional(),
  category_breakdown: z
    .array(
      z.object({
        category_name: z.string(),
        amount: z.number(),
        percentage: z.number().optional(),
      }),
    )
    .optional(),
  suggestion: z.string().optional(),
});
