/**
 * Seeds the database with default accounts and categories.
 * This function is safe – it only inserts data if the tables are empty.
 */

export async function seedDatabase(db) {
  const accountCount = await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM accounts",
  );

  if (accountCount && accountCount.count > 0) {
    console.log("🌱 Database already seeded – skipping");
    return;
  }

  console.log("🌱 Seeding database...");

  await db.execAsync(`
    INSERT INTO accounts (name, type, balance, currency, icon, color, sort_order, group_type) VALUES
    ('Cash at Hand', 'cash', 0, 'NGN', 'cash', '#4CAF50', 1, 'Cash'),
    ('Opay', 'bank', 0, 'NGN', 'card', '#00AEEF', 2, 'Accounts'),
    ('Smartcash', 'bank', 0, 'NGN', 'card', '#FF9800', 3, 'Accounts'),
    ('PalmPay', 'bank', 0, 'NGN', 'card', '#9C27B0', 4, 'Accounts'),
    ('UBA', 'bank', 0, 'NGN', 'card', '#E91E63', 5, 'Accounts'),
    ('Target Saving', 'savings', 0, 'NGN', 'piggy-bank', '#2196F3', 6, 'Savings'),
    ('Loan App', 'loan', 0, 'NGN', 'alert', '#F44336', 7, 'Loan'),
    ('Royal Mira store', 'cash', 0, 'NGN', 'store', '#795548', 8, 'Cash');
  `);

  await db.execAsync(`
    INSERT INTO categories (name, type, icon, color, sort_order) VALUES
    ('Side Hustle', 'income', 'briefcase', '#4CAF50', 1),
    ('Salary', 'income', 'cash', '#4CAF50', 2),
    ('Goodwill', 'income', 'heart', '#E91E63', 3),
    ('Bonus', 'income', 'gift', '#FF9800', 4),
    ('Other Income', 'income', 'add-circle', '#9E9E9E', 5),
    ('Food', 'expense', 'restaurant', '#FF5722', 10),
    ('Transport', 'expense', 'car', '#2196F3', 11),
    ('Networking', 'expense', 'wifi', '#00BCD4', 12),
    ('Body', 'expense', 'person', '#9C27B0', 13),
    ('Health', 'expense', 'medkit', '#F44336', 14),
    ('Education', 'expense', 'school', '#3F51B5', 15),
    ('Purchases', 'expense', 'cart', '#FF9800', 16),
    ('Fees', 'expense', 'receipt', '#607D8B', 17),
    ('Hook-up', 'expense', 'heart', '#E91E63', 18),
    ('Other Expense', 'expense', 'ellipsis-horizontal', '#9E9E9E', 19);
  `);

  const foodCategory = await db.getFirstAsync(
    "SELECT id FROM categories WHERE name = 'Food' AND type = 'expense'",
  );

  if (foodCategory) {
    await db.runAsync(
      `INSERT INTO categories (name, type, parent_id, icon, color, sort_order) VALUES
       (?, ?, ?, ?, ?, ?),
       (?, ?, ?, ?, ?, ?),
       (?, ?, ?, ?, ?, ?),
       (?, ?, ?, ?, ?, ?),
       (?, ?, ?, ?, ?, ?),
       (?, ?, ?, ?, ?, ?),
       (?, ?, ?, ?, ?, ?)`,
      "Complement",
      "expense",
      foodCategory.id,
      "cafe",
      "#FF5722",
      1,
      "Meat",
      "expense",
      foodCategory.id,
      "nutrition",
      "#FF5722",
      2,
      "Snack & Drinks",
      "expense",
      foodCategory.id,
      "fast-food",
      "#FF5722",
      3,
      "Water",
      "expense",
      foodCategory.id,
      "water",
      "#FF5722",
      4,
      "Eating out",
      "expense",
      foodCategory.id,
      "restaurant",
      "#FF5722",
      5,
      "Provisions",
      "expense",
      foodCategory.id,
      "basket",
      "#FF5722",
      6,
      "Gas",
      "expense",
      foodCategory.id,
      "flame",
      "#FF5722",
      7,
    );
  }

  const transportCategory = await db.getFirstAsync(
    "SELECT id FROM categories WHERE name = 'Transport' AND type = 'expense'",
  );

  if (transportCategory) {
    await db.runAsync(
      `INSERT INTO categories (name, type, parent_id, icon, color, sort_order) VALUES
       (?, ?, ?, ?, ?, ?),
       (?, ?, ?, ?, ?, ?),
       (?, ?, ?, ?, ?, ?)`,
      "Royal Mira",
      "expense",
      transportCategory.id,
      "bus",
      "#2196F3",
      1,
      "To Side Hustle",
      "expense",
      transportCategory.id,
      "bicycle",
      "#2196F3",
      2,
      "Bike",
      "expense",
      transportCategory.id,
      "bicycle",
      "#2196F3",
      3,
    );
  }

  const networkingCategory = await db.getFirstAsync(
    "SELECT id FROM categories WHERE name = 'Networking' AND type = 'expense'",
  );

  if (networkingCategory) {
    await db.runAsync(
      `INSERT INTO categories (name, type, parent_id, icon, color, sort_order) VALUES
       (?, ?, ?, ?, ?, ?),
       (?, ?, ?, ?, ?, ?),
       (?, ?, ?, ?, ?, ?),
       (?, ?, ?, ?, ?, ?),
       (?, ?, ?, ?, ?, ?)`,
      "Recharge Card",
      "expense",
      networkingCategory.id,
      "phone-portrait",
      "#00BCD4",
      1,
      "Airtime",
      "expense",
      networkingCategory.id,
      "call",
      "#00BCD4",
      2,
      "Data",
      "expense",
      networkingCategory.id,
      "cellular",
      "#00BCD4",
      3,
      "eSIM",
      "expense",
      networkingCategory.id,
      "sim",
      "#00BCD4",
      4,
      "VPN",
      "expense",
      networkingCategory.id,
      "shield",
      "#00BCD4",
      5,
    );
  }

  console.log(
    "✅ Database seeded successfully with default accounts & categories",
  );
}
