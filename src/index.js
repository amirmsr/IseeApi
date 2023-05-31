import { app, server } from "./server.js";

server.listen(3000, () => {
  console.log(`Server is listening on http://localhost:3000`);
  console.log("Documentation available on http://localhost:3000/documentation")
});