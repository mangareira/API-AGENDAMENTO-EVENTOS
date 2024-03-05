import { Event } from "../../entities/Events";
import { Location } from "../../entities/Location";
import { IFilterProps } from "../../interface/IFilter";

export interface EventRepository {
    add(event: Event): Promise<Event>
    findByLocationAndDate(location: Location, date: Date): Promise<Event | undefined>
    findEventsByCity(city: string): Promise <Event[]>
    findEventsByCategory(category: string): Promise<Event[]>
    findEventsMain(date: Date): Promise<Event[]>
    findEventsByName(name: string): Promise<Event[]>;
    findEventsById(id: string): Promise<Event | undefined>
    findEventsByFilter(data: IFilterProps): Promise<Event[]>
    update(event: Event, id: string): Promise<any>
}