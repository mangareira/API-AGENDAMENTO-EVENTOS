import mongoose from "mongoose"
import { Event } from "../../entities/Events"
import { EventRepository } from "./EventRepository"
import { Location } from "../../entities/Location"
import { IFilterProps } from "../../interface/IFilter"

const eventSchema = new mongoose.Schema({
    title: String,
    location: {
        latitude: String,
        longitude: String,
    },
    date: Date,
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
        type: Array,
        ref: 'User'
    }
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
    async findEventsByCategory(category: string): Promise<Event[]> {
        const findEvent = await EventModel.find({categories: category}).exec()
        return findEvent.map((event) => event.toObject())
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
            $and : [
                {title: data.name ? {
                    $regex: data.name,
                    $options: 'i'
                }: {$exists: true}},
                { date: data.date ? { $gte: new Date(data.date) } : { $exists: true } },
                {categories: data.category ? {
                    $in: [data.category]
                }: {$exists: true}},
                // {'price.amount': {
                //     $gte: data.price ? String(data.price): '0'
                // }},
                {'location.latitude': {
                        $gte: String(data.latitude - data.radius),
                        $lte: String(data.latitude + data.radius)
                    },
                'location.longitude': {
                        $gte: String(data.longitude - data.radius),
                        $lte: String(data.longitude + data.radius)
                    },
                },
            ]
        }
        const findEvent = await EventModel.find(query).exec()        
        return findEvent.map((event) => event.toObject())
    }
    async findEventsByUserId(id: string): Promise<Event[]> {
        const result = await EventModel.find({participants: id}).exec()
        return result.map((event) => event.toObject())
    }
}