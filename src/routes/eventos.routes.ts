import { Router } from "express";
import { EventRepositoryMongoose } from "../repositories/Event/EventRepositoryMongoose";
import { EventController } from "../controllers/Event.controller";
import { EventUseCase } from "../useCases/Event.usecase";
import { upload } from "../infra/upload/multer";

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
        this.router.post('/',upload.fields([{
                    name: 'banner',
                    maxCount: 1
                },
                {
                    name: 'flyers',
                    maxCount: 3
                },
            ]), this.eventController.create.bind(this.eventController)
        )
        this.router.get('/', this.eventController.findEventByLocation.bind(this.eventController))
        this.router.get('/name', this.eventController.findEventsByName.bind(this.eventController))
        this.router.get('/:id', this.eventController.findEventsById.bind(this.eventController))
        this.router.get('/category/:category', this.eventController.findEventsByCategory.bind(this.eventController))
        this.router.post('/:id/participants', this.eventController.addParticipant.bind(this.eventController))
    }
}