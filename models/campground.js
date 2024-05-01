const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;


//schema nexting for image thumbnail for campgrounds show and edit pages
const ImageSchema = new Schema({
    url: String, 
    filename:  String
})

ImageSchema.virtual('thumbnail').get(function(){
    return this.url.replace('/upload', '/upload/w_150');
});

const CampgroundSchema = new Schema({
    title: String, 
    images: [ImageSchema], //moved image prop, put into schema and used schema here for using static func for thumbnail purpose
    price: Number, 
    description: String, 
    location: String, 
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId, 
            ref: 'Review'
        }
    ]
});

CampgroundSchema.post("findOneAndDelete", async function(doc){
    //after deletion of a campground it pass the doc so we can
    // delete the reviews
    if(doc){
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})
module.exports = mongoose.model('Campground', CampgroundSchema);