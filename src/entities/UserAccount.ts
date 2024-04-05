

export class UserAccount {
    constructor(
        public name: string,
        public email: string,
        public cpf: string,
        public password: string,
        public eventos: string[]
    ) {}
}