import  express, { Application }  from "express"
import { connect } from "./infra/database/database"
import { errorMiddleware } from "./middleware/error.middleware"
import { EventRoutes } from "./routes/eventos.routes"
import cors from 'cors'
import path from 'path'

export class App{
    public app: Application
    private eventRoutes = new EventRoutes()
    constructor() {
        this.app = express()
        this.middlewareInitializer()
        this.initializeRoutes()
        this.interceptionErros()
        connect()
    }
    private initializeRoutes() {
        this.app.use('/events', this.eventRoutes.router)
    }
    private interceptionErros() {
        this.app.use(errorMiddleware)
    }
    private middlewareInitializer() {
        this.app.use(express.json())
        this.app.use(cors({
            origin: "https://eventos.unicentroma.edu.br",
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true
        }));
        
        this.app.options('*', (req, res) => {
            res.header("Access-Control-Allow-Origin", "https://eventos.unicentroma.edu.br");
            res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.header("Access-Control-Allow-Credentials", "true");
            res.sendStatus(204);
        });
        this.app.use('/uploads', express.static(path.join(__dirname, './infra/upload/tmp/uploads')))
        this.app.use(express.urlencoded({extended: true}))
    }
    listen() {
        this.app.listen(3333, ()=> console.log('server is running'))
    }
}