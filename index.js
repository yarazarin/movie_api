const express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  uuid = require("uuid"),
  morgan = require("morgan");
app.use(morgan("common"));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Movie app!");
});

let users = [
  {
    id: 1,
    name: "name1",
    favMovies: ["movie01"],
  },
  {
    id: 2,
    name: "name2",
    favMovies: [],
  },
];

let movies = [
  {
    title: "Naruto",
    plot: "A young ninja dreams of becoming the Hokage, the leader of his village.",
    IMDBrating: 8.3,
    genre: "Adventure",
    director: "Hayato Date",
  },
  {
    title: "Attack on Titan",
    plot: "Giant humanoid creatures called Titans threaten the last remnants of humanity.",
    IMDBrating: 9.0,
    genre: "Action",
    director: "Tetsuro Araki",
  },
  {
    title: "Death Note",
    plot: "A high school student discovers a supernatural notebook that grants him the power to kill anyone whose name he writes in it.",
    IMDBrating: 9.0,
    genre: "Fantasy",
    director: "Tetsuro Araki",
  },
  {
    title: "Fullmetal Alchemist: Brotherhood",
    plot: "Two brothers use alchemy to try to bring their deceased mother back to life, but end up on a journey to uncover a conspiracy that threatens their world.",
    IMDBrating: 9.1,
    genre: "Action",
    director: "Yasuhiro Irie",
  },
  {
    title: "One Piece",
    plot: "A young boy sets out to become the King of the Pirates by finding the legendary One Piece treasure.",
    IMDBrating: 8.7,
    genre: "Adventure",
    director: "Konosuke Uda",
  },
  {
    title: "Dragon Ball Z",
    plot: "Goku and his friends defend Earth from powerful villains.",
    IMDBrating: 8.7,
    genre: "Action",
    director: "Daisuke Nishio",
  },
  {
    title: "Spirited Away",
    plot: "A young girl gets lost in a mysterious world of spirits and must find her way back to the human world.",
    IMDBrating: 8.6,
    genre: "Fantasy",
    director: "Hayao Miyazaki",
  },
  {
    title: "Your Lie in April",
    plot: "A talented pianist loses his passion for music after the death of his abusive mother, but finds inspiration again through a free-spirited violinist.",
    IMDBrating: 8.6,
    genre: "Drama",
    director: "Kyohei Ishiguro",
  },
  {
    title: "Cowboy Bebop",
    plot: "A group of bounty hunters travel through space in search of the galaxy's most dangerous criminals.",
    IMDBrating: 8.9,
    genre: "Action",
    director: "Shinichiro Watanabe",
  },
  {
    title: "Hunter x Hunter",
    plot: "A young boy sets out on a journey to become a Hunter, a highly skilled individual who specializes in tracking down rare treasures, animals, and even other people.",
    IMDBrating: 8.9,
    genre: "Adventure",
    director: "Hiroshi Kojina",
  },
];

//
app.post("/users", (req, res) => {
  const newUser = req.body;

  if (newUser.name) {
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).json(newUser);
  } else {
    res.status(400).send("name?");
  }
});

//UPDATE
app.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const updatedUser = req.body;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.name = updatedUser.name;
    res.status(200).json(user);
  } else {
    res.status(400).send("error");
  }
});

// CREATE
app.post("/users/:id/:movieTitle", (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.favMovies.push(movieTitle);
    // res.status(200).json(user);
    res.status(200).send(`${movieTitle} has added to user ${id} list`);
  } else {
    res.status(400).send("error");
  }
});

// DELETE
app.delete("/users/:id/:movieTitle", (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.favMovies = user.favMovies.filter((title) => title !== movieTitle);
    // res.status(200).json(user);
    res.status(200).send(`${movieTitle} has removed from user ${id} list`);
  } else {
    res.status(400).send("error");
  }
});

// DELETE
app.delete("/users/:id", (req, res) => {
  const { id } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    let user = users.find((user) => user.id != id);
    res.status(200).send(` the user ${id} has been deleted`);
  } else {
    res.status(400).send("error");
  }
});

app.get("/movies", (req, res) => {
  res.status(200).json(movies);
});

app.get("/movies/:title", (req, res) => {
  const { title } = req.params;
  const movie = movies.find((movie) => movie.title === title);

  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(404).send("There is no movie with this name on the list");
  }
});

app.get("/movies/genre/:genreName", (req, res) => {
  const { genreName } = req.params;
  const genre = movies.find((movie) => movie.genre === genreName).genre;
  if (genre) {
    res.status(200).json(genre);
  } else {
    res.status(404).send("There is no genre with this name on the list");
  }
});

app.get("/movies/directors/:directorName", (req, res) => {
  const { directorName } = req.params;
  const director = movies.find(
    (movie) => movie.director === directorName
  ).director;
  if (director) {
    res.status(200).json(director);
  } else {
    res.status(404).send("There is no director with this name on the list");
  }
});

app.get("/documentation.html", (req, res) => {
  res.sendFile("public/documentation.html", { root: __dirname });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(8080, () => {
  console.log("Server listening on port 8080");
});
