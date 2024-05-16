import { UserAccount } from "../../entities/UserAccount";

export interface UserAccountRepository {
    add(user: UserAccount): Promise<UserAccount>
    findUser(email: string): Promise<UserAccount | undefined>
    findUserById(id: string): Promise<UserAccount | undefined>
    findUsers(q?: string | any, page?: number): Promise<UserAccount[]>
    update(user: UserAccount, userId: string): Promise<any>
}