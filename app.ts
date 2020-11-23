import express, { Application, Request, Response, NextFunction } from "express"
import mongoose from 'mongoose'
import cors from 'cors'
import path from 'path'
import passport from 'passport'
const app: Application = express()
import { IConfigApp } from './interfaces/configs'

export default class App {
    private app: Application
    private configClass: IConfigApp

    constructor(IConfig: IConfigApp) {
        this.configClass = IConfig;
        this.app = express()
    }


    async run(): Promise<any> {
        // console.log( this.configClass);

        // this.app.use(bodyParser.urlencoded({ extended: false }));
        // this.app.use(bodyParser.json())
        // app.use(express.json({
        //     extended: true
        // }))

        app.use(express.json())
        app.use(express.urlencoded({ extended: false }));

        app.use(function (req, res, next) {
            res.header("Access-Control-Allow-Origin", req.headers.origin);
            res.header('Access-Control-Allow-Credentials', 'true');
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

            // response.setHeader("Access-Control-Allow-Origin", "*");
            // response.setHeader("Access-Control-Allow-Credentials", "true");
            // response.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
            // response.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
            next();
        });



        app.use(cors())
        //app.use(fileUpload());
        this.app.use(passport.initialize())
        this.app.use(passport.session())

        require('./config/passport')(passport)



        // .??
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            res.contentType('application/json');
            next();
        });


        app.use(express.static(path.join(__dirname, 'public')))
        app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
        app.use('/api/auth', require('./routes/authRouter'))
        app.use('/api/post', require('./routes/postRouter'))
        app.use('/api/mail', require('./routes/mailerRouter'))
        app.use('/api/file', require('./routes/fileRouter'))
      
        try {

            // await mongoose.connect(this.configClass.mongoUri,  {
            //     useCreateIndex: true,
            //     useNewUrlParser: true,
            //     useUnifiedTopology: true,
            //     // , (err) => { console.log("work", err); throw err; }
            // })
            //     .then(() => { console.log("work"); })
            //     .catch((err) => { throw err })


            await mongoose.connect("mongodb://localhost/portfolio", {
                useCreateIndex: true,
                useNewUrlParser: true,
                useUnifiedTopology: true,
               useFindAndModify: false 
                //useNewUrlParser: true, useUnifiedTopology:true
            }, (err) => {
                console.log("work", err);
            })

            // const MongoClient = require('mongodb').MongoClient;
            // const uri = "mongodb+srv://roman1:LfYMMHeGiDNALmsr@cluster0-l3hjb.azure.mongodb.net/test?retryWrites=true&w=majority";
            // const client =  new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
            // await client.connect(() => {
            //   const collection = client.db("test").collection("devices");
            //   // perform actions on the collection object
            //   console.log("rrr");

            //   client.close();
            // });

            app.listen(this.configClass.port, () => {
                console.log(`Сервер запущен на пoртe ${this.configClass.port}`);
            })


        } catch (error) {
            console.log("Ошибка, связанная с базой данных", error);
            throw error
        }
    }
}


// const mongoose = require('mongoose')
// const config = require('config')
// const cors = require('cors')
// const bodyParser = require('body-parser')
// app.use(cors())

// app.use(express.json({
//     extended: true
// }))

// app.get('/', (req: Request, res: Response) => {
//     res.send('fdf')
// })

// app.use('/api/auth', require('./routes/authRouter'))
// app.use('/api/post', require('./routes/postRouter'))


// async function start() {

//     try {
//         await mongoose.connect(config.get('mongoUri'), {
//             useCreateIndex: true,
//             useNewUrlParser: true,
//             useUnifiedTopology: true
//         }, () => {
//             console.log("Mongo DB connected!!");
//         })

//         app.listen(PORT, () => {
//             console.log(`Сервер запущен на портe ${PORT}`);

//         })

//     } catch (error) {
//         console.log("Ошибка, связанная с базой данных", error);
//         process.exit(1)
//     }

// }

//start()

