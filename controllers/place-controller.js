const { validate } = require('uuid');
const mongoose = require('mongoose')
const {validationResult} = require("express-validator")
const fs = require('fs');
const { cwd } = require('process');
const path = require('path')


const getCoordinate = require('../util/location')
const Place = require('../models/place');
const User = require ('../models/user')
const HttpError = require ( '../models/http-error');
const user = require('../models/user');


const findPlaceById = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try {
    place = await Place.findById(placeId);
    }
    catch (err) {
        const error = new HttpError( err.message , 500)
        return next (error);
    }
    if (!place ) {
        const error  = new HttpError('Could not find a place by given id.' , 404);
        return next(error);
    }
    res.json({place : place.toObject({getters: true})});
}

const findPlaceByUserId = async (req, res, next) => {
    const userId = req.params.uid;
    let foundPlaces;
    try {foundPlaces = await Place.find({creator : userId});}
    catch (err) {
        return next(new HttpError(err.message, 500));
    }
    if(!foundPlaces || foundPlaces.length === 0 ){
        return next (new HttpError('Coud not find a place for the provide user',404));
    }
    res.json ({foundPlaces : foundPlaces.map(place => place.toObject({getters: true}))})
}

const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
   
    if(!errors.isEmpty()){
        return next( new HttpError('Your input is not valid' , 422))
    }
    const {title, description, address} = req.body;
    let coordinate;
    let creator 
    try {
        coordinate = await getCoordinate(address);
        creator = await user.findById(req.userData.userId);
    }
    catch (error){
        return next (error);
    }
    
    const createdPlace = new Place({
        title ,
        description,
        address,
        location : coordinate,
        image : `http://localhost:5000/${req.file.path}`,
        creator : req.userData.userId
    })
   
    
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({session : sess}) ;   
        await creator.places.push(createdPlace);
        await creator.save({session: sess});
        await sess.commitTransaction();
        
    }
    catch (err) {
        const error = new HttpError(
            'Could not create place' + err.message, 500
        )
        return next (error);
    }
    res.status(201).json(createdPlace.toObject({getters : true}));
}

const updatePlace = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return next( new HttpError('Your input is not valid' , 422))
    }
    const {pid} = req.params;
    const {title, description, address} = req.body;
    let toUpdatePlace ;
    try {
        toUpdatePlace = await Place.findById(pid);
    }
    catch (err) {
        return next(new HttpError(err.message, 500));
    }
    toUpdatePlace.title = title;
    toUpdatePlace.description = description;
    toUpdatePlace.address = address;

    try {

        if(req.userData.userID !== toUpdatePlace.id.toString())
        {
            throw new Error("You can not edit this place");
        }

        await toUpdatePlace.save();
        
    }
    catch (err) {
        return next(new HttpError(err.message, 500))
    }

    res.status(200).json({place : toUpdatePlace.toObject({getters: true})})
}

const deletePlace = async (req, res, next) => {
    const placeId = req.params.pid;
    
    let place;
    try {
      place = await Place.findById(placeId).populate('creator');
      if(!place) throw new HttpError ('Could not find place' , 404);
    } catch (err) {
      const error = new HttpError(
        err.message,
        err.code || 500
      );
      return next(error);
    }
    let  imageUrl = place.image;
    const startPath = imageUrl.indexOf('5000');
    let imagePath = imageUrl.slice(startPath+4)
    imagePath = path.join(cwd() , imagePath);

    try {   
        fs.unlink(imagePath, err => {
          });
      const sess = await mongoose.startSession();
      sess.startTransaction();
      place.creator.places.pull(place)
      await place.creator.save({session: sess});
      await place.deleteOne({session : sess});

      await sess.commitTransaction();
      

    } catch (err) {
      const error = new HttpError(
        err.message,
        err.code || 500
      );
      return next(error);
    }
    
    res.status(200).json({ message: 'Deleted place.' });
  };
  

exports.findPlaceById = findPlaceById;
exports.findPlaceByUserId = findPlaceByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
