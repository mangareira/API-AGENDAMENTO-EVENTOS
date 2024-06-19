import { UserAccount } from "../../entities/UserAccount";
import { IExport } from "../../interface/IExport";

export interface UserAccountRepository {
    add(user: UserAccount): Promise<UserAccount>
    findUser(email: string): Promise<UserAccount | undefined>
    findUserById(id: string): Promise<UserAccount | undefined>
    findUsers(q?: string | any, page?: number): Promise<UserAccount[]>
    update(user: UserAccount, userId: string): Promise<any>
    updateUser(user: UserAccount, userId: string): Promise<UserAccount | undefined>
    deleteEvent(payId: string, userId: string): Promise<null>
    delete(id: string): Promise<any>
    export(data: IExport): Promise<UserAccount[] | undefined>
}