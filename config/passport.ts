import User from '../models/User'
import { PassportStatic } from 'passport';
import config from 'config'
import bcrypt from 'bcryptjs'


module.exports = function (passport: PassportStatic) {
    var JwtStrategy = require('passport-jwt').Strategy,
        ExtractJwt = require('passport-jwt').ExtractJwt,
        LocalStrategy = require('passport-local').Strategy
    var opts = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: config.get('jwtSecret'),
    }

    // const userDB = {
    //     id: 136345,
    //     email: 'test@mail.ru',
    //     password: '123',
    //   };

    //   passport.serializeUser(function(user, done) {
    //     console.log('Сериализация: ', user);
    //     done(null, user.id);
    //   });

    //   passport.deserializeUser(function(id, done) {
    //     console.log('Десериализация: ', id);
    //     const user = userDB.id === id ? userDB : false;
    //     done(null, user);
    //   });

    //   passport.use(
    //     new LocalStrategy({ usernameField: 'email' }, function(
    //         email: string, password: string, done: any
    //     ) {
    //       if (email === userDB.email && password === userDB.password) {
    //         return done(null, userDB);
    //       } else {
    //         return done(null, false);
    //       }
    //     })
    //   );

    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, async (email: string, password: string, done: any) => {
        await User.findOne({ email }).populate('posts').populate('avatar', 'path')
            .then(async (user:any) => {
                if (!user) {
                    return done(null, false, { errors: { 'email or password': 'is invalid' } });
                }
                const isMatch: boolean = await bcrypt.compare(password, user.password)
                if (!isMatch) {
                    return done(null, false, { errors: { 'email or password': 'is invalid' } });
                }
                return done(null, user);
            }).catch(done);
    }));


    passport.use(new JwtStrategy(opts, (jwt_payload: any, done: any) => { // done вызывается, когда функция уже обработана         
        User.findOne({ _id: jwt_payload.id }, (err: Error, user: any) => {
            if (err) {
                return done(err, false);
            }
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
                // or you could create a new account
            }

        })
            .populate('posts')
            .populate('avatar', 'path')

    }));
}