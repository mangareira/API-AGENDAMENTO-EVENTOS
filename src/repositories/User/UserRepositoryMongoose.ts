import mongoose from "mongoose"
import { UserRepository } from "./UserRepository"
import { User } from "../../entities/User"

const userSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: new mongoose.Types.ObjectId().toString(),
    },
    name: String,
    email: String
})

const UserModel = mongoose.model('User', userSchema)

export class UserRepositoryMongoose implements UserRepository{
    async add(user: User): Promise<User> {
        const eventModel = new UserModel(user)
        await eventModel.save()
        return user
    }
    async veridyIsUserExists(email: string): Promise<User | undefined> {
        const result  = await UserModel.findOne({email}).exec()

        return result ? result.toObject() : undefined
    }
}