import { NextFunction, Request, Response } from "express";
import { EventUseCase } from "../useCases/Event.usecase";
import { Event } from "../entities/Events";

export class EventController {
    constructor(private eventUseCase: EventUseCase) {}
    async create(req: Request, res: Response, next: NextFunction) {
        let eventData: Event = req.body
        const files = req.files as any        
        if (files) {
            const banner = files.banner[0];
            const flyers = files.flyers;
      
            eventData = {
              ...eventData,
              banner: banner.filename,
              flyers: flyers.map((flyer: any) => flyer.filename),
            };
        }
        try {
            await this.eventUseCase.create(eventData)
            return res.status(201).json({message: 'Evento criado com sucesso.'})
        } catch (error) {
            next(error)
        }
    }
    async findEventByLocation(req: Request, res: Response, next: NextFunction) {
        const {latitude, longitude} = req.query

        try {
            const events = await this.eventUseCase.findEventByLocation(
                String(latitude),
                String(longitude),
            )
            console.log(events);
            
            return res.status(200).json(events)
        } catch (error) {
            next(error)
        }
    }
    async findEventsByCategory(req: Request, res: Response, next: NextFunction) {
        const {category} = req.params

        try {
            const events = await this.eventUseCase.findEventByCategory(
                String(category),
            )            
            return res.status(200).json(events)
        } catch (error) {
            next(error)
        }
    }
    
}