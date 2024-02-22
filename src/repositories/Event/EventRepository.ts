import { Event } from "../../entities/Events";

export interface EventRepository {
    add(event: Event): Promise<Event>
}