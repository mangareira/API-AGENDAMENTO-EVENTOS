import axios from "axios";
import { Event } from "../entities/Events";
import { HttpException } from "../interface/HttpException";
import { EventRepository } from "../repositories/Event/EventRepository";
import { UserRepositoryMongoose } from "../repositories/User/UserRepositoryMongoose";
import { IFIlter } from "../interface/IFilter";

export class EventUseCase {
    constructor(private eventRepository: EventRepository) {}

    async create(eventData: Event) {
        
        if (!eventData.banner) {
            throw new HttpException(400, 'Banner is required');
          }
        if (!eventData.flyers) throw new HttpException(400, 'Flyers is required');
        if (!eventData.date) throw new HttpException(400, 'Date is required');

        const verifyEvent = await this.eventRepository.findByLocationAndDate(eventData.location, eventData.date)

        if (verifyEvent) throw new HttpException(400, 'Event already exists');
        
        const cityName = await this.getCityNameCoordinates(eventData.location.latitude, eventData.location.longitude)
        eventData = {
            ...eventData,
            city: cityName.cityName,
            formattedAddress: cityName.formattedAddress
        }
        const result = await this.eventRepository.add(eventData)
        return result
    }

    async findEventByLocation(latitude: string, longitude: string) {
        const cityName = await this.getCityNameCoordinates(latitude, longitude)
        
        const findEventsByCity = await this.eventRepository.findEventsByCity(cityName.cityName)

        const eventWithRadius = findEventsByCity.filter(event => {
            const distance = this.calculteDistance(
                Number(latitude),
                Number(longitude),
                Number(event.location.latitude),
                Number(event.location.longitude)
            )
            return distance <= 3
        })
        return eventWithRadius
    }

    async findEventByCategory(category: string) {
        if(!category) {
            throw new HttpException(400, 'Category is required')
        }
        const events = await this.eventRepository.findEventsByCategory(category)
        return events
    }

    async findEventByName(name: string) {
        if(!name) {
            throw new HttpException(400, 'Name is required')
        }
        const events = await this.eventRepository.findEventsByName(name)
        
        return events
    }

    async findEventById(id: string) {
        if(!id) {
            throw new HttpException(400, 'Id is required')
        }
        const events = await this.eventRepository.findEventsById(id)
        
        return events
    }

    async addParticipant(id: string, name: string, email: string) {
        const event = await this.eventRepository.findEventsById(id)

        if(!event) {
            throw  new HttpException(400, 'Event not found')
        }

        const userRepository = new UserRepositoryMongoose()

        const participant = {name, email}

        let user:any = {}

        const verifyIsUserExists = await userRepository.veridyIsUserExists(email)
        if (!verifyIsUserExists) {
            user = await userRepository.add(participant)
            console.log(user);
        } else {
            user = verifyIsUserExists
        }
        if(event.participants.includes(user._id)) {
            throw  new HttpException(400, 'User already exists')
        }
        
        event.participants.push(user._id)

        const updateEvent = await this.eventRepository.update(event, id)
        
        return event
    }
    async findEventsMain() {
        const events = await this.eventRepository.findEventsMain(new Date());
    
        return events;
    }

    async filterEvents(data: IFIlter) {
        const events = await this.eventRepository.findEventsByFilter(data)
    }


    private async getCityNameCoordinates(latitude: string, longitude: string) {

        

        try {
            const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyDoAYR3fYzgI5bOuGldIG4c2hMni5dNBTk`)
            
            if(response.data.status === 'OK' && response.data.results.length > 0) {
                const address = response.data.results[0].address_components
                const cityType = address.find(
                    (type: any)=> 
                        type.types.includes('administrative_area_level_2') && 
                        type.types.includes('political')
                )
                const formattedAddress = response.data.results[0].formatted_address
                return {
                    cityName: cityType.long_name,
                    formattedAddress,
                }
            }
            throw new HttpException(404, 'City not found')
        } catch (error) {
            throw new HttpException(401, 'Error request city name')
        }
        
    }
    private calculteDistance( lat1: number, lon1: number, lat2: number, lon2: number ): number {
        const R = 6371
        const dLat = this.deg2rad(lat2-lat1)
        const dLon = this.deg2rad(lon2-lon1)
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat/ 2) + 
            Math.cos(this.deg2rad(lat1)) *
            Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const d = R * c
        return d
    }
    private deg2rad(deg: number) {
        return deg * (Math.PI / 180)
    }
}