import { Location } from "./Location";
import { Price } from "./Price";
import { User } from "./User";

export class Event {
    constructor(
        public title: string,
        public location: Location,
        public date: Date,
        public finalDate: Date,
        public hours: number,
        public description: string,
        public banner: string,
        public flyers: string[],
        public coupons: string[],
        public participants: string[],
        public price: Price[],
        public city: string,
        public categories: string[],
        public formattedAddress: string,
        public limit: number
    ) {}
}