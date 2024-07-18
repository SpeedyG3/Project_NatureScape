const mongoose = require('mongoose');
const cities = require('./cities');
const {places, descriptors} = require('./seedHelpers'); 
const Campground = require('../models/campground');

main().catch(err => console.log(err));
async function main() {
    await mongoose.connect('mongodb://localhost:27017/camp');
    console.log("Mongoose open");
}

const sample = array => array[Math.floor(Math.random()*array.length)];

const seedDB = async() =>{
    await Campground.deleteMany({});
    for(let i=0; i<50; i++){
        const random1k = Math.floor(Math.random()*1000);
        const price = Math.floor(Math.random()*20)+10;
        const camp = new Campground({
            author: "65743bc7e954b9f20e3bc9fe",
            location: `${cities[random1k].city}, ${cities[random1k].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            // image: 'https://source.unsplash.com/random/?camping',
            description: 'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Exercitationem voluptatum eos cumque architecto rem, porro dolores laboriosam delectus nihil velit perspiciatis tenetur assumenda distinctio temporibus facilis praesentium nam atque animi!', 
            price,
            geometry: {
              type: "Point",
              coordinates: [
                cities[random1k].longitude,
                cities[random1k].latitude,
              ],
            },
            images: [
                {
                  url: 'https://res.cloudinary.com/dyc5oi3gi/image/upload/v1702316677/Camp/vzt6dmxcopcwokbagsth.jpg',       
                  filename: 'Camp/iklkzw1vvngfw1jjd5du',
                },
                {
                  url: 'https://res.cloudinary.com/dyc5oi3gi/image/upload/v1702316677/Camp/phag2g15wc0kpgv9pvv0.jpg',
                  filename: 'Camp/i9liadv8p5tbo2wjyxov',
                },
                {
                  url: 'https://res.cloudinary.com/dyc5oi3gi/image/upload/v1702316677/Camp/rqrdldmk9q1ooocrhazq.jpg',
                  filename: 'Camp/hsbkhoirltdqoyw7zjf8',
                }
              ]
        })
        await camp.save();
    }
}
seedDB().then(()=>{
    mongoose.connection.close();
})