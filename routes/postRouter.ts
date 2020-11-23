import { Request, Response } from "express"
import Post from "../models/Post"
import { IPost } from "../interfaces/models"
import config from 'config'
import jwt from 'jsonwebtoken'
import User from "../models/User"
import File from "../models/File"
import { mongo } from "mongoose"
const { check, validationResult } = require('express-validator')

const { Router } = require('express')
const router = Router()

router.get('/', async (req: Request, res: Response) => {
    try {
        // const token = req.headers.authorization?.split(' ')[1]
        // if (token) {
        //   const decoded = jwt.verify(token, config.get('jwtSecret'))
        owner:// decoded.valueOf().id }
        const posts = await Post.find({ status: 'created' })
            .populate('img', 'path')
            .populate('files', 'path')
            .populate('owner', 'name')
        return res.status(200).json({ success: true, posts })

        // }
        // else {
        //     return res.status(401).json({ success: false, message: 'Ошибка, связанная с получением токена пользователя - нет авторизации' })
        // }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Нет авторизации', error })
    }

})

router.post('/create', async (req: Request, res: Response) => {

    try {
        const token = req.headers.authorization?.split(' ')[1]
        if (token) {
            const decoded: any = jwt.verify(token, config.get('jwtSecret'))
            const userId = decoded.valueOf().id

            const draftPost = await Post.findOne({ status: 'draft' })
                .populate('img', 'path')
                .populate('files', 'path')

            if (draftPost)
                return res.status(201).json({ success: true, message: "Редактирование поста", draftPost })

            const newPost: IPost | undefined = new Post({ owner: userId })

            await newPost.save()
            return res.status(201).json({ success: true, message: "Создан  пост", newPost })
        }
        else {
            return res.status(401).json({ success: false, message: 'Ошибка, связанная с получением токена пользователя - нет авторизации' })
        }

    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "Ошибка при создании поста", error })

    }
})



router.post('/edit',
    [
        check('title').not().isEmpty(),
        check('body').not().isEmpty(),
        // check('file').not().isEmpty(),
        // check('files').not().isEmpty(),
    ], async (req: Request, res: Response) => {

        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(), // приводит к массиву,
                mes: 'Некорректные данные'
            })
        }
        const postId = req.body._id
        const body = req.body.body
        const title = req.body.title
        const type = req.body.type
        const inMainPage = req.body.inMainPage
        const token = req.headers.authorization?.split(' ')[1]
        if (token) {
            const decoded: any = jwt.verify(token, config.get('jwtSecret'))
            const userId = decoded.valueOf().id

            try {
                const post = await Post.findOneAndUpdate({
                    _id: postId,
                    owner: userId
                },
                    {
                        title,
                        body,
                        status: req.body.status,
                        type,
                        inMainPage
                    },
                    {
                        new: true
                    }
                )
                    .populate('owner', 'name')
                    .populate('img', 'path')
                    .populate('files', 'path')
                // .exec((err, files) => {
                //     console.log("Populated files " + files);
                // })

                if (post) {
                    const user = await User.findById(userId)
                    if (user) {
                        const userPosts = user?.posts
                        userPosts?.unshift(post._id)
                        user.posts = userPosts
                        await user?.save()
                    }
                    return res.status(201).json({ success: true, message: "Пост обнавлен", post })
                }
                else {
                    return res.status(401).json({ success: false, message: 'Ошибка при редактировании поста' })
                }
            }

            catch (error) {
                console.log(error)
                return res.status(500).json({ success: false, message: "Ошибка при редактировании поста", error })
            }

        }

    })

router.delete('/delete/:id', async (req: Request, res: Response) => {
    try {
        const ObjectId = mongo.ObjectId
        const postId = req.params.id
        await Post.findOneAndDelete(
            {
                _id: postId
               // _id: new ObjectId(postId)
            },
            async (error, deletePost) => {
                if (error) {
                    res.status(500).json({ success: false, mes: 'Ошибка', error })
                }
                if (deletePost) {

                    await File.findByIdAndUpdate({ _id: deletePost.img, }, { post: null })
                    await File.updateMany({ post: deletePost._id }, { post: null })
                    await User.findById(new ObjectId(deletePost.owner))
                        .then(async ownerOfPost => {
                            if (ownerOfPost) {
                                const posts0 = ownerOfPost.posts.filter((post: any) => {
                                    //console.log(post, deletePost._id);
                                    return (post != deletePost._id)
                                })

                                console.log("posts0", posts0);


                                let posts = ownerOfPost.posts;
                                //posts.remove(deletePost._id); // !!!!!!!!!!!!!!!!!!!!!!!!!!!!
                                posts.filter(item => item !== deletePost._id)
                                ownerOfPost.posts = posts;
                                console.log(ownerOfPost.posts);

                                await ownerOfPost.save()
                            }
                            else {
                                console.log("no");

                            }

                        })
                        .catch(err => console.log('err', err)
                        )
                    // if (ownerOfPost) {

                    //     const posts = ownerOfPost.posts.filter((post: any) =>{
                    //        console.log(post, deletePost._id);
                    //    return(post !== deletePost._id)})

                    //    const d = ownerOfPost.posts.find(post => {
                    //     console.log(post, deletePost._id);
                    //        return(post === deletePost._id)
                    //    })
                    //    let posts = ownerOfPost.posts;
                    //    posts.remove(ownerOfPost._id);
                    //    ownerOfPost.posts = posts;
                    //    console.log(ownerOfPost.posts);

                    // await ownerOfPost.save()
                    // console.log(posts);

                    // await ownerOfPost.save()

                    //}


                }
            }
        )
        res.status(200).json({ success: true, mes: 'удаление записи' })
    }
    catch (error) {
        res.status(500).json({ success: false, mes: 'Ошибка', error })
    }

})

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('img', 'path')
            .populate('owner', 'name')
        res.status(200).json({ success: true, mes: 'получены данных о записи', post })
    } catch (error) {
        res.status(500).json({ success: false, mes: 'Ошибка', error })
    }
})

router.get('/edit/:id', async (req: Request, res: Response) => {
    try {
        const post = await Post.findOneAndUpdate(
            { _id: req.params.id },
            { status: 'draft' },
            { new: true }
        )
            .populate('img', 'path')
            .populate('owner', 'name')
            .populate('files', 'path')
        res.json({ success: true, mes: 'Редактирование записи', post })
    } catch (error) {
        res.status(500).json({ success: false, mes: 'Ошибка', error })
    }
})

module.exports = router






