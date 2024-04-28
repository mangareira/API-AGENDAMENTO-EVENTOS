import mongoose from "mongoose";
import { UserRepository } from "./UserRepository";
import { User } from "../../entities/User";
import { randomUUID } from 'crypto';
import { IEventsPart } from "../../interface/IEventsPart";

const userEventsSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => randomUUID()
    },
    eventId: {
        type: String,
        ref: 'Events'
    },
    userId: {
        type: String,
        ref: 'UserAccounts'
    },
    payment: {
        status: String,
        txid: String,
        valor: String,
        qrCode: String,
        pixCopiaECola: String,
        expirationTime: String,
    },
    tickets: String,
    discount: String,
    createdAt: {
        type: Date,
        default: Date.now
    }

});

const UserModel = mongoose.model('UserEvents', userEventsSchema);

export class UserRepositoryMongoose implements UserRepository {
   
    async add(user: User): Promise<User> {
        const userModel = new UserModel(user);
        await userModel.save();
        return user;
    }
    
    async veridyIsUserExists(email: string): Promise<User | undefined> {
        const result = await UserModel.findOne({ email }).exec();
        return result ? result.toObject() : undefined;
    }
    async findUser(id: string): Promise<User | undefined> {
        const lastPurchase = await UserModel.findOne({ userId: id })
                .sort({ createdAt: -1 }) 
                .limit(1)
                .exec();

            return lastPurchase ? lastPurchase.toObject() : undefined;
    }
    async findEvent(id: string): Promise<IEventsPart[]> {
        const result = await UserModel.find({userId: id}).exec()
        return result.map((event) => event.toObject())
    }
}
