// const {Schema, model, Types, Document } = require('mongoose')
import { Schema, model, Types } from 'mongoose';
import { IPost } from '../interfaces/models';

const PostSchema: Schema = new Schema({
    title: {type: String, default: ''},
    body: {type: String, default: ''},
    status: {type: String, required: true, enum: ['created', 'draft'], default: 'draft'},
    owner: {type: Types.ObjectId, ref: 'User', required: true},
    files: [{type: Types.ObjectId, ref: 'File'}],
    img: {type: Types.ObjectId, ref: 'File', default: null},
    type: {type: String, required: true, enum: ['project', 'review'], default: 'project'},
    inMainPage: {type: Boolean, default: false},
    date: {type: Date, default: Date.now, required: true}
})

export default model<IPost>('Post', PostSchema)