import { Schema, model, Types} from 'mongoose';
import { IUser } from '../interfaces/models';


const UserSchema: Schema = new Schema({
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    name: {type: String, default: ''},
    isAuthenticated: {type: Boolean, default: false},
    status: {type: String, required: true, enum: ['admin', 'guest'], default: 'guest'},
    posts: [{ type: Types.ObjectId, ref: 'Post'}],
    files: [{ type: Types.ObjectId, ref: 'File' }],
    avatar: { type: Types.ObjectId, ref: 'File', default: null }
})

export default model<IUser>('User', UserSchema)