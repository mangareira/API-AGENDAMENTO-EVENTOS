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
        } }).exec()
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
        .limit(4)
        .exec();    
        return findEvent.map((event) => event.toObject());
    }
    async findEventsByFilter(data: IFilterProps): Promise<Event[]> {
        const findEvent = await EventModel.find({
            title: {
                $regex: data.name,
                $options: 'i'
            },
            // date: {
            //     $gte: data.date
            // },
            // categories: data.category,
        }).exec()
        console.log(findEvent)
        return findEvent.map((event) => event.toObject())
    }
}