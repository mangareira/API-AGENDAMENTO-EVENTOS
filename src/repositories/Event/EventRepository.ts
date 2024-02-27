import { Event } from "../../entities/Events";
import { Location } from "../../entities/Location";

export interface EventRepository {
    add(event: Event): Promise<Event>
    findByLocationAndDate(location: Location, date: Date): Promise<Event | undefined>
    findEventsByCity(city: string): Promise <Event[]>
    findEventsByCategory(category: string): Promise<Event[]>
}