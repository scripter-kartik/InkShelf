export default function Home() {
  return (
    <div className="relative w-screen min-h-[calc(100vh-64px)] overflow-hidden">
      {/* Bird - visible on xl and above */}
      <img
        className="absolute top-0 left-0 h-[calc(100vh-64px)] w-auto object-contain z-0 hidden 2xl:block"
        src="/Bird.png"
        alt="Left Decorative Bird"
      />

      {/* Subtract - always visible */}
      <img
        className="absolute top-0 right-0 h-[calc(100vh-64px)] w-auto object-cover z-0"
        src="/Subtract.png"
        alt="Right Decorative Blob"
      />

      {/* Main content */}
      <div className="flex flex-col justify-center items-center gap-12 px-4 text-center h-[calc(100vh-64px)] relative z-10 max-w-6xl mx-auto">
        <h1 className="lg:text-green-400 bg-gradient-to-r from-green-400 to-black bg-clip-text text-transparent font-lato font-extrabold text-5xl sm:text-6xl md:text-7xl">
          Hi, we're InkShelf.
        </h1>

        <p className="text-2xl sm:text-3xl font-lato">
          The platform for all books to read free
        </p>

        <div className="max-w-xl px-2">
          <p className="font-extralight text-lg sm:text-xl text-gray-500">
            InkShelf is home to people who love reading books. We bring you a
            vast collection, so everything you need is in one place. No more
            worrying about where to find your next great read.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <button className="w-48 h-14 sm:h-16 bg-green-400 font-lato text-lg sm:text-xl rounded hover:bg-green-500 transition">
            Start Reading
          </button>
          <button className="w-48 h-14 sm:h-16 bg-green-400 font-lato text-lg sm:text-xl rounded hover:bg-green-500 transition">
            Start Writing
          </button>
        </div>
      </div>
    </div>
  );
}
