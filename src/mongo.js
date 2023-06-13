import mongoose from "mongoose";
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt  from "bcrypt"
import dotenv from "dotenv"
import { fa, faker } from "@faker-js/faker"

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
    profilePicture: String,
    isAdmin: {type: Boolean, default: false},
    verified: {type: Boolean, default: false},
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }]
})

export const User = mongoose.model("User", UserSchema)
export const Video = mongoose.model("Video", VideoSchema)
export const Comment = mongoose.model("Comment", CommentSchema)

// const colorPalettes = [
//     ['F4D166', 'F7A072', 'E76F51', '6B705C', '264653'],
//     ['FF00FF', 'FF0000', 'FFFF00', '00FF00', '00FFFF'],
//     ['C0C0C0', '808080', '000000', 'FFFFFF', 'FFD700'],
//     ['F72585', 'B5179E', '7209B7', '560BAD', '480CA8'],
//     ['FEC5BB', 'FCD5CE', 'FAE1DD', 'F8EDEB', 'E8E8E4'],
//     ['F94144', 'F3722C', 'F8961E', 'F9C74F', '90BE6D'],
//     ['0A0908', '12100E', '1E201C', '2B2C28', '323934'],
//     ['A9BCD0', '58A4B0', '373F51', 'DDBC95', 'B07A46'],
//     ['FF0099', 'FF66CC', 'FF99FF', 'CC99FF', '9966FF'],
//     ['22223B', '4A4E69', '9A8C98', 'C9ADA7', 'F2E9E4']
// ];

// for (let index = 0; index < 10; index++) {
//     const firstName = faker.person.firstName()
//     const lastName = faker.person.lastName()
//     const fakeUsername = faker.internet.userName({firstName: firstName, lastName: lastName})

//     bcrypt.hash(fakeUsername, 10, async (error, hashedPasswd) => {
//         if (error) {
//             console.log(error)
//         } else {
//             const randomColorPalette = colorPalettes[Math.floor(Math.random() * 10)]
            
//             await User.create({
//                 email: faker.internet.exampleEmail({firstName: firstName, lastName: lastName}),
//                 username: fakeUsername,
//                 profilePicture: `https://source.boringavatars.com/beam/500/${firstName}%20${lastName}?colors=${randomColorPalette[0]},${randomColorPalette[1]},${randomColorPalette[2]},${randomColorPalette[3]},${randomColorPalette[4]}`,
//                 password: hashedPasswd,
//                 isAdmin: false,
//                 verified: true
//             })
//         }
//     })
// }