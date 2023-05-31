import express, { response } from "express";
import multer from "multer";
import { Comment, Image, User } from "../mongo.js";
import { isAdmin, isRegister } from "../middlewares/auth-middleware.js";
import { validateComment, validateParamId } from "../middlewares/validation-midleware.js";
const router = express.Router();
import Client from 'ssh2-sftp-client'
import fs from 'fs'



router.get('/', async(request, response) => {
    const images = await Image.find()
    response.status(200).json(images)
})


router.post('/', [isRegister], async(request, response) => {
    const user = await User.findOne({"username": request.username})

    const imageAlreadyExist = await Image.exists({"nom_fichier": request.body.nom_fichier, "auteur": user.username})

    if (imageAlreadyExist) {
        response.status(406).json("A image with this name already exist")
    } else {
        const image = await Image.create({
            ...request.body,
            auteur: user.username
        })
    
        user.images.push(image);
    
        await user.save();
    
        response.status(201).json(image);
    }
})


router.get('/mine', isRegister, async(request, response) => {
    const images = await Image.find({"auteur": request.username})
    if (images) {
        response.status(200).json(images)
    } else {
        response.status(404).json("You don't have any images yet")
    }
})

router.get('/:videoId', async (request, response) => {
    try {
      const image = await Image.findById(request.params.videoId);
      if (image) {
        response.status(200).json(image);
      } else {
        response.status(404).json("Image not found");
      }
    } catch (error) {
      response.status(500).json(error);
    }
  });

  
router.get('/:userId', async (request, response) => {
    try {
      const user = await User.findById(request.params.userId).populate('images');
      if (user) {
        response.status(200).json(user.images);
      } else {
        response.status(404).json("User not found");
      }
    } catch (error) {
      response.status(500).json(error);
    }
  });



//upload videos

// création de l'objet de stockage des fichiers
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const path = "//DESKTOP-CV36JEK/Users/clopa/Documents/SupInfo/B3/Cours/3PROJ/Infra_Test/TestLocal"
        cb(null, path);  // dossier dans lequel les fichiers seront stockés 
/*           cb(null, '../../iSee/public/videos'); 
 */
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname); // nom du fichier enregistré
    },
  });
  // configuration de multer
  const upload = multer({
    storage: storage,
  }).fields([
    { name: "video", maxCount: 1 },
  ]);
  router.post("/uploads", (req, res) => {
    upload(req, res, function (err) {
      if (err) {
        console.error("Erreur Multer :", err);
        return res.status(500).json({ error: err });
      } else {
        // Les fichiers ont été téléchargés avec succès
  
        res.status(200).json({ message: "Files uploaded successfully" });
      }
    });
    
  });




   
 







export default router;