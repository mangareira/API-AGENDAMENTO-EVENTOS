import mongoose from "mongoose";
import { UserRepository } from "./UserRepository";
import { User } from "../../entities/User";
import { randomUUID } from 'crypto';

const userSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => randomUUID()
    },
    name: String,
    email: String,
    payment: {
        status: String,
        txid: String,
        valor: String,
        qrCode: String,
        pixCopiaECola: String,
        expirationTime: String,
    },
    tickets: String,
    discount: String

});

const UserModel = mongoose.model('User', userSchema);

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
    async findUser(id: string): Promise<any> {
        const result = await UserModel.findOne({_id: id}).exec()
        return result ? result.toObject() : undefined;
    }
}
