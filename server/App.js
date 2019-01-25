const http = require("http");
const express = require("express");
const app = express();
const port = 5555;
const server = http.createServer(app);
const io = require("socket.io")(server);
