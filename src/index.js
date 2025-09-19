import mongoose from "mongoose";

import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config();

connectDB();

// (async ()=>{
//     try {
//         mongoose.connect(`$(process.env.MONGO_URI)/${DB_NAME}`);
//     }catch(error){
//         console.log("Error: ", error);
//         throw error;
//     }
// })()