import mongoose from "mongoose";

export async function connect() {
    try {
        await mongoose.connect('mongodb+srv://ghabryellsantos:ab231078@eventosagenda.sduz1qv.mongodb.net/')
        console.log('Conected to database');
    } catch (error) {
        console.log(error)
    }
}