import { User } from "../../entities/User";

export interface UserRepository {
    add(user: User): Promise<User>
    veridyIsUserExists(email: string): Promise<any>
}