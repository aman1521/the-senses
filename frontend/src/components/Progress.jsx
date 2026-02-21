const Progress = ({ current, total }) => {
  const percent = (current / total) * 100;

  return (
    <div className="w-full bg-white/10 rounded-full h-2 mb-6">
      <div
        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

export default Progress;
