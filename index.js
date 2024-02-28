/**
 * To push to Heroku, use: git push heroku main
 */

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const fs = require("fs");
const passport = require("passport");
const uuid = require("uuid");
const morgan = require("morgan");
const Models = require("./models.js");
const { check, validationResult } = require("express-validator");
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

require('dotenv').config()


const Genres = Models.Genre;
const Director = Models.Director;
const Movies = Models.Movie;
const Users = Models.User;

let allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:4200",
  "http://localhost:1234",
  "https://yaramyflix.netlify.app",
  "https://yarazarin.github.io",
  "http://cf-front.s3-website-us-east-1.amazonaws.com",
  "https://cf-front.s3-website-us-east-1.amazonaws.com",
  "http://my-alb-52706256.us-east-1.elb.amazonaws.com",
  "http://cf-b.s3-website-us-east-1.amazonaws.com",
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        let message =
          "The CORS policy for this application doesn't allow access from origin " +
          origin;
        return callback(new Error(message), false);
      }
      return callback(null, true);
    },
  })
);

app.use(bodyParser.json());
let auth = require("./auth")(app);
require("./passport.js");
app.use(passport.initialize());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("common"));

mongoose.connect(process.env.CONNECTION_YaRa, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan("common"));

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Create an instance of the S3 service
const s3 = new AWS.S3();

// Configure multer for file uploads
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read', // Set ACL permissions for uploaded files
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname);
    }
  })
});

/**
 * Root route to welcome users to the application.
 */

app.get("/", (req, res) => {
  res.send("WELCOME TO MYFLIX!");
});

// Routes for users, movies, etc. (unchanged)

// Route to list objects in the S3 bucket
app.get('/listObjects', (req, res) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME
  };

  s3.listObjects(params, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to list objects in S3 bucket' });
    }
    res.json(data.Contents.map(object => object.Key));
  });
});

// Route to upload a file to the S3 bucket
app.post('/upload', upload.single('file'), (req, res) => {
  res.status(200).json({ message: 'File uploaded successfully' });
});

/**
 * Root route to welcome users to the application.
 */

app.get("/", (req, res) => {
  res.send("WELCOME TO MYFLIX!");
});

/**
 * Users endpoints
 */

/**
 * GET request to retrieve all users (requires authentication).
 */

app.get(
  "/users",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * GET request to retrieve a user by their username.
 */

app.get("/users/:Username", (req, res) => {
  Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

/**
 * POST request to create a new user.
 * @param {string} Username - The username of the user.
 * @param {string} Password - The user's password.
 * @param {string} Email - The user's email address.
 * @param {string} Birthday - The user's birthday (optional).
 */

app.post(
  "/users",
  [
    check("Username", "Username is required").isLength({ min: 5 }),
    check(
      "Username",
      "Username contains non alphanumeric characters - not allowed."
    ).isAlphanumeric(),
    check("Password", "Password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail(),
  ],
  (req, res) => {
    // Handle user registration here
    if (!req.body.Username || !req.body.Email) {
      return res.status(400).send("Username, Password, and Email required");
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + " already exists");
        } else {
          Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          })
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

/**
 * PUT request to update a user's information.
 * @param {string} Username - The username of the user.
 * @param {string} Password - The user's password.
 * @param {string} Email - The user's email address.
 * @param {string} Birthday - The user's birthday (optional).
 */

app.put("/users/:Username", (req, res) => {
  if (req.body.Username && req.body.Username !== req.params.Username) {
    Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          res.status(400).send("The new username is already taken!");
          return;
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
  // Hash the new password if provided
  let hashedPassword = req.body.Password
    ? Users.hashPassword(req.body.Password)
    : undefined;
  // Update the user information
  Users.findOneAndUpdate(
    { Username: req.params.Username },
    {
      $set: {
        Username: req.body.Username || req.params.Username,
        // Password: hashedPassword || req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday,
      },
    },
    { new: true }
  )
    .then((updatedUser) => {
      res.status(201).json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

/**
 * POST request to add a movie to a user's favorite movies list.
 * @param {string} Username - The username of the user.
 * @param {string} MovieID - The ID of the movie to add to favorites.
 */

app.post(
  "/users/:Username/movies/:MovieID",
  [
    check("Username", "Username is required").notEmpty(),
    check("MovieID", "MovieID is required").notEmpty(),
  ],
  (req, res) => {
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $push: { FavoriteMovies: req.params.MovieID },
      },
      { new: true }
    )
      .then((updatedUser) => {
        res.status(201).json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * DELETE request to remove a movie from a user's favorite movies list.
 * @param {string} Username - The username of the user.
 * @param {string} MovieID - The ID of the movie to remove from favorites.
 */

app.delete("/users/:Username/movies/:MovieID", (req, res) => {
  Users.findOneAndUpdate(
    { Username: req.params.Username },
    {
      $pull: { FavoriteMovies: req.params.MovieID },
    },
    { new: true }
  )
    .then((updatedUser) => {
      res.status(201).json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

/**
 * DELETE request to delete a user by their username.
 * @param {string} Username - The username of the user to delete.
 */

app.delete("/users/:Username", (req, res) => {
  Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + " not found");
      } else {
        res.status(200).send(req.params.Username + " removed");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error :" + err);
    });
});

/**
 * Movies endpoints
 */

/**
 * GET request to retrieve all movies (requires authentication).
 */

app.get(
  "/movies",
  // passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.find()
      .then((movies) => {
        res.status(201).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * GET request to retrieve a movie by its title.
 * @param {string} Title - The title of the movie.
 */

app.get("/movies/:Title", (req, res) => {
  Movies.findOne({ Title: req.params.Title })
    .then((movie) => {
      res.json(movie);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

/**
 * GET request to retrieve a movie by its genre name.
 * @param {string} genreName - The name of the genre.
 */

app.get("/movies/genre/:genreName", (req, res) => {
  Movies.findOne({ "Genre.Name": req.params.genreName })
    .then((genre) => {
      res.json(genre);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

/**
 * GET request to retrieve a movie by its director's name.
 * @param {string} Name - The name of the director.
 */

app.get("/movies/director/:Name", (req, res) => {
  Director.findOne({ Name: req.params.Name })
    .then((director) => {
      if (director) {
        res.json(director);
      } else {
        res.status(404).json({ message: "Director not found" });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

/****/
//GET DOCUMENTATION

app.get("/documentation", (req, res) => {
  res.sendFile("public/documentation.html", { root: __dirname });
});

/**
 * GET request to retrieve the API documentation.
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Error...?؟");
});

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});

