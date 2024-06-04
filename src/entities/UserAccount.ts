

export class UserAccount {
    constructor(
        public name: string,
        public email: string,
        public eventos: string[],
        public role: string,
        public cpf?: string,
        public password?: string,
        public _id?: string,
        public createdAt?: string
    ) {}
}