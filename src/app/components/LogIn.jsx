"use client";
import { signIn } from "next-auth/react";
export default function LogIn({ onClose }) {
    return (<div className="w-[340px] h-[570px] sm:w-[380px] sm:h-[600px] relative bg-white rounded">
      <img onClick={onClose} className="absolute top-3 right-3 cursor-pointer" src="/cross.png" alt=""/>
      <div className="py-16 px-5 flex flex-col items-center justify-center w-full h-full gap-10">
        <h1 className="text-2xl font-extrabold">LogIn to InkShelf</h1>
        <div className="flex flex-col gap-3">
          <div onClick={() => signIn("google")} className="flex bg-white border-2 border-black rounded-full items-center w-72 h-12 justify-center gap-2 cursor-pointer">
            <img className="w-5 h-5" src="/google.png" alt=""/>
            <h1 className="font-extrabold text-sm">LogIn with Google</h1>
          </div>
          <div className="flex bg-white border-2 border-black rounded-full items-center w-72 h-12 justify-center gap-2 cursor-pointer">
            <img className="w-5 h-5" src="/facebook.png" alt=""/>
            <h1 className="font-extrabold text-sm">LogIn with Facebook</h1>
          </div>
          <div className="flex items-center gap-4 w-full max-w-md mx-auto my-6">
            <hr className="flex-grow border-t border-gray-300"/>
            <span className="text-gray-300 text-sm">or</span>
            <hr className="flex-grow border-t border-gray-300"/>
          </div>
          <div className="flex bg-black border-2 border-black rounded-full items-center w-72 h-12 justify-center gap-2 cursor-pointer">
            <h1 className="font-extrabold text-sm text-white">
              LogIn with email
            </h1>
          </div>
        </div>
        <div className="w-72 h-12 flex items-center justify-center hover:bg-gray-200 rounded-full cursor-pointer">
          <p className="font-winky font-bold">Forgot Password ?</p>
        </div>
        <div className="w-72 h-12 flex items-center justify-center hover:bg-gray-200 rounded-full cursor-pointer">
          <p className="font-winky font-bold">Don't have an account? Sign Up</p>
        </div>
      </div>
    </div>);
}
