import express from'express';
import { Comment, User, Video } from '../mongo.js';
import { validateParamId, validateVideo } from '../middlewares/validation-midleware.js';
import { isAdmin, isAdminOrVideoOwner, isRegister } from '../middlewares/auth-middleware.js';
import Busboy from 'busboy';
import Client from "basic-ftp"

const router = express.Router();

router.get('/', async(request, response) => {
    const search = request.query.search
    let query = {};

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } }
        ];
    }

    const videos = await Video.find(query).populate("comments");
    response.status(200).json(videos)
})

router.post('/', [isRegister, validateVideo], async(request, response) => {
    const busboy = Busboy({ headers: req.headers });
    const user = await User.findOne({"username": request.username})

    const videoAlreadyExist = await Video.exists({"title": request.body.title, "username": user.username})

    if (videoAlreadyExist) {
        response.status(406).json("You already have a video with this name")
    } else {
        busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
            const client = new Client();
            try {
                await client.access({
                host: '10.24.231.146', // Remplacez par l'adresse du serveur FTP distant
                //host: '163.5.23.24', // Remplacez par l'adresse du serveur FTP distant
                user: 'User', // Remplacez par votre nom d'utilisateur FTP
                // password: 'P@ssword', // Remplacez par votre mot de passe FTP
                port: 21
                });
        
                // Chemin de destination du fichier sur le serveur FTP distant
                const remotePath = '/DESKTOP-CV36JEK/Users/clopa/Documents/SupInfo/B3/Cours/3PROJ/Infra_Test/TestLocal/' + filename.filename;
        
                // Créez un flux de lecture pour le fichier
                const readStream = file;
        
                // Téléchargez le fichier sur le serveur FTP distant
                await client.upload(readStream, remotePath);
    
                const video = await Video.create({
                    ...request.body,
                    username: user.username
                })
            
                user.videos.push(video.id);
                await user.save();
    
                console.log(filename);
                console.log('Video uploaded');
                res.status(200).send('Video uploaded');
    
            } catch (error) {
                console.error('Error uploading video:', error);
                res.status(500).send('Error uploading video');
            } finally {
                client.close();
            }
        });
    
        response.status(201).json(video);
    }
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