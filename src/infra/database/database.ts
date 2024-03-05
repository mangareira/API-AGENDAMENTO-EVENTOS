import mongoose from "mongoose";

export async function connect() {
    try {
        await mongoose.connect('mongodb://ghabryellsantos:ab231078@ac-6gua5wh-shard-00-00.sduz1qv.mongodb.net:27017,ac-6gua5wh-shard-00-01.sduz1qv.mongodb.net:27017,ac-6gua5wh-shard-00-02.sduz1qv.mongodb.net:27017/?ssl=true&replicaSet=atlas-gf3194-shard-0&authSource=admin&retryWrites=true&w=majority&appName=eventosAgenda')
        console.log('Database is connected');
        
    } catch (error) {
        console.log(error)
    }
}