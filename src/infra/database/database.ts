import mongoose from "mongoose";

export async function connect() {
    try {
        await mongoose.connect('mongodb://mangas:ab231078@ac-h12u2ad-shard-00-00.7lvddts.mongodb.net:27017,ac-h12u2ad-shard-00-01.7lvddts.mongodb.net:27017,ac-h12u2ad-shard-00-02.7lvddts.mongodb.net:27017/?ssl=true&replicaSet=atlas-b93n8q-shard-0&authSource=admin&retryWrites=true&w=majority&appName=agenda')
        console.log('Database is connected');
    } catch (error) {
        console.log(error)
    }
}