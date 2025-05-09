// import React, { useEffect, useState } from "react";
// import { Pie } from "react-chartjs-2";
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
// import { useAuth } from "@clerk/clerk-react";
// import styles from "../styles/ExpenseChart.module.css";

// ChartJS.register(ArcElement, Tooltip, Legend);

// const ExpenseChart = () => {
//   const { getToken } = useAuth();
//   const [chartData, setChartData] = useState(null);

//   useEffect(() => {
//     const fetchExpenses = async () => {
//       const token = await getToken();
//       const res = await fetch("http://localhost:8000/expenses/", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();

//       // Aggregate expenses by category
//       const categoryTotals = {};
//       data.forEach((expense) => {
//         const { category, amount } = expense;
//         categoryTotals[category] = (categoryTotals[category] || 0) + amount;
//       });

//       // Prepare data for Chart.js
//       const labels = Object.keys(categoryTotals);
//       const values = Object.values(categoryTotals);

//       setChartData({
//         labels,
//         datasets: [
//           {
//             data: values,
//             backgroundColor: [
//               "#7b61ff",
//               "#9f82ff",
//               "#b9a3ff",
//               "#ffd76d",
//               "#ff9f68",
//               "#66d9e8",
//               "#ffc8dd",
//               "#a0c4ff",
//             ],
//             borderWidth: 5,
//           },
//         ],
//       });
//     };

//     fetchExpenses();
//   }, [getToken]);

//   return (
//     <div className={styles.chartContainer}>
//       <h2>Spending by Category</h2>
//       {chartData ? <Pie data={chartData} /> : <p>Loading chart...</p>}
//     </div>
//   );
// };

// export default ExpenseChart;


import React, { useEffect, useState, useRef } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useAuth } from "@clerk/clerk-react";
import styles from "../styles/ExpenseChart.module.css";

ChartJS.register(ArcElement, Tooltip, Legend, Title, ChartDataLabels);

const ExpenseChart = () => {
  const { getToken } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [month, setMonth] = useState("");
  const chartRef = useRef();

  useEffect(() => {
    const fetchExpenses = async () => {
      const token = await getToken();
      const res = await fetch("http://localhost:8000/expenses/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setExpenses(data);
    };
    fetchExpenses();
  }, [getToken]);

  const getAvailableMonths = () => {
    const monthSet = new Set();
    expenses.forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      monthSet.add(key);
    });
    return [...monthSet].sort((a, b) => (a < b ? 1 : -1));
  };

  useEffect(() => {
    const filtered = expenses.filter((e) => {
      if (!month) return true;
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      return key === month;
    });

    const totals = {};
    filtered.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });

    const labels = Object.keys(totals);
    const values = Object.values(totals);

    setChartData({
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#7b61ff", "#9f82ff", "#b9a3ff", "#ffd76d", "#ff9f68",
            "#66d9e8", "#ffc8dd", "#a0c4ff",
          ],
          borderWidth: 1,
        },
      ],
    });
  }, [expenses, month]);

  const handleDownload = () => {
    const url = chartRef.current.toBase64Image();
    const link = document.createElement("a");
    link.href = url;
    link.download = `expense-chart-${month || "all"}.png`;
    link.click();
  };

  return (
    <div className={styles.chartContainer}>
      <h2>Spending by Category</h2>

      <div className={styles.filterContainer}>
        <label>
          Month:
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">All</option>
            {getAvailableMonths().map((m) => (
              <option key={m} value={m}>
                {new Date(m + "-01").toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </option>
            ))}
          </select>
        </label>

        <button className={styles.downloadBtn} onClick={handleDownload}>
          Download PNG
        </button>
      </div>

      {chartData && chartData.datasets[0].data.length > 0 ? (
        <Pie
          ref={chartRef}
          data={chartData}
          options={{
            plugins: {
              datalabels: {
                formatter: (val, ctx) => {
                  const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                  const percentage = ((val / total) * 100).toFixed(1);
                  return `${percentage}%`;
                },
                color: "#fff",
                font: {
                  weight: "bold",
                },
              },
              legend: {
                position: "bottom",
              },
              title: {
                display: false,
              },
            },
          }}
        />
      ) : (
        <p>No expense data available to display.</p>
      )}
    </div>
  );
};

export default ExpenseChart;
