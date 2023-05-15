import express from'express';
import { User, Video } from '../mongo.js';
import { validateParamId, validateVideo } from '../middlewares/validation-midleware.js';
import { isAdmin, isRegister } from '../middlewares/auth-middleware.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     Video:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the video
 *           example: 6087c33ffc13ae720001f7d5
 *         nom_fichier:
 *           type: string
 *           description: The name of the video file
 *           example: video.mp4
 *         auteur:
 *           type: string
 *           description: The username of the user who uploaded the video
 *           example: johndoe
 *         cache:
 *           type: boolean
 *           description: Whether the video is cached or not
 *           example: false
 *         nombre_vue:
 *           type: integer
 *           description: The number of views of the video
 *           example: 10
 *         date_ajout:
 *           type: string
 *           description: The date when the video was uploaded
 *           example: 2022-01-01T00:00:00.000Z
 *         comments:
 *           type: array
 *           description: An array of comments on the video
 *           items:
 *             $ref: '#/components/schemas/Comment'
 * tags:
 *   name: Videos
 *   description: Operations about videos
 */

const router = express.Router();

/**
 * @swagger
 * /videos:
 *   get:
 *     summary: Get all videos
 *     tags: [Videos]
 *     responses:
 *       200:
 *         description: List of videos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Video'
 */

router.get('/', async(request, response) => {
    const videos = await Video.find()
    response.status(200).json(videos)
})

/**
 * @swagger
 * /videos:
 *  post:
 *     summary: Add a new video
 *     tags: [Videos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewVideo'
 *     responses:
 *       201:
 *         description: Video added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       404:
 *         description: User not found
 *       406:
 *         description: A video with this name already exists
 */

router.post('/', [isRegister, validateVideo], async(request, response) => {
    const user = await User.findOne({"username": request.username})

    const videoAlreadyExist = await Video.exists({"nom_fichier": request.body.nom_fichier, "auteur": user.username})

    if (videoAlreadyExist) {
        response.status(406).json("A video with this name already exist")
    } else {
        const video = await Video.create({
            ...request.body,
            auteur: user.username
        })
    
        user.videos.push(video);
    
        await user.save();
    
        response.status(201).json(video);
    }
})

/**
 * @swagger
 * /videos/mine:
 *   get:
 *     summary: Get all videos of logged user
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of videos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Video'
 *       404:
 *         description: You don't have any videos yet
 */

router.get('/mine', isRegister, async(request, response) => {
    const videos = await Video.find({"auteur": request.username})
    if (videos) {
        response.status(200).json(videos)
    } else {
        response.status(404).json("You don't have any videos yet")
    }
})

/**
 * @swagger
 * /videos/mine/{id}:
 *   get:
 *     summary: Get a specific video of logged user
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Video details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       401:
 *         description: You don't have access to this video
 *       404:
 *         description: Video not found
 */

router.get('/mine/:id', [isRegister, validateParamId], async(request, response) => {
    const id = request.params.id
    const video = await Video.findById(id)
    if (video && video.auteur === request.username) {
        response.status(200).json(video)
    } else {
        if (!video) {
            response.status(404).json("Video not found")
        } else {
            response.status(401).json("You don't have access to this video")
        }
    }
})

/**
 * @swagger
 * /videos/mine/{id}:
 *  put:
 *     summary: Update a specific video of logged user
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Video ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewVideo'
 *     responses:
 *       200:
 *         description: Video details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       401:
 *         description: You don't have access to this video
 *       404:
 *         description: Video not found
 */

router.put('/mine/:id', [isRegister, validateParamId], async(request, response) => {
    const id = request.params.id
    const video = await Video.findById(id)
    if (video && video.auteur === request.username) {
        await Video.findByIdAndUpdate(id, request.body)
        response.status(200).json(video)
    } else {
        if (!video) {
            response.status(404).json("Video not found")
        } else {
            response.status(401).json("You don't have access to this video")
        }
    }
})

/**
 * @swagger
 * /videos/mine/{id}:
 *  delete:
 *     summary: Delete a specific video of logged user
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Video details
  *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       401:
 *         description: You don't have access to this video
 *       404:
 *         description: Video not found
 */

router.delete('/mine/:id', [isRegister, validateParamId], async(request, response) => {
    const id = request.params.id
    const video = await Video.findById(id)
    if (video && video.auteur === request.username) {
        await Video.findByIdAndDelete(id)
        const user = await User.findOne({"username": request.username})
        user.videos.pull(id)
        await user.save()
        response.status(200).json(video)
    } else {
        if (!video) {
            response.status(404).json("Video not found")
        } else {
            response.status(401).json("You don't have access to this video")
        }
    }
})

/**
 * @swagger
 * /videos/{id}:
 *   get:
 *     summary: Get a specific video by ID
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Video details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       404:
 *         description: Video not found
 */

router.get('/:id', validateParamId, async(request, response) => {
    const id = request.params.id
    const video = await Video.findById(id)
    if (video) {
        response.status(200).json(video)
    } else {
        response.status(404).json("Video not found")
    }
})

/**
 * @swagger
 * /videos/{id}:
 *  put:
 *     summary: Update a specific video by ID
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Video ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewVideo'
 *     responses:
 *       200:
 *         description: Video details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       404:
 *         description: Video not found
 */

router.put('/:id', [isAdmin, validateParamId], async(request, response) => {
    const id = request.params.id
    const video = await Video.findByIdAndUpdate(id, request.body, {new: true})
    if (video) {
        response.status(200).json(video)
    } else {
        response.status(404).json("Video not found")
    }
})

/**
 * @swagger
 * /videos/{id}:
 *  delete:
 *     summary: Delete a specific video by ID
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *       404:
 *         description: Video not found
 */

router.delete('/:id', [isAdmin, validateParamId], async(request, response) => {
    const id = request.params.id
    const video = await Video.findByIdAndDelete(id)
    if (video) {
        const user = await User.findOne({"username": video.auteur})
        user.videos.pull(id)
        await user.save()
        response.status(200).json('Video deleted successfully');
    } else {
        response.status(404).json("Video not found")
    }
})

/**
 * @swagger
 * /videos/{id}/watch:
 *   put:
 *     summary: Increment the view count of a specific video by ID
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Video details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       404:
 *         description: Video not found
 */

router.put("/:id/watch", async(request, response) => {
    const id = request.params.id
    const video = await Video.findById(id)
    video.nombre_vue++
    await video.save()
    response.status(200).json(video)
})

/**
 * @swagger
 * /videos/{id}/comments:
 *   get:
 *     summary: Get all comments for a specific video by ID
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Video ID
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Video not found
 */

router.get("/:id/comments", validateParamId, async (request, response) => {
    const id = request.params.id
    const video = await Video.findById(id)

    if (video) {
        response.status(200).json(video.comments)
    } else {
        response.status(404).json("Video not found")
    }
})

export default router;