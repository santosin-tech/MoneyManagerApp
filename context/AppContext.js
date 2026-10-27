// context/AppContext.js
import { createContext, useContext, useEffect, useState } from "react";
import { getTopLevelCategories, getSubCategories } from "../database/helpers";
import { isDatabaseReady, getDatabase } from "../database/db";
import { Config } from "../constants/Config";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState({}); // { parentId: [subs] }
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currency, setCurrency] = useState(Config.currency);
  const [accounts, setAccounts] = useState([]); // ← must start as empty array

  // Load all initial data
  useEffect(() => {
    async function loadInitialData() {
      let attempts = 0;
      while (!isDatabaseReady() && attempts < 60) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      try {
        setError(null);

        const db = await getDatabase();

        // Fetch accounts ensuring hidden accounts are excluded
        const accRows = await db.getAllAsync(`
          SELECT * FROM accounts 
          WHERE is_hidden = 0 
          ORDER BY 
            CASE group_type
              WHEN 'Cash' THEN 1
              WHEN 'Accounts' THEN 2
              WHEN 'Savings' THEN 3
              WHEN 'Investments' THEN 4
              WHEN 'Loan' THEN 5
              ELSE 6
            END,
            sort_order ASC,
            name ASC
        `);

        const topCats = await getTopLevelCategories();

        setAccounts(Array.isArray(accRows) ? accRows : []);
        setCategories(topCats);

        // Load sub-categories for every top-level category
        const subsMap = {};
        for (const cat of topCats) {
          const subs = await getSubCategories(cat.id);
          if (subs.length > 0) {
            subsMap[cat.id] = subs;
          }
        }
        setSubCategories(subsMap);
      } catch (err) {
        console.log("Error loading data:", err.message);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // ===== Derived Data (very useful for forms) =====
  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  // ===== Actions =====
  const refreshAccounts = async () => {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync(`
      SELECT * FROM accounts
      WHERE is_hidden = 0
      ORDER BY 
        CASE group_type
          WHEN 'Cash' THEN 1
          WHEN 'Accounts' THEN 2
          WHEN 'Savings' THEN 3
          WHEN 'Investments' THEN 4
          WHEN 'Loan' THEN 5
          ELSE 6
        END,
        sort_order ASC,
        name ASC
    `);

      // Important: always set an array
      setAccounts(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.log("Error refreshing accounts:", error.message);
      setAccounts([]); // fallback
    }
  };

  const refreshCategories = async () => {
    try {
      const topCats = await getTopLevelCategories();
      setCategories(topCats);

      const subsMap = {};
      for (const cat of topCats) {
        const subs = await getSubCategories(cat.id);
        if (subs.length > 0) {
          subsMap[cat.id] = subs;
        }
      }
      setSubCategories(subsMap);
    } catch (err) {
      console.log("Error refreshing categories:", err.message);
    }
  };

  const refreshAll = async () => {
    await Promise.all([refreshAccounts(), refreshCategories()]);
  };

  // ===== Currency Formatter =====
  const formatMoney = (amount) => {
    const num = Number(amount) || 0;
    return `${currency.symbol}${num.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const value = {
    // Raw data
    accounts,
    categories,
    subCategories,
    currency,
    isLoading,
    error,

    // Derived data (ready for forms)
    incomeCategories,
    expenseCategories,

    // Actions
    setCurrency,
    refreshAccounts,
    refreshCategories,
    refreshAll,

    // Helpers
    formatMoney,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside an AppProvider");
  }
  return context;
}
