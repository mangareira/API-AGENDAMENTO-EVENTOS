import { Location } from "./Location";
import { Price } from "./Price";
import { User } from "./User";

export class Event {
    constructor(
        public title: string,
        public ocation: Location,
        public date: Date,
        public description: string,
        public banner: string,
        public coupons: string[],
        public participants: User[],
        public price: Price[],
        public city: string,
    ) {

    }
}