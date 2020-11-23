import config from 'config'
import jwt from 'jsonwebtoken'
import { Request, Response } from 'express'
import File from "../models/File"
import { IFile } from '../interfaces/models'
import Post from '../models/Post'
import User from '../models/User'
const { Router } = require('express')
const multer = require("multer")
const path = require('path')
const router = Router()

var storage = multer.diskStorage({
    destination: function (req: any, file: any, cb: any) {
        cb(null, './server/uploads') // '' ./client/src/img
    },
    filename: function (req: any, file: any, cb: any) {
        const fileName = file.originalname.toLowerCase().split(' ').join('-');
        cb(null, fileName)
    }
})

var uploadFile = multer({ storage }).single('file')


router.post('/upload', (req: any, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (token) {
        const decoded: any = jwt.verify(token, config.get('jwtSecret'))
        const ownerId = decoded.valueOf().id
        uploadFile(req, res, async (err: any) => {
            const postId = req.body.postId
            const typeUpload = req.body.typeUpload
            if (err instanceof multer.MulterError) {
                return res.status(500).json(err)
            } else if (err) {
                return res.status(500).json(err)
            }
            const path = req.protocol + '://' + req.get('host') + '/uploads/' + req.file.filename
            const file: IFile = new File({
                path,
                owner: ownerId,
                post: postId
            })
            file.save()
                .then(async (result) => {
                    if (typeUpload === 'post') {
                        await Post.findByIdAndUpdate(
                            { _id: postId, ownerId },
                            { img: result.id }
                        )
                    }
                    const owner = await User.findById(ownerId)
                    if (owner) {
                        const ownerFiles = owner?.files
                        ownerFiles?.unshift(result.id)
                        owner.files = ownerFiles
                        if (typeUpload === 'avatar') {
                            owner.avatar = result.id
                        }
                        await owner?.save()
                    }

                    res.status(201).json({
                        message: "Done upload!",
                        result,
                        // file: req.file,
                        path
                    })
                })
                .catch(err => {
                    console.log(err)
                    res.status(500).json(err)
                })



            //return res.status(200).send({file: req.file, path})

        })

    }

})


// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, DIR);
//     },
//     filename: (req, file, cb) => {
//         const fileName = file.originalname.toLowerCase().split(' ').join('-');
//         cb(null, uuidv4() + '-' + fileName)
//     }
// });

var uploadFiles = multer({
    storage: storage,
    fileFilter: (req: any, file: any, cb: any) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
    }
}).array('imgCollection', 10)



router.post('/upload-files', async (req: any, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (token) {
        const decoded: any = jwt.verify(token, config.get('jwtSecret'))
        const ownerId = decoded.valueOf().id

        uploadFiles(req, res, async (err: any) => {
            const reqFiles = [];
            const postId = req.body.postId
            const url = req.protocol + '://' + req.get('host')
            for (var i = 0; i < req.files.length; i++) {
                reqFiles.push({
                    path: url + '/uploads/' + req.files[i].filename,
                    owner: ownerId,
                    post: postId
                })
            }

            let files: any = []

            await File.insertMany(reqFiles)
                .then(async (res) => {
                    let filesId: Array<string> = []
                    for (const key of Object.keys(res)) {
                        filesId.push(res[+key]._id)
                        files.push({
                            _id: res[+key]._id,
                            path: res[+key].path
                        })
                    }
                    
                    const post = await Post.findById(postId)
                    if (post) {
                        const postFiles = [...post?.files, ...filesId]
                        post.files = postFiles
                        await post?.save()
                    }
                    const owner = await User.findById(ownerId)
                    if (owner) {
                        const ownerFiles = [...owner?.files, ...filesId]
                        //ownerFiles?.unshift(result.id)
                        owner.files = ownerFiles
                        await owner?.save()
                    }
                })

            res.status(201).json({
                message: "Done upload!",
                files
            })
        })

    }
})


router.delete('/delete/:type/:id', async (req: Request, res: Response) => {
    const fileId = req.params.id
    const type = req.params.type
    await File.findOneAndDelete(
        {
            _id: fileId
        },
        async (error, deleteFile) => {
            if (error) {
                res.status(204).json({ success: false, mes: 'Ошибка удаления', error })
            }
            if (deleteFile) {
                try {
                    switch (type) {
                        case 'imgPost':
                            await Post.findByIdAndUpdate({ _id: deleteFile.post, }, { img: null })
                            break;
                        case 'galleryPost':
                            const post = await Post.findById(deleteFile.post)
                            if (post) {
                                const files = [...post.files]
                                const afterDeleteFiles = files.filter((file: any) =>
                                    file.toJSON() !== deleteFile._id.toJSON()
                                )
                                post.files = [...afterDeleteFiles] 
                                post.save()
                            }
                            break;
                        default:
                            break;
                    }

                    const owner = await User.findById(deleteFile.owner)
                    if (owner) {
                        const files = [...owner.files]
                        const afterDeleteFiles = files.filter((file: any) =>
                            file.toJSON() !== deleteFile._id.toJSON()
                        )
                        owner.files = [...afterDeleteFiles]  // .???
                        owner.save()
                    }

                    res.status(200).json({
                        message: "Done delete!",
                    })
                } catch (error) {
                    res.status(204).json({ success: false, mes: 'Ошибка удаления', error })
                }
            }
            //     await File.findByIdAndUpdate({ _id: deletePost.img, }, { post: null })
            //     await File.updateMany({ post: deletePost._id }, { post: null })


            //     await User.findById(new ObjectId(deletePost.owner))
            //         .then(async ownerOfPost => {
            //             if (ownerOfPost) {
            //                 const posts0 = ownerOfPost.posts.filter((post: any) => {
            //                     //console.log(post, deletePost._id);
            //                     return (post != deletePost._id)
            //                 })

            //                 console.log("posts0", posts0);


            //                 let posts = ownerOfPost.posts;
            //                 posts.remove(deletePost._id);
            //                 ownerOfPost.posts = posts;
            //                 console.log(ownerOfPost.posts);

            //                 await ownerOfPost.save()
            //             }
            //             else {
            //                 console.log("no");

            //             }

            //         })
            //         .catch(err => console.log('err', err)
            //         )

            // }



        }
    )
})

module.exports = router