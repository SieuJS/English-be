const express = require ('express');
const {check} = require ('express-validator');
const {findPlaceById,findPlaceByUserId, createPlace, updatePlace,deletePlace} = require ('../controllers/place-controller');
const fileUpload = require('../middlewares/file-upload')
const checkAuth = require('../middlewares/check-auth');


const router = express.Router();



router.get('/:pid', findPlaceById);

router.get('/user/:uid' , findPlaceByUserId);

router.use(checkAuth);

router.post('/',
    fileUpload.single('image'),[
    check('title')
    .not()
    .isEmpty(),
    check('description').isLength({min:5}),
    check('address').not().isEmpty(),
    check ('creator').not().isEmpty()
],createPlace);
 
router.patch('/:pid', [
    check('title')
    .not()
    .isEmpty(),
    check('description').isLength({min:5}),
    check('address').not().isEmpty()
], updatePlace) ;

router.delete('/:pid', deletePlace)
module.exports = router;