const nodemailer = require('nodemailer')
import {  Response, Request } from 'express'
const { Router } = require('express')
const router = Router()

router.post('/',  async (req: Request, res: Response)  => {
    console.log("mail", req.body);
    
    try {
        let transporter = nodemailer.createTransport({
            host: 'smtp.mail.ru',
            port: 465,
            secure: true,
            auth: {
                user: 'webportfolio2020@mail.ru',
                pass: 'R4908738475'
              }
            },
            );

        let result = await transporter.sendMail({
            from: '<webportfolio2020@mail.ru>',
            to: "e228ea@gmail.com",
            subject: "Message from Node js",
            text: `This message was sent from Node js server by ${req.body.name} (email ${req.body.email}). Message: ${req.body.mes}`,
           // html: `This mes was sent from Node js server by ${req.body.name} (email ${req.body.email}). Message: ${req.body.mes}`
          });
          
         res.status(200).json({result})
    } catch (error) {
        console.log(error)
        throw error
    }

})

module.exports = router