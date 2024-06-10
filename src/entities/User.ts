import { Payment } from "./Payment";

export class User{
    constructor(
        public eventId: string,
        public userId: string,
        public payment: Payment,
        public tickets: string,
        public discount: string,
        public _id?: string,
        public createdAt?: string
    ) {}
}