const cookieSession = require('cookie-session');
const express = require("express");
const morgan = require('morgan');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
app.use(morgan('dev'));
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(cookieSession({
  name: 'session',
  keys: ['purple-monkey-dinosaur'],
}));

const generateRandomString = () => Math.random().toString(36).slice(-6);

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
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

const urlsForUser = id => {
  let urls = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key]['userID'] === id) {
      urls[key] = urlDatabase[key]['longURL'];
    }
  }
  return urls;
};

const findUserByEmail = (email, users) => {
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

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.redirect('/login');
  }
  const urls = urlsForUser(userId);
  const templateVars = {urls, user: users[userId]};
  res.render("urls_index", templateVars);//urls_index.ejs, ejs can find file automatically
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.redirect('/login');
  }
  const templateVars = {user: users[userId]};
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.session.user_id;
  if (!userId) {
    res.redirect('/login');
  }
  const urls = urlsForUser(userId);
  if (!urls[shortURL]) {
    return res.status(400).send('No record');
  }
  const longURL = urls[shortURL]['longURL'];
  const templateVars = { shortURL, longURL, user: users[userId]};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    return res.status(400).send('No shorted URL record');
  }
  const longURL = urlDatabase[shortURL]['longURL'];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    req.session = null;
  }
  //whenever browser get register form server, server will return there is no user record
  const templateVars = {
    user: '',
  };
  res.render('register', templateVars);//
});

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    req.session = null;
  }
  //whenever browser get login form server, server will return there is no user record
  const templateVars = {
    user: '',//users[userId]
  };
  res.render('login',templateVars);
});

app.post("/urls", (req, res) => {//create newurl pages and will add new urls to urlDatabase
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const userID = req.session.user_id;
  urlDatabase[shortURL] = {longURL, userID};
  //console.log(urlDatabase); Tested: new url can be sotred in urlDatabase
  res.redirect("/urls");
});

app.post("/urls/:shortURL/link", (req, res) => {//edit button will link to /urls/id page
  const shortUrlToBeLinked = req.params.shortURL;
  res.redirect(`/urls/${shortUrlToBeLinked}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {//delete button
  const shortUrlToBeDeleted = req.params.shortURL;
  const userId = req.session.user_id;
  const urls = urlsForUser(userId);
  if (!urls[shortUrlToBeDeleted]) {
    res.send("<html><body><b>error: Not your record</b></body></html>\n");
  } else {
    delete urlDatabase[shortUrlToBeDeleted];
    res.redirect('/urls');
  }
});

app.post("/urls/:shortURL/update", (req, res) => {
  const shortUrlToBeUpdated = req.params.shortURL;
  const userId = req.session.user_id;
  const urls = urlsForUser(userId);
  if (!urls[shortUrlToBeUpdated]) {
    res.send("<html><body><b>error: Not your record</b></body></html>\n");
  } else {
    urlDatabase[shortUrlToBeUpdated]['longURL'] = req.body.longURL;
    res.redirect('/urls');
  }
});

app.post("/urls/login", (req, res) => {
  res.redirect('/login');
  //When browser post request to server, server need to send back requirement to broswer to set cookie.Cookies belong to broswer not server.
});
app.post("/urls/register", (req, res) => {
  res.redirect('/register');
  //When browser post request to server, server need to send back requirement to broswer to set cookie.Cookies belong to broswer not server.
});

app.post("/urls/logout", (req, res) => {
  req.session = null;
  console.log('cookie cleared successfully!');
  res.redirect('/login');
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const passwordRaw = req.body.password;
  const password = bcrypt.hashSync(passwordRaw, 10);
  const user = findUserByEmail(email, users);
  if (email === '' || passwordRaw === '') {
    return res.status(400).send('Email and password cannot be blank');
  }
  if (user) {
    return res.status(400).send('A user with that email already exists');
  }
  const id = generateRandomString();
  users[id] = {id, email, password};
  //res.cookie('user_id', id);
  // eslint-disable-next-line camelcase
  req.session.user_id = id;
  console.log(users);
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const passwordRaw = req.body.password;
  
  const user = findUserByEmail(email, users);
  if (email === '' || passwordRaw === '') {
    return res.status(400).send('Email and password cannot be blank');
  }
  if (!user) {
    return res.status(403).send('Your email or password does not match');
  }
  const passwordTrue = bcrypt.compareSync(passwordRaw, user.password);
  if (!passwordTrue) {
    return res.status(403).send('Your email or password does not match');
  }
  const id = user.id;
  //res.cookie('user_id', id);
  // eslint-disable-next-line camelcase
  req.session.user_id = id;

  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
