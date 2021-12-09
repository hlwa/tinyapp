const express = require("express");
const morgan = require('morgan');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(morgan('dev'));
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

const generateRandomString = () => Math.random().toString(36).slice(-6);
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};


const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const findUserByEmail = email => {
  for (const userId in users) {
    if (users[userId]['email'] === email) {
      return users[userId];
    }
  }
  return null;
};

app.get("/", (req, res) => {

  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies['user_id'];
  if (!userId) {
    res.redirect('/login');
  }
  const templateVars = {urls: urlDatabase, user: users[userId]};
  res.render("urls_index", templateVars);//urls_index.ejs, ejs can find file automatically
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies['user_id'];
  if (!userId) {
    res.redirect('/login');
  }
  const templateVars = {user: users[userId]};
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;//if there is no record in the database? sever will crush
  if (!urlDatabase[shortURL]) {
    return res.status(400).send('No record');
  }
  const userId = req.cookies['user_id'];
  if (!userId) {
    res.redirect('/login');
  }
  const longURL = urlDatabase[shortURL]['longURL'];
  const templateVars = { shortURL, longURL, user: users[userId]};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]['longURL'];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const userId = req.cookies['user_id'];
  const templateVars = {
    user: users[userId],
  };
  res.render('register', templateVars);
});

app.get("/login", (req, res) => {
  const userId = req.cookies['user_id'];
  const templateVars = {
    user: users[userId],
  };
  res.render('login',templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const userID = req.cookies['user_id'];
  urlDatabase[shortURL] = {longURL, userID};
  res.redirect("/urls");
});

app.post("/urls/:shortURL/link", (req, res) => {
  const shortUrlToBeLinked = req.params.shortURL;
  res.redirect(`/urls/${shortUrlToBeLinked}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortUrlToBeDeleted = req.params.shortURL;
  delete urlDatabase[shortUrlToBeDeleted];
  res.redirect('/urls');
});

app.post("/urls/:shortURL/update", (req, res) => {
  const shortUrlToBeUpdated = req.params.shortURL;
  urlDatabase[shortUrlToBeUpdated]['longURL'] = req.body.longURL;
  res.redirect('/urls');
});

app.post("/urls/login", (req, res) => {
  res.redirect('/login');
  //When browser post request to server, server need to send back requirement to broswer to set cookie.Cookies belong to broswer not server.
});

app.post("/urls/logout", (req, res) => {
  res.clearCookie('user_id');
  console.log('cookie cleared successfully!');
  res.redirect('/login');
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email);
  if (email === '' || password === '') {
    return res.status(400).send('Email and password cannot be blank');
  }
  if (user) {
    return res.status(400).send('A user with that email already exists');
  }
  const id = generateRandomString();
  users[id] = {id, email, password};
  res.cookie('user_id', id);
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email);
  if (email === '' || password === '') {
    return res.status(400).send('Email and password cannot be blank');
  }
  if (!user) {
    return res.status(403).send('Your email or password does not match');
  } else if (user.password !== password) {
    return res.status(403).send('Your email or password does not match');
  }
  const id = user.id;
  res.cookie('user_id', id);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
