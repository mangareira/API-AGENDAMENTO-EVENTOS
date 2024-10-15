import mongoose from "mongoose"
import { Event } from "../../entities/Events"
import { EventRepository } from "./EventRepository"
import { Location } from "../../entities/Location"
import { randomUUID } from 'crypto';
import { IFilterProps } from "../../interface/IFilter"
import { IExport } from "../../interface/IExport";

const eventSchema = new mongoose.Schema({
    title: String,
    location: {
        latitude: String,
        longitude: String,
    },
    date: Date,
    finalDate: Date,
    hours: Number,
    createdAt: {
        type: Date,
        default: Date.now
    },
    coupons: [String],
    description: String,
    categories: [String],
    banner: String,
    flyers: [String],
    price: {
        type: Array
    },
    city: String,
    formattedAddress: String,
    participants: {
        ref: 'User',
        type: Array,
    },
    limit: Number
})

const EventModel = mongoose.model('Event', eventSchema)

export class EventRepositoryMongoose implements EventRepository{
    
    async add(event: Event): Promise<Event> {
        const eventModel = new EventModel(event)
        await eventModel.save()
        return event
    }
    async findByLocationAndDate(location: Location, date: Date): Promise<Event | undefined> {
        const findEvent = await EventModel.findOne({location, date}).exec()
        return findEvent ? findEvent.toObject(): undefined
    }
    async findEventsByCity(city: string): Promise<Event[]> {
        const findEvent = await EventModel.find({city}).exec()
        return findEvent.map((event) => event.toObject())
    }
    async findEventsByCategory(category: string,page?: number | any, limit?: number | any): Promise<Event[] | any> {
        const skip = (page - 1) * limit
        const findEvent = await EventModel.find({categories: category}).skip(skip).limit(limit).exec()
        const quantity = (await EventModel.find({ categories: category })).length
        return {events: findEvent.map((event) => event.toObject()), quantity}
    }
    async findEventsByName(name: string): Promise<Event[]> {
        const findEvent = await EventModel.find({title: {
            $regex: name,
            $options: 'i'
        } })
        .sort({date: 1})
        .limit(4)
        .exec()
        return findEvent.map((event) => event.toObject())
    }  
    async findEventsById(id: string): Promise<Event | undefined> {        
        const findEvent = await EventModel.findOne({_id: id}).exec()
        return findEvent ? findEvent.toObject(): undefined
    }
    async update(event: Event, id: string): Promise<any> {
        const updateEvent = await EventModel.updateMany({_id: id}, event,)
        return event
    }
    async findEventsMain(date: Date): Promise<Event[]> {
        const endDate = new Date(date);
        endDate.setMonth(endDate.getMonth() + 1);
        const findEvent = await EventModel.find({
            date: { $gte: date, $lt: endDate },
        })
        .sort({date: 1})
        .limit(4)
        .exec();    
        return findEvent.map((event) => event.toObject());
    }
    async findEventsByFilter(data: IFilterProps): Promise<Event[]> {     
        const query = {
            $and: [
                // Verifica o título, se 'data.name' estiver presente usa regex para busca parcial e case-insensitive
                { title: (data.name !== 'undefined') ? {
                    $regex: data.name,
                    $options: 'i'
                } : { $exists: true } },
        
                // Verifica a data, se 'data.date' estiver presente faz uma comparação com '$gte'
                { date: (data.date !== 'undefined' ) ? { $gte: new Date(data.date) } : { $exists: true } },
        
                // Verifica categorias, se 'data.category' estiver presente, usa '$in' para buscar na lista de categorias
                { categories: data.category && data.category.trim() !== '' ? {
                    $in: [data.category]
                } : { $exists: true } },
        
                // Verifica a latitude e longitude, e faz a comparação correta usando números
                {
                    'location.latitude': !Number.isNaN(data.latitude) ? {
                        $gte: data.latitude - data.radius,
                        $lte: data.latitude + data.radius
                    }: {$exists: true},
                    'location.longitude': !Number.isNaN(data.latitude) ? {
                        $gte: data.longitude - data.radius,
                        $lte: data.longitude + data.radius
                    } : {$exists: true}
                }
            ]
        };
        
        const findEvent = await EventModel.find(query).exec();      
        
        return findEvent.map((event) => event.toObject())
    }
    async findEventsByUserId(id: string, page: number, limit: number): Promise<Event[] | any> {
        const skip = (page - 1) * limit;
        const result = await  EventModel.find({participants: id}).skip(skip).limit(limit).exec()
        const quantity = await  EventModel.countDocuments({participants: id})
        return {events: result.map((event) => event.toObject()), quantity: quantity}
    }
    async findEvents(q?: string | any, page?: number | any): Promise<Event[] | any> {
        const regex = new RegExp(q, "i")
        const itemPage = 10
        const count = (await EventModel.find({title : {$regex: regex }})).length
        const result = await EventModel.find({title : {$regex: regex }}).limit(itemPage).skip(itemPage * (page-1)).exec()         
        return {users : result.map((event) => event.toObject()), count}
    }
    async updateEvent(event: Event, eventId: string): Promise<Event | undefined> {
        const result  = await EventModel.findByIdAndUpdate(eventId, event)
        return result ? result.toObject() : undefined
    }
    async delete(id: string): Promise<"Deletado"> {
        await EventModel.findByIdAndDelete(id)
        return "Deletado" 
    }
    async findUserEvents(q?: string | any, page?: number | any, id?: string): Promise<Event[] | any> {
        const regex = new RegExp(q, "i")
        const itemPage = 10
        const result = await EventModel.find({participants: id,title : {$regex: regex }}).limit(itemPage).skip(itemPage * (page-1)).exec()
        const count = (await EventModel.find({participants: id,title : {$regex: regex }})).length
        return {events: result.map((event) => event.toObject()), count}
    }
    async deleteUser(userId: string, eventId: string): Promise<any> {
        const result = await EventModel.findByIdAndUpdate(eventId, {
            $pull: { participants: userId }
        });
        return result;
    }
    async export (data: IExport): Promise<Event[] | undefined> {
        const result =  await EventModel.find({date: {
            $gte: new Date(data.startDate),
            $lte: new Date(data.endDate)
        }}).exec()
        return result.map((users) => users.toObject())
    }
}