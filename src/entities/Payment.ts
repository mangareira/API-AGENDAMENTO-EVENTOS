export class Payment {
    constructor(
        public status: string,
        public txid: any,
        public valor: number,
        public qrCode: any
    ) {}
}