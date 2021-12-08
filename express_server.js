const generateRandomString = () => Math.random().toString(36).slice(-6);
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());



const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"],
  };
  res.render("urls_index", templateVars);//urls_index.ejs, ejs can find file automatically
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"],};
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  urlDatabase[generateRandomString()] = req.body.longURL;
  console.log(req.body);  // Log the POST request body to the console
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});
app.post("/urls/:shortURL/link", (req, res) => {
  const shortUrlToBeLinked = req.params.shortURL;
  res.redirect(`/urls/${shortUrlToBeLinked}`);
});
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortUrlToBeDeleted = req.params.shortURL;
  //console.log('urlToBeDeleted', urlDatabase);
  delete urlDatabase[shortUrlToBeDeleted];
  //console.log('urlDatabase', urlDatabase);
  res.redirect('/urls');
});
app.post("/urls/:shortURL/update", (req, res) => {
  const shortUrlToBeUpdated = req.params.shortURL;
  //console.log('shortUrlToBeUpdated', urlDatabase);
  urlDatabase[shortUrlToBeUpdated] = req.body.longURL;
  //console.log('urlDatabase', urlDatabase);
  res.redirect('/urls');
});
app.post("/urls/logout", (req, res) => {
  res.clearCookie('username');
  console.log('cookie cleared successfully!');
  res.redirect('/urls');
});

app.post("/urls/login", (req, res) => {
  res.cookie('username', req.body.login);
  res.redirect('/urls');
  console.log(req.cookies['username']);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
