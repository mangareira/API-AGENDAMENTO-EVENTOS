import { User } from "../../entities/User";
import { IEventsPart } from "../../interface/IEventsPart";

export interface UserRepository {
    add(user: User): Promise<User>
    veridyIsUserExists(email: string): Promise<any>
    findUser(id: string): Promise<User | undefined>
    findTxid(id: string): Promise<User | undefined>
    findEvent(id: string): Promise<IEventsPart[]>
    findPay(id: string, userId: string): Promise<any>
    findPayByTxid(txid: string): Promise<User | undefined>
    getAllPay(p?:number): Promise<User[] | undefined>
    updateUser(data:any, qrCode:string, txid: string): Promise<User | undefined>
    deletePay(eventId: string, userId: string): Promise<null>
}