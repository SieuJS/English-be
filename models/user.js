const mongoose = require ('mongoose')
const Schema = mongoose.Schema;

const userSchema = new Schema ({
    email : {type : String, required : true , unique : true},
    password : {type : String , required : true , minlength: 6},
    username : {type : String, required : true},
    image : {type : String, required : true},
    places : [{type : mongoose.Types.ObjectId, required : true , ref : 'Place'}]
})

module.exports = mongoose.model('User' , userSchema);