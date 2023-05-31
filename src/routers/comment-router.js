import express, { response } from "express";
import { Comment, Video, Image } from "../mongo.js";
import { isAdmin, isRegister } from "../middlewares/auth-middleware.js";
import { validateComment, validateParamId } from "../middlewares/validation-midleware.js";
import { io } from "../server.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     CommentInput:
 *       type: object
 *       required:
 *         - contenu
 *       properties:
 *         contenu:
 *           type: string
 *           description: The content of the comment
 *           example: This is a comment on the video
 *     Comment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the comment
 *           example: 6087c3c6fc13ae720001f7d7
 *         id_video:
 *           type: string
 *           description: The ID of the video that the comment is on
 *           example: 6087c33ffc13ae720001f7d5
 *         id_user:
 *           type: string
 *           description: The ID of the user who wrote the comment
 *           example: 6087c295fc13ae720001f7d3
 *         date:
 *           type: string
 *           description: The date when the comment was posted
 *           example: 2022-01-01T00:00:00.000Z
 *         contenu:
 *           type: string
 *           description: The content of the comment
 *           example: This is a comment on the video
 */

const router = express.Router();

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: Get all comments
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Unauthorized access
 */

router.get("/", async(request, response) => {
    const comments = await Comment.find();
    response.status(200).json(comments)
})

/* router.get("/:videoId", async (request, response) => {
    const videoId = request.params.videoId;
    
    try {
      const video = await Image.findById(videoId);
      
      if (video) {
        const comments = await Comment.find({ id_video: videoId });
        response.status(200).json(comments);
      } else {
        response.status(404).json("Video not found");
      }
    } catch (error) {
      response.status(500).json("Internal Server Error");
    }
});
   */
router.get("/:videoId", async (request, response) => {
    const videoId = request.params.videoId;
  
    try {
      const video = await Image.findById(videoId);
  
      if (video) {
        const comments = await Comment.find({ id_video: videoId });
  
        // Émettre les commentaires en temps réel à l'aide de Socket.IO
        io.emit("comments", comments);
  
        response.status(200).json(comments);
      } else {
        response.status(404).json("Video not found");
      }
    } catch (error) {
      response.status(500).json("Internal Server Error");
    }
});
  
/**
 * @swagger
 * /comments:
 *  post:
 *     summary: Add a comment to a video
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: videoId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the video to add a comment to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentInput'
 *     responses:
 *       201:
 *         description: The created comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid comment data
 *       404:
 *         description: Video not found
 *       401:
 *         description: Unauthorized access
 * tags:
 *   name: Comments
 *   description: Operations about comments
 */

/* router.post("/", [isRegister, validateParamId, validateComment], async (request, response) => {
    const videoId = request.query.videoId
    const video = await Video.findById(videoId)
    if (video) {
        const comment = await Comment.create({
            ...request.body,
            id_user: request.username,
            id_video: videoId
        })

        video.comments.push(comment)
        await video.save()

        response.status(201).json(comment)
    } else {
        response.status(404).json("Video not found")
    }
}) */
/* router.post("/", [isRegister], async (request, response) => {
    const videoId = request.query.videoId
    const video = await Image.findById(videoId)
    if (video) {
        const comment = await Comment.create({
            ...request.body,
            id_user: request.username,
            id_video: videoId
        })

        video.comments.push(comment)
        await video.save()

        response.status(201).json(comment)
    } else {
        response.status(404).json("Video not found")
    }
}) */
router.post("/", [isRegister], async (request, response) => {
    const videoId = request.query.videoId;
    const video = await Image.findById(videoId);
  
    if (video) {
        const comment = await Comment.create({
            ...request.body,
            id_user: request.username,
            id_video: videoId
        })
  
      // Émettre le commentaire en temps réel
      io.emit("comments", comment);
  
      response.status(201).json(comment);
    } else {
      response.status(404).json("Video not found");
    }
  });

/**
 * @swa
 * gger
 * /comments/{id}:
 *  delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the comment to delete
 *     responses:
 *       200:
 *         description: The comments of the video
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Forbidden access
 */

router.delete("/:id", [isAdmin, validateParamId], async(request, response) =>{
    const id = request.params.id
    const comment = await Comment.findByIdAndDelete(id)
    if (comment) {
        const video = await Video.findById(comment.id_video)
        video.comments.pull(id)
        await video.save()
        response.status(200).json(video.comments)
    } else {
        response.status(404).json("Comments not found")
    }
})

export default router;