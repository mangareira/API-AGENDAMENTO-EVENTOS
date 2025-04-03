import { User } from "../../entities/User";
import { IEventsPart } from "../../interface/IEventsPart";
import { IExport } from "../../interface/IExport";

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
    deletePay(eventId: string, userId: string): Promise<User | null>
    export(data: IExport): Promise<User[]| undefined>
    isConfirm(id: string, isConfirm: boolean, eventId: string): Promise<void>
    findSlug(slug: string): Promise<{userId: string, eventId: string} | undefined>
    findAllpaysEvent(id: string): Promise<User[] | undefined>
    deletePayWebHook(txid: string): Promise<void>
}