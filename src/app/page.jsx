import Navbar from "./components/Navbar";
import Home from "./components/Home";

export const metadata = {
  title: "InkShelf — Discover, Track & Love Your Books",
  description:
    "InkShelf is your free reading companion. Search millions of books, build your shelf, track progress, and discover your next favourite read.",
};

export default function Page() {
  return (
    <>
      <Navbar />
      <Home />
    </>
  );
}
