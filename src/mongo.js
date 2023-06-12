import mongoose from "mongoose";
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from "dotenv"

dotenv.config()

mongoose.connect(process.env.DB, {
    dbName: process.env.DB_NAME
})

mongoose.connection.on("error", (e) => {
    console.log("Error", e.toString());
});
  
mongoose.connection.on("connected", () => {
    console.log("Connection established");
});

// const mongoServer = new MongoMemoryServer();

// async function connectInMemoryDB() {
//     await mongoServer.start()

//     const uri = mongoServer.getUri();

//     await mongoose.connect(uri, {
//         dbName: process.env.DB_NAME,
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//     });

//     mongoose.connection.on('error', (e) => {
//         console.log('Error', e.toString());
//     });

//     mongoose.connection.on('connected', () => {
//         console.log('Connection established');
//     });
// }

// connectInMemoryDB();

const CommentSchema = new mongoose.Schema({
    id_video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    username: String,
    date: {type: Date, default: new Date()},
    contenu: String
});

const VideoSchema = new mongoose.Schema({
    title: String,
    description: String,
    file_name: String,
    username: String,
    hidden: {type: Boolean, default: false},
    blocked: {type: Boolean, default: false},
    nombre_vue: {type: Number, default: 0},
    date_ajout: {type: Date, default: new Date()},
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});

const UserSchema = new mongoose.Schema({
    email: String,
    username: String,
    password: String,
    isAdmin: {type: Boolean, default: false},
    verified: {type: Boolean, default: false},
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }]
})

export const User = mongoose.model("User", UserSchema)
export const Video = mongoose.model("Video", VideoSchema)
export const Comment = mongoose.model("Comment", CommentSchema)