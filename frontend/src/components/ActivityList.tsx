const ActivityList = () => {
  const activities = [
    "update_v2.exe blocked",
    "invoice_march.zip detected",
    "report_final.doc scanned",
    "presentation.pptx uploaded",
    "payload.bat blocked"
  ];

  return (
    <div className="bg-slate-800 p-6 rounded-xl">
      <h2 className="font-semibold mb-4">Recent Activity</h2>

      <ul className="space-y-2 text-gray-300">
        {activities.map((item, i) => (
          <li key={i} className="border-b border-slate-700 pb-2">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityList;