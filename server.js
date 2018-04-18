

const express = require('express');
const fs = require('fs');
const shortId = require('shortid');
const validURL = require('valid-url');
const mongo = require('mongodb').MongoClient;
const mongoURL = 'mongodb://aakoni:vZbpEHe19b0r@ds247759.mlab.com:47759/short-url';

const app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.route('/').get((request, response) => {
  response.sendFile(process.cwd() + '/views/index.html');
})

app.use('/', express.static('public'));

app.get('/new/:url(*)', (request, response) => {
  let url = request.params.url;
  if (validURL.isUri(url)) {
    mongo.connect(mongoURL, (error, client) => {
      let db = client.db('short-url');
      if (error) {
        response.end('error');
        return console.error;
      } else {
        let urlList = db.collection('urlList');
        let short = shortId.generate();
        urlList.insert([{url: url, short: short}], () => {
          let data = {
            original: url,
            short: 'http://' + request.headers['host'] + '/' + short
          }
          client.close();
          response.send(data);
        });
      }
    });
  } else {
    let data = {error: 'error'};
    response.json(data);
  }
});

app.get('/:id', (request, response) => {
  let id = request.params.id;
  mongo.connect(mongoURL, (error, client) => {
    let db = client.db('short-url');
    if (error) {
      return console.error;
    } else {
      let urlList = db.collection('urlList');
      urlList.find({short: id}).toArray((error, docs) => {
        if (error) {
          response.send('error');
          return console.log('read', error);
        } else {
          if (docs.length > 0) {
            client.close();
            response.redirect(docs[0].url);
          } else  {
            client.close();
            response.end('error');
          }
        }
      })
    }
  })
});

// Response not found
app.use((request, response, next) => {
  response.status(404);
  response.type('txt').send('Not found');
});

// Middleware error
app.use((error, request, response, next) => {
  if (error) {
    response.status(error.status || 500).type('txt').send(error.message || 'Server Error');
  }
})

app.listen(process.env.PORT, () => {
  console.log('Node.js is listening.');
});
