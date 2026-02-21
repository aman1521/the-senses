const Button = ({ children, onClick, variant = "primary", disabled }) => {
  const base =
    "px-6 py-3 rounded-xl font-medium transition-all duration-200";

  const variants = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white",
    secondary: "bg-white/10 hover:bg-white/20 text-white",
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </button>
  );
};

export default Button;
