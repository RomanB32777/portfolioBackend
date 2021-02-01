import {Document } from 'mongoose';

export interface IPost extends  Document {
    _id: string,
    title: string,
    body: string,
    owner: number,
    date: Date,
    img: string | null,
    files: Array<string> | Array<IFile> | (string | IFile)[],
    type: string,
    onMainPage: boolean
}

export interface IUser extends Document {
    email: string,
    password: string,
    posts: string[],//. ?
    name?: string,
    avatar?: string,
    files: Array<string> | Array<IFile> | (string | IFile)[] 
}

export interface IFile extends Document {
    path: string,
    owner?: string,
    post?: string | null
}