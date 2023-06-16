import { createServer } from "http";
import { Server } from "socket.io";
import app from "./swagger.js";
import userRouter from "./routers/user-router.js";
import videoRouter from "./routers/video-router.js";
import commentRouter from "./routers/comment-router.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cookieParser())
app.use(cors({ origin: "http://localhost:5173", methods: "GET,HEAD,PUT,PATCH,POST,DELETE", credentials: true}));

app.use("/users", userRouter);
app.use("/videos", videoRouter);
app.use("/comments", commentRouter);

export { app, httpServer as server, io };
