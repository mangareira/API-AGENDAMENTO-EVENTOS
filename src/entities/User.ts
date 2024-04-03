import { Payment } from "./Payment";

export class User{
    constructor(
        public name: string,
        public email: string,
        public payment: Payment,
        public tickets: string,
        public discount: string
    ) {}
}