import { PieChart, Pie, Cell, Tooltip } from "recharts";

const data = [
  { name: "Critical", value: 2 },
  { name: "High", value: 1 },
  { name: "Medium", value: 1 },
  { name: "Low", value: 1 }
];

const COLORS = ["#ef4444", "#f97316", "#eab308", "#3b82f6"];

const ThreatChart = () => {
  return (
    <div className="bg-slate-800 p-6 rounded-xl">
      <h2 className="mb-4 font-semibold">Threat Distribution</h2>

      <PieChart width={250} height={250}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index]} />
          ))}
        </Pie>

        <Tooltip />
      </PieChart>
    </div>
  );
};

export default ThreatChart;