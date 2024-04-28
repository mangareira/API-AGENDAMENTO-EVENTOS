import { IPayment } from "./IPayment"

export interface IEventsPart {
    _id: string
    eventId: string
    userid: string
    payment: IPayment
    tickets: string
    discount: string
}