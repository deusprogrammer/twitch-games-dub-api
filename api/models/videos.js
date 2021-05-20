var mongoose = require('mongoose')

var videoSchema = new mongoose.Schema({
    twitchUserId: {
        type: String,
        required: 'Twitch User is required'
    },
    name: {
        type: "String",
        default: "Video"
    },
    videoUrl: {
        type: String,
        required: 'Video url is required'
    },
    subtitles: {
        type: Array,
        of: {
            startTime: Number,
            endTime: Number,
            text: String
        },
        required: 'Subtitles are required'
    }
})

module.exports = mongoose.model("videos", videoSchema)