const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const Campground = require('../models/campground');
const {isLoggedIn, isAuthor, validateCampground} = require('../middleware');

const campgrounds = require('../controllers/campgrounds');

//for images
const multer = require('multer');
// const upload = multer({dest: 'uploads/'}); //general way for local files
const {storage} = require('../cloudinary');
const upload = multer({storage}); //using cloudinary for files upload

router.route('/') //grouping of all routes by diff type of req
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground));
    
    //below is checking for cloudinary, we will add the below to above post eventually...below was for testing only
    // .post(upload.array('image'), (req, res)=>{ //upload.single is 1, upload.array is for many images
    //     console.log(req.body, req.files);
    //     res.send("Works!");
    // }) //this adds the image file to req.file and the req.body as usual as well like in a normal form post req

router.get('/new', isLoggedIn, campgrounds.renderNewForm);

router.route('/:id') //grouping of routes now by diff req
    .get(catchAsync(campgrounds.showCampground))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm));

module.exports = router;