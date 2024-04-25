import mongoose from "mongoose";
import { UserRepository } from "./UserRepository";
import { User } from "../../entities/User";
import { randomUUID } from 'crypto';

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
        .sort({ createdAt: -1 }) // Ordenar por data de criação em ordem decrescente
        .limit(1) // Limitar o resultado a 1
        .exec();
        
        return lastPurchase ? lastPurchase.toObject() : undefined;
    }
    async findTxid(id: string): Promise<User | undefined> {
        const user = await UserModel.findOne({ 'payment.txid': id }).exec();

        if (!user) {
            return undefined;
        }

        user.payment = {
            status: 'Pago',
            valor: user.payment?.valor
        }
        await user.save()
        
        return user ? user.toObject() : undefined;
    }
}
