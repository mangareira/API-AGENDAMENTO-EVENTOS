import { User } from "../../entities/User";
import { IEventsPart } from "../../interface/IEventsPart";

export interface UserRepository {
    add(user: User): Promise<User>
    veridyIsUserExists(email: string): Promise<any>
    findUser(id: string): Promise<User | undefined>
    findTxid(id: string): Promise<User | undefined>
    findEvent(id: string): Promise<IEventsPart[]>
}