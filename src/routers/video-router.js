import express from'express';
import dotenv from "dotenv"
import { Comment, User, Video } from '../mongo.js';
import { validateParamId, validateVideo } from '../middlewares/validation-midleware.js';
import { isAdmin, isAdminOrVideoOwner, isRegister } from '../middlewares/auth-middleware.js';
import Busboy from 'busboy';
import {Client} from "basic-ftp"

dotenv.config()

const router = express.Router();

router.get('/', async(request, response) => {
    const search = request.query.search
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 6;

    const query = {
        blocked: false,
        hidden: false
    };

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } }
        ];
    }

    const totalVideos = await Video.countDocuments(query);
    const totalPages = Math.ceil(totalVideos / limit);
    const skip = (page - 1) * limit;

    const videos = await Video.find(query).populate("comments")
    .sort({ date_ajout: -1 })
    .skip(skip)
    .limit(limit);;

    response.status(200).json({
        videos,
        currentPage: page,
        totalPages
    })
})

// LE FICHIER DOIT ETRE ENVOYÉ EN DERNIER DANS LA REQUETE
router.post('/', isRegister, async(request, response) => {
    const busboy = Busboy({ headers: request.headers });

    const user = await User.findOne({ "username": request.username });

    let file_name = ""

    let fileUploaded = false

    busboy.on('field', (fieldname, value) => {
        request.body[fieldname] = value;
    })

    busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
        if (!request.body.title || !request.body.description) {
            response.status(400).send('Title and description are required');
            return;
        }

        if (!filename.mimeType.startsWith("video/")) {
            response.status(400).send('Uploaded file is not a video');
            return;
        }

        const originalFileName = filename.filename;
        const timestamp = Date.now().toString();
        file_name = `${timestamp}_${user.username}_${originalFileName}`;

        console.log(file_name)

        if (await Video.exists({ title: request.body.title, username: user.username })) {
            response.status(400).send('Video with the same title already exists');
            return;
        }

        const client = new Client();

        await client.access({
            host: process.env.FTP_HOST, // Remplacez par l'adresse du serveur FTP distant
            user: 'User',
            port: 21
        });

        // Chemin de destination du fichier sur le serveur FTP distant
        const remotePath = '/DESKTOP-CV36JEK/Users/clopa/Documents/SupInfo/B3/Cours/3PROJ/Infra_Test/TestLocal/' + file_name;

        // Créez un flux de lecture pour le fichier
        const readStream = file;

        fileUploaded = true


        // Téléchargez le fichier sur le serveur FTP distant
        await client.upload(readStream, remotePath);


        client.close();
    });

    busboy.on('error', (error) => {
        console.error('Error uploading video:', error);
        fileUploaded = false
        response.status(500).send('Error uploading video');
        return;
    });

    busboy.on('finish', async () => {
        if (fileUploaded) {
            const video = await Video.create({
                ...request.body,
                username: user.username,
                file_name: file_name
            })
        
            user.videos.push(video.id);
            await user.save();
    
            response.status(201).send(video);
        } else {
            response.status(500).send('You have to select a file');
        }
    });

    request.pipe(busboy); 
})

router.get('/:id', validateParamId, async(request, response) => {
    const id = request.params.id
    const video = await Video.findById(id).populate("comments")
    if (video) {
        response.status(200).json(video)
    } else {
        response.status(404).json("Video not found")
    }
})

router.put('/:id', [isAdminOrVideoOwner, validateVideo, validateParamId], async(request, response) => {
    const id = request.params.id
    const video = await Video.findById(id)
    const videoAlreadyExist = await Video.exists({"title": request.body.title, "username": video.username})
    if (videoAlreadyExist) {
        response.status(406).json("You already have a video with this name")
    } else {
        const newVideo = await Video.findByIdAndUpdate(id, request.body, {new: true})
        response.status(200).json(newVideo)
    }
})

router.delete('/:id', [isAdminOrVideoOwner, validateParamId], async(request, response) => {
    const id = request.params.id
    const video = await Video.findByIdAndDelete(id)
    const comment = await Comment.deleteMany({"id_video": video.id})
    const user = await User.findOne({"username": video.username})
    user.videos.pull(video.id)
    user.comments.pull(comment.id)
    await user.save()
    response.status(204).json('Video deleted successfully');
})

router.patch("/:id/watch", async(request, response) => {
    const id = request.params.id
    const video = await Video.findById(id)
    if (video.blocked || video.hidden) {
        video.nombre_vue++
        await video.save()
        response.status(200).json(video)
    } else {
        response.status(401).json("You cannot watch this video")
    }
})

router.patch("/:id/hide", isAdminOrVideoOwner, async(request, response) => {
    const id = request.params.id
    const video = await Video.findById(id)
    video.hidden ? video.hidden = false : video.hidden = true
    await video.save()
    response.status(200).json(video)
})

router.patch("/:id/block", isAdmin, async(request, response) => {
    const id = request.params.id
    const video = await Video.findById(id)
    video.blocked ? video.blocked = false : video.blocked = true
    await video.save()
    response.status(200).json(video)
})

export default router;