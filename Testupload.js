import { createServer } from 'http';
import busboy from 'busboy';
import { createWriteStream } from 'fs';
import { join } from 'path';
const sharedPath = "/Users/amirmansour/Documents/Supinfo/3proj/3PROJ-main-4/API/Files" // Chemin du répertoire

const server = createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <form action="/upload" enctype="multipart/form-data" method="post">
        <input type="file" name="someCoolFiles"><br>
        <button>Upload</button>
      </form>
    `); // Création d'un formulaire HTML pour l'affichage
    
  } else if (req.url === '/upload') {
    let filename = '';
    const bb = busboy({ headers: req.headers });
    bb.on('file', (name, file, info) => {
      filename = info.filename;
      const saveTo = join(sharedPath, filename);
      file.pipe(createWriteStream(saveTo));
    });
    bb.on('close', () => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`upload success: ${filename}`);
    });
    req.pipe(bb);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404');
  }
});

server.listen(6000, () => {
  console.log('Server listening on http://localhost:6600 ...');
});


//localhost 6600