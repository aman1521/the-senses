function Loader({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-lg text-zinc-400 gap-3">
      <i className="fa-solid fa-circle-notch fa-spin text-3xl text-indigo-500"></i>
      <span>{text}</span>
    </div>
  );
}

export default Loader;
