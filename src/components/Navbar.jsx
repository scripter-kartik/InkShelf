export default function Navbar() {
  return (
    <div className="flex items-center w-screen h-16 bg-green-400 px-8 py-2 border-b-2 border-black justify-between">
      <div className="flex items-center lg:gap-8 xl:gap-12 2xl:gap-20">
        <div className="flex items-center gap-4">
          <img className="w-8 h-8" src="/icon.png" alt="" />
          <h1 className="font-bold text-xl font-playwrite">InkShelf</h1>
        </div>
        <button className="font-winky lg:flex justify-center items-center gap-2 text-xl font-semibold hidden">
          Browse <img className="w-4 h-4" src="/downArrow.png" alt="" />
        </button>
        <div className="lg:flex rounded-[10px] text-black px-3 bg-white gap-1 w-80 h-12 items-center sm:hidden lg:mr-5 hidden border-2 border-gray-400">
          <img className="w-5 h-5" src="/search.png" alt="" />
          <input
            className="rounded-2xl text-xl px-2 w-80 h-8 border-none outline-none font-light font-mono"
            type="text"
            placeholder="Search"
          />
        </div>
      </div>
      <div className="flex gap-10">
        <div className="sm:flex items-center gap-2 hidden">
          <h1 className="font-winky text-xl font-semibold">write</h1>
          <img className="w-4 h-4" src="/downArrow.png" alt="" />
        </div>
        <div className="sm:flex items-center gap-10 hidden">
          <button className="font-winky text-xl font-semibold">SignUp</button>
          <button className="font-winky text-xl font-semibold">Login</button>
        </div>
        <button>
          <img className="w-8 h-8 lg:hidden" src="/search.png" alt="" />
        </button>
      </div>
    </div>
  );
}
