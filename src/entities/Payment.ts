export class Payment {
    constructor(
        public status: string,
        public txid: any,
        public valor: string,
        public qrCode: any,
        public pixCopiaECola: string,
        public expirationTime: string
    ) {}
}