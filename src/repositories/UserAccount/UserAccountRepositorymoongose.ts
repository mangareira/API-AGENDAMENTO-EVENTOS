import mongoose from "mongoose";
import { randomUUID } from 'crypto';
import { UserAccountRepository } from "./UserAccountRepository";
import { UserAccount } from "../../entities/UserAccount";



const userAccountSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => randomUUID()
    },
    name: String,
    email: String,
    cpf: String,
    password: String,
    eventos: {
        type: Array,
        ref: 'UserEvents'
    }
});

const UserAccountModel = mongoose.model('UserAccount', userAccountSchema);

export class UserAccountRepositoryMongoose implements UserAccountRepository {
    async add(user: UserAccount): Promise<UserAccount> {
        const userAccountModel = new UserAccountModel(user);
        await userAccountModel.save();
        return user;
    }
    async findUser(email: string): Promise<UserAccount | undefined> {
        const result = await UserAccountModel.findOne({email}).exec()
        return result ? result.toObject() : undefined
    }
    async findUserById(id: string): Promise<UserAccount | undefined> {
        const result = await UserAccountModel.findById({_id: id}).exec()
        return result ? result.toObject() : undefined
    }
    async update(user: UserAccount, userId: string): Promise<any> {
        const updateUser = await UserAccountModel.updateMany({_id: userId}, user,)
        return user
    }
}