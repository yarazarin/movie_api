const express = require("express");
const app = express();
const morgan = require("morgan");

app.use(morgan("common"));
app.get("/movies", (req, res) => {
  const movies = [
    { title: "The Lord Of The Earring 01", year: "2001" },
    { title: "The Lord Of The Earring 02", year: "2002" },
    { title: "The Lord Of The Earring 03", year: "2003" },
    { title: "The Lord Of The Earring 04", year: "2004" },
    { title: "The Lord Of The Earring 05", year: "2005" },
    { title: "The Lord Of The Earring 06", year: "2006" },
    { title: "The Lord Of The Earring 07", year: "2007" },
    { title: "The Lord Of The Earring 08", year: "2008" },
    { title: "The Lord Of The Earring 09", year: "2009" },
    { title: "The Lord Of The Earring 10", year: "2010" },
  ];
  res.json(movies);
});

app.get("/", (req, res) => {
  res.send("Movie app!");
});

// app.get(("/documentation"), (req, res) => {
//   res.sendFile("public/documentation.html", { root: __dirname });
// });

app.get("/documentation.html", (req, res) => {
  res.sendFile("public/documentation.html", { root: __dirname });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(8080, () => {
  console.log("Server listening on port 8080");
});
