import { Schema, Types, model } from 'mongoose';
import { IFile } from '../interfaces/models';


const FileSchema: Schema = new Schema({
    owner: { type: Types.ObjectId, ref: 'User'},
    path: { type: String, required: true },
    post: { type: Types.ObjectId, ref: 'Post'}
})

export default model<IFile>('File', FileSchema)