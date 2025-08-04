import User from "../../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

mongoose
  .connect(process.env.NEXT_PUBLIC_MONGO_URI)
  .then(() => console.log("MONGODB CONNECTED SUCCESSFULLY"))
  .then((error) => console.log(error));

export async function POST(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.json({ message: "fill all the details", success: false });
  }
  const hashPassword = bcrypt.hash(password, 10);
}
