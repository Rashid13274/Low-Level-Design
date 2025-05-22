// test implemt throtling

const express = require('express');
const app = express();

const throtlingObj = {};
const maxWindow  = 10000  // 10 second
const maxRequest = 5;
const delayTime  = 2000 // 2 second.

const throtlingMiddleware = (req, res, next) =>{

}

// struture it better and organize way for easier to  understand and helpful in read, apply changes in selected section only