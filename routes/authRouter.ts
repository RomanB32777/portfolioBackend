import { Request, Response, NextFunction } from "express";
import passport from 'passport'
import config from 'config'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from "../models/User"
import { IUser } from "../interfaces/models"
import Post from "../models/Post";
const { check, validationResult } = require('express-validator')

// import redis = require('redis');
// const JWTR =  require('jwt-redis').default;
// //ES6 import JWTR from 'jwt-redis'
// const redisClient = redis.createClient();
// const jwtr = new JWTR(redisClient);

const { Router } = require('express')
const router = Router()

router.post('/register',
    [
        check('email', 'Некорректная почта').isEmail(),
        check('password', 'Некорректный пароль - мин 6 символов').isLength({ min: 6 }),
    ],
    async (req: Request, res: Response) => {
        try {
            //const { body: { user } } = req;
            //console.log("Body:", req.body);

            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(), // приводит к массиву,
                    mes: 'Некорректные данные'
                })
            } // если есть ошибка



            //{ email, password } = req.body
            const email: string = req.body.email
            const password: string = req.body.password

            const can = await User.findOne({ email })

            if (can) {

                return res.status(401).json({ success: false, messsage: 'такой уже есть' })
            }


            bcrypt.genSalt(10, async (err: Error, salt: string) => {
                await bcrypt.hash(password, salt, async (err, hash) => {
                    if (err) throw err;
                    const user: IUser = new User({
                        email,
                        password: hash,
                    })
                    await user.save()
                    return res.status(201).json({ success: true, mes: 'Пользователь создан' })
                })
            }) // 10 - количество символов в хешированном пароле


        } catch (error) {
            return res.status(500).json({ success: false, mes: 'Ошибка' })
        }

    })

router.post('/login', [
    check('email', 'Некорректная почта').isEmail(),
    check('password', 'Некорректный пароль - мин 6 символов').isLength({ min: 6 }),
], async (req: Request, res: Response, next: NextFunction) => {
    // try {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array(),
            mes: 'Некорректные данные'
        })
    }
    // const email: string = req.body.email
    // const password: string = req.body.password

    // const user: IUser | null = await User.findOne({ email })
    // console.log("Body user:", user);
    // if (!user) {
    //     return res.status(400).json({ success: false, message: 'Пользователь не найден' })
    // }

    // const isMatch: boolean = await bcrypt.compare(password, user.password)

    // // await bcrypt.compare(password, user.password, (err: Error, isMatch: boolean) => {
    // //     if (err) throw err
    // //     callback(null, isMatch)
    // // })
    // if (isMatch) {
    passport.authenticate('local', { session: false }, function (err, user) {

        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ success: false, mes: 'Пользователь не найден. Укажите правильный email или пароль!' });
        }

        req.login(user, { session: false }, (err) => {
            if (err) {
                return res.status(401).json({ success: false, err });
            }
            const token = jwt.sign({ id: user._id }, config.get('jwtSecret'), {
                expiresIn: '1d'
            })
            user.isAuthenticated = true
            user.save()
            return res.status(200).json({
                success: true,
                mes: 'Добро пожаловать',
                user: {
                    id: user._id,
                    token,
                    status: user.status,
                    name: user.name,
                    email: user.email,
                    isAuthenticated: user.isAuthenticated, 
                    posts: user.status === 'admin' && user.posts,
                    avatar: user.avatar
                }
            })
        })
    })(req, res, next);
    // }
    // else {
    //     return res.status(400).json({ success:false, message: 'Неверный пароль' })
    // }

    // catch (error) {
    //     // console.log('error', error);
    //     // throw error
    //     return res.status(500).json({ message: 'Ошибка', error })
    // }
})

// function mustAuthenticated(req: Request, res: Response, next: NextFunction) {
//     if (!req.isAuthenticated()) {
//       console.log("WWWWWWWW");
//       return res.status(200).send({});
//     }
//     next();
//   }

router.get('/logout', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (token) {
        const decoded: any = jwt.verify(token, config.get('jwtSecret'))
        await User.findByIdAndUpdate(decoded.id, { isAuthenticated: false })
        req.logOut();
        res.json({ success: true, mes: 'Вы вышли из аккаунта' })
    }
})

router.get('/dashboard', (req: Request, res: Response, next: NextFunction) => { // запретили доступ к страницедля пользователя до тех пор, пока сессия будет равна false

    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err)
            return next(err);
        if (!user && info)
            return res.json(info);     
        res.json({success: true, user: 
            {
                id: user._id,
                status: user.status,
                name: user.name,
                email: user.email,
                isAuthenticated: user.isAuthenticated, 
                posts: user.status === 'admin' && user.posts,
                avatar: user.avatar
            }
        })        
    })(req, res, next)

})


router.get('/admin', (req: Request, res: Response, next: NextFunction) => { // запретили доступ к страницедля пользователя до тех пор, пока сессия будет равна false

    passport.authenticate('jwt', { session: false }, async (err, admin, info) => {
        if (err)
            return next(err);
        if (!admin && info)
            return res.json(info);
        if (admin && admin.status !== 'admin') {
            // const error = new Error('No admin');
            return res.json({ success: false, mes: 'Доступ открыт только для администратора' })
        }

        // const posts = await Post.find().populate('owner')
        const users = await User.find()
   
        res.json({admin, users})
    })(req, res, next)

})


module.exports = router
