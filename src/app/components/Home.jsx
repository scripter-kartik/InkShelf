"use client";
import Link from "next/link";
import { motion } from "framer-motion";
const container = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
};
const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};
export default function Home() {
    return (<div className="relative w-full min-h-[calc(100vh-64px)] overflow-hidden bg-white dark:bg-gray-950">
      <motion.img initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }} className="absolute top-0 left-0 h-[calc(100vh-64px)] w-auto object-contain z-0 hidden 2xl:block pointer-events-none" src="/Bird.png" alt=""/>
      <motion.img initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} className="absolute top-0 right-0 h-[calc(100vh-64px)] w-auto object-cover z-0 pointer-events-none" src="/Subtract.png" alt=""/>
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col justify-center items-center gap-8 sm:gap-10 px-4 text-center h-[calc(100vh-64px)] relative z-10 max-w-5xl mx-auto">
        <motion.h1 variants={fadeUp} className="bg-gradient-to-r from-green-400 via-green-500 to-black dark:to-white bg-clip-text text-transparent font-lato font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-tight tracking-tight">
          Hi, we're InkShelf.
        </motion.h1>
        <motion.p variants={fadeUp} className="text-xl sm:text-2xl font-lato text-gray-700 dark:text-gray-200 font-medium">
          The platform for all books to read free
        </motion.p>
        <motion.p variants={fadeUp} className="max-w-lg text-base sm:text-lg text-gray-500 dark:text-gray-400 font-light leading-relaxed">
          InkShelf is home to people who love reading books. We bring you a vast collection, so everything you need is in one place. No more worrying about where to find your next great read.
        </motion.p>
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <Link href="/books">
            <motion.button whileHover={{ scale: 1.06, boxShadow: "0 8px 30px rgba(74,222,128,0.4)" }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} className="w-48 h-14 bg-green-400 font-lato text-lg font-semibold rounded-xl hover:bg-green-500 transition-colors shadow-lg dark:bg-green-600 dark:hover:bg-green-500 dark:text-white">
              Start Reading
            </motion.button>
          </Link>
          <Link href="/shelf">
            <motion.button whileHover={{ scale: 1.06, boxShadow: "0 8px 30px rgba(74,222,128,0.4)" }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} className="w-48 h-14 bg-green-400 font-lato text-lg font-semibold rounded-xl hover:bg-green-500 transition-colors shadow-lg dark:bg-green-600 dark:hover:bg-green-500 dark:text-white">
              My Shelf
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </div>);
}
