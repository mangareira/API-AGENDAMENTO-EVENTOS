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
    },
    role: {
        type: String,
        default: "participant"
    },
    createdAt: {
        type: Date,
        default: Date.now
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
    async findUsers(q?: string | any, page?: number | any): Promise<UserAccount[] | any> {
        const regex = new RegExp(q, "i")
        const itemPage = 6
        const count = (await UserAccountModel.find({name : {$regex: regex }})).length
        const result = await UserAccountModel.find({name : {$regex: regex }}).limit(itemPage).skip(itemPage * (page-1)).exec()         
        return {users : result.map((event) => event.toObject()), count}
    }
    async delete(id:string):Promise<any> {
        await UserAccountModel.findOneAndDelete({_id:id})
    }
    async updateUser(user: UserAccount, userId: string): Promise<UserAccount | undefined> {
        const result = await UserAccountModel.findByIdAndUpdate(userId, user)
        return result ? result.toObject() : undefined
    }
}