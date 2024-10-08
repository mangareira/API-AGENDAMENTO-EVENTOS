import { Event } from "../../entities/Events";
import { Location } from "../../entities/Location";
import { IExport } from "../../interface/IExport";
import { IFilterProps } from "../../interface/IFilter";

export interface EventRepository {
    add(event: Event): Promise<Event>
    findByLocationAndDate(location: Location, date: Date): Promise<Event | undefined>
    findEventsByCity(city: string): Promise <Event[]>
    findEventsByCategory(category: string,page?: number | any, limit?: number | any): Promise<Event[]>
    findEventsMain(date: Date): Promise<Event[]>
    findEventsByName(name: string): Promise<Event[]>;
    findEventsById(id?: string): Promise<Event | undefined>
    findEventsByFilter(data: IFilterProps): Promise<Event[]>
    findEventsByUserId(id: string, page: number, limit: number): Promise<Event[]>
    findEvents(q?: string, page?: number): Promise<Event[]>
    findUserEvents(q?: string | any, page?: number | any, id?: string): Promise<Event[] | any>
    update(event: Event, id: string): Promise<any>
    updateEvent(event: Event, eventId: string): Promise<Event | undefined> 
    deleteUser(userId: string, eventId: string): Promise<any>
    delete(id: string): Promise<"Deletado">
    export(data: IExport): Promise<Event[]| undefined>
}