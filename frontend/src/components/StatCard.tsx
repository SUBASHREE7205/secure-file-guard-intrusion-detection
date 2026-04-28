
type Props = {
  title: string;
  value: number;
  color: string;
};

const StatCard = ({ title, value, color }: Props) => {
  return (
    <div className={`p-5 rounded-xl bg-slate-800 border ${color}`}>
      <p className="text-gray-400">{title}</p>
      <h2 className="text-3xl font-bold mt-2">{value}</h2>
    </div>
  );
};

export default StatCard;