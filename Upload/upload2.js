const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const Busboy = require('busboy');
const { Client } = require('basic-ftp');

app.get("/home", (req, res) => {
  res.send('image upload test');
});

app.post('/uploadvideo', (req, res) => {
  const busboy = Busboy({ headers: req.headers });

  busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
    const client = new Client();
    try {
      await client.access({
        host: '10.24.234.133', // Remplacez par l'adresse du serveur FTP distant
        user: 'User', // Remplacez par votre nom d'utilisateur FTP
        password: 'P@ssword', // Remplacez par votre mot de passe FTP
        port: 21
      });

      // Chemin de destination du fichier sur le serveur FTP distant
      const remotePath = '/DESKTOP-CV36JEK/Users/clopa/Documents/SupInfo/B3/Cours/3PROJ/Infra_Test/TestLocal/' + filename.filename;

      // Créez un flux de lecture pour le fichier
      const readStream = file;

      // Téléchargez le fichier sur le serveur FTP distant
      await client.upload(readStream, remotePath);

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

  req.pipe(busboy);
});

app.listen(6600, () => {
  console.log('Server listening on http://localhost:6600 ...');
});