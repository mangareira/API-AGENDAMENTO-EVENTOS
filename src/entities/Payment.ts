export class Payment {
    constructor(
        public status: string,
        public txid: any,
        public valor: string,
        public qrCode: any
    ) {}
}