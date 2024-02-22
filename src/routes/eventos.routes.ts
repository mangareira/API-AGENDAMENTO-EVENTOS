import { Router } from "express";
import { EventRepositoryMongoose } from "../repositories/Event/EventRepositoryMongoose";
import { EventController } from "../controllers/Event.controller";
import { EventUseCase } from "../useCases/Event.usecase";

export class EventRoutes {
    public router: Router
    private eventController: EventController
    constructor() {
        this.router = Router()
        const eventRepository = new EventRepositoryMongoose()
        const eventUseCase = new EventUseCase(eventRepository)
        this.eventController = new EventController(eventUseCase)
        this.initRoutes()
    }
    initRoutes() {
        this.router.post('/', this.eventController.create.bind(this.eventController))
    }
}