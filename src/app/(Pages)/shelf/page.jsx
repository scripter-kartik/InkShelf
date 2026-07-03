import MyBooks from "@/components/MyBooks";
export const metadata = { title: "My Shelf" };
export default function ShelfPage() {
    return <MyBooks mode="shelf"/>;
}
