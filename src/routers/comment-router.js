import express, { response } from "express";
import { Comment, Video, User } from "../mongo.js";
import { isAdmin, isAdminOrCommentOwner, isRegister } from "../middlewares/auth-middleware.js";
import { validateComment, validateParamId } from "../middlewares/validation-midleware.js";
import { io } from "../server.js";
import { array } from "yup";

const router = express.Router();

router.get("/", isAdmin, async(request, response) => {
    const comments = await Comment.find();
    response.status(200).json(comments)
})

router.post("/", [isRegister, validateComment], async (request, response) => {
  const videoId = request.query.videoId;
  const video = await Video.findById(videoId);
  const user = await User.findOne({username: request.username});

  if (video) {
    const comment = await Comment.create({
      ...request.body,
      username: request.username,
      id_video: videoId
    })

    video.comments.push(comment.id)
    user.comments.push(comment.id)

    await video.save()
    await user.save()

    // Émettre le commentaire en temps réel
    //io.emit("comments", comment);

    response.status(201).json(comment);
  } else {
    response.status(404).json("Video not found");
  }
});

router.get("/:videoId", validateParamId, async (request, response) => {
    const videoId = request.params.videoId;
  
    try {
      const video = await Video.findById(videoId);
  
      if (video) {
        const comments = await Comment.find({ id_video: videoId });
  
        // Émettre les commentaires en temps réel à l'aide de Socket.IO
        //io.emit("comments", comments);
  
        response.status(200).json(comments);
      } else {
        response.status(404).json("Video not found");
      }
    } catch (error) {
      response.status(500).json("Internal Server Error");
    }
});

router.delete("/:id", [isAdminOrCommentOwner, validateParamId], async(request, response) =>{
    const id = request.params.id
    const user = await User.findOne({username: request.username})
    const comment = await Comment.findByIdAndDelete(id)
    const video = await Video.findById(comment.id_video)
    video.comments.pull(comment.id)
    user.comments.pull(comment.id)
    await video.save()
    await user.save()
    response.status(204).json("Comment deleted succesfully")
})

export default router;