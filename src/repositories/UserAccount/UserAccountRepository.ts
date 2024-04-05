import { UserAccount } from "../../entities/UserAccount";

export interface UserAccountRepository {
    add(user: UserAccount): Promise<UserAccount>
    findUser(email: string): Promise<UserAccount | undefined>
    findUserById(id: string): Promise<UserAccount | undefined>
    update(user: UserAccount, userId: string): Promise<any>
}