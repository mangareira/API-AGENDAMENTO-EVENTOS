import mongoose from "mongoose";
require('dotenv').config()        

export async function connect() {
    try {
        if(!process.env.MONGO_URL_SANDBOX) return 
        if(!process.env.MONGO_URL_PROD) return
        // await mongoose.connect(process.env.MONGO_URL_PROD)
        await mongoose.connect(process.env.MONGO_URL_SANDBOX)
        console.log('Database is connected');
    } catch (error) {
        console.log(error)
    }
}