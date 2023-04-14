const express = require('express');
const app = express();
const sqlite3 = require('sqlite3');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

app.use(express.urlencoded({ extended: true}));
app.set('view engine', 'ejs');

const dbPath = path.join(__dirname, 'model', 'users.db');
const db = new sqlite3.Database(dbPath);

db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    hashed_id TEXT UNIQUE
)`);

app.get('/register', (req, res) => {
    res.render('registration', { error: 'Username already taken' });
  });


app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error'});
        }

        if (row) {
            res.json({ hashed_id: row.hashed_id});
        }
        else{
            let hashedId = await bcrypt.hash(`${Math.random()}`, 10);
            const hashedPassword = await bcrypt.hash(password, 10);
            hashedId = hashedId.replace(/\//g, "slash");


            db.run(
                'INSERT INTO users (name, email, password, hashed_id) VALUES (?, ?, ?, ?)',
                [name, email, hashedPassword, hashedId],
                (err) => {
                    if (err) {
                        console.error(err);
                        res.status(500).json({ error: 'Internal server error'});
                    }

                    console.log(hashedId)
                    res.redirect(`/${hashedId}/profile`);
                }
            );
        }
    });
});

const dbPath1 = path.join(__dirname, 'model', 'posts.db');
const dbposts = new sqlite3.Database(dbPath1);

// SQL query to create posts table
const createPostsTableQuery = `
  CREATE TABLE IF NOT EXISTS posts (
    post_id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    vote_counter INTEGER DEFAULT 0,
    hash_id TEXT
  )
`;

// Create the posts table
dbposts.run(createPostsTableQuery, (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Posts table created successfully');
  }
});

app.get('/:hashed_id/profile', (req, res) => {
    const { hashed_id } = req.params;
  
    const getUserNameQuery = `
    SELECT name FROM users WHERE hashed_id = ?
  `;

  db.get(getUserNameQuery, [hashed_id], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    if (!row) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get all posts created by the user in reverse chronological order
    const getUserPostsQuery = `
      SELECT * FROM posts WHERE hash_id = ? ORDER BY timestamp DESC
    `;
    dbposts.all(getUserPostsQuery, [hashed_id], (err, rows) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      console.log(rows)
    
      res.render('profile', {  user: {username: row.name}, posts: rows, hashed_id: hashed_id});
    });
  });
});

  app.post('/:hashed_id/profile', (req, res) => {
    const { hashed_id } = req.params;
    res.redirect(`/${hashed_id}/create`);
  });
  
  
  app.get('/:hashed_id/create', (req, res) => {
    const { hashed_id } = req.params;
  
    res.render('create', { hashed_id });
  });
  
  
  
  app.post('/:hashed_id/create', (req, res) => {
    const { title, content } = req.body;
    const timestamp = new Date().toLocaleString();
    const voteCounter = 0;
    const userId = req.params.hashed_id.toString();
    const post_id = uuidv4();
  
    dbposts.run(
      'INSERT INTO posts (post_id, title, content, timestamp, vote_counter, hash_id) VALUES (?, ?, ?, ?, ?, ?)',
      [post_id, title, content, timestamp, voteCounter, userId],
      (err) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: 'Internal server error22' });
          return;
        }
  
        // Redirect to the user's profile page
        res.redirect(`/${req.params.hashed_id}/profile`);
      }
    );
  });
  
  app.get('/:hashed_id/posts/:post_id', (req, res) => {
    const postId = req.params.post_id;
    const { hashed_id } = req.params;
  
    const getUserNameQuery1 = `
    SELECT name FROM users WHERE hashed_id = ?
  `;

  db.get(getUserNameQuery1, [hashed_id], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    if (!row) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get all posts created by the user in reverse chronological order
    const getUserPostsQuery1 = `
      SELECT * FROM posts WHERE hash_id = ? ORDER BY timestamp DESC
    `;
    dbposts.all(getUserPostsQuery1, [hashed_id], (err, rows) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      console.log(rows)
    
      res.render('post', {  user: {username: row.name}, posts: rows, hashed_id: hashed_id});
    });
  });
  

  });
  
  
app.listen(8080, () => {
    console.log('Server started on port 8080');
})