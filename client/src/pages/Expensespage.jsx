import React, { useEffect, useState } from "react";
import api from "../utils/Api";
import UniLifeLoader from "../components/Loader/UniLifeLoader";
import {
  DollarSign,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
} from "lucide-react";

const categories = [
  "food",
  "transport",
  "books",
  "fees",
  "accommodation",
  "entertainment",
  "health",
  "other",
];
const catColors = {
  food: "bg-orange-100 text-orange-700",
  transport: "bg-blue-100 text-blue-700",
  books: "bg-purple-100 text-purple-700",
  fees: "bg-red-100 text-red-700",
  accommodation: "bg-green-100 text-green-700",
  entertainment: "bg-pink-100 text-pink-700",
  health: "bg-teal-100 text-teal-700",
  other: "bg-gray-100 text-gray-600",
};

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "food",
    type: "expense",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchExpenses();
  }, [month]);

  const fetchExpenses = async () => {
    try {
      const res = await api.get(`/expenses?month=${month}&year=${year}`);
      setExpenses(res.data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      await api.post("/expenses", { ...form, amount: parseFloat(form.amount) });
      setShowAdd(false);
      setForm({
        title: "",
        amount: "",
        category: "food",
        type: "expense",
        date: new Date().toISOString().split("T")[0],
        note: "",
      });
      fetchExpenses();
    } catch (err) {
      alert("Failed to add exp");
      // console.log(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err) {}
  };

  const totalIncome = expenses
    .filter((e) => e.type === "income")
    .reduce((s, e) => s + e.amount, 0);
  const totalExpense = expenses
    .filter((e) => e.type === "expense")
    .reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const categoryTotals = categories
    .map((cat) => ({
      cat,
      total: expenses
        .filter((e) => e.category === cat && e.type === "expense")
        .reduce((s, e) => s + e.amount, 0),
    }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-primary-600" /> Expense Tracker
        </h1>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Month selector */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {months.map((m, i) => (
          <button
            key={m}
            onClick={() => setMonth(i + 1)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex-shrink-0 transition-colors ${month === i + 1 ? "bg-blue-400 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card bg-green-50">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Income</span>
          </div>
          <p className="text-2xl font-bold text-green-700">
            ৳{totalIncome.toLocaleString()}
          </p>
        </div>
        <div className="card bg-red-50">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">Expenses</span>
          </div>
          <p className="text-2xl font-bold text-red-700">
            ৳{totalExpense.toLocaleString()}
          </p>
        </div>
        <div className={`card ${balance >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpDown
              className={`w-4 h-4 ${balance >= 0 ? "text-blue-600" : "text-orange-600"}`}
            />
            <span
              className={`text-sm font-medium ${balance >= 0 ? "text-blue-700" : "text-orange-700"}`}
            >
              Balance
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${balance >= 0 ? "text-blue-700" : "text-orange-700"}`}
          >
            ৳{Math.abs(balance).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      {categoryTotals.length > 0 && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Expense Breakdown
          </h3>
          <div className="space-y-2">
            {categoryTotals.map(({ cat, total }) => (
              <div key={cat} className="flex items-center gap-3">
                <span className={`badge w-24 justify-center ${catColors[cat]}`}>
                  {cat}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(total / totalExpense) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-24 text-right">
                  ৳{total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <UniLifeLoader size="md" />
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.length === 0 ? (
            <div className="card text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No transactions this month.</p>
            </div>
          ) : (
            expenses.map((e) => (
              <div
                key={e._id}
                className="card flex items-center justify-between group py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${e.type === "income" ? "bg-green-100" : "bg-red-100"}`}
                  >
                    {e.type === "income" ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {e.title}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`badge text-xs ${catColors[e.category]}`}
                      >
                        {e.category}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(e.date).toLocaleDateString()}
                      </span>
                      {e.note && (
                        <span className="text-xs text-gray-400">
                          · {e.note}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold ${e.type === "income" ? "text-green-600" : "text-red-600"}`}
                  >
                    {e.type === "income" ? "+" : "-"}৳
                    {e.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleDelete(e._id)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-lg mb-4">Add Transaction</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setForm((p) => ({ ...p, type: "expense" }))}
                  className={`py-2.5 rounded-lg font-medium text-sm ${form.type === "expense" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600"}`}
                >
                  Expense
                </button>
                <button
                  onClick={() => setForm((p) => ({ ...p, type: "income" }))}
                  className={`py-2.5 rounded-lg font-medium text-sm ${form.type === "income" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600"}`}
                >
                  Income
                </button>
              </div>
              <div>
                <label className="label">Title *</label>
                <input
                  className="input"
                  placeholder="What was this for?"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label">Amount *</label>
                <input
                  className="input"
                  type="number"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select
                    className="input"
                    value={form.category}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, category: e.target.value }))
                    }
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input
                    className="input"
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, date: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="label">Note</label>
                <input
                  className="input"
                  placeholder="Optional note"
                  value={form.note}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, note: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleAdd} className="btn-primary flex-1">
                Add
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
