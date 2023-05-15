import app from "./swagger.js"
import userRouter from "./routers/user-router.js"
import videoRouter from "./routers/video-router.js"
import imagesRouter from "./routers/images-router.js"
import commentRouter from "./routers/comment-router.js"

import cors from "cors"

app.use(cors({origin:"*", methods: "GET,HEAD,PUT,POST,DELETE", allowedHeaders: "token,Content-type"}))

app.use("/users", userRouter)
app.use("/videos", videoRouter)
app.use("/images", imagesRouter)
app.use("/comments", commentRouter)


export default app;