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
    videoPath: {
        type: String,
        required: 'Video path is required',
        unique: true
    },
    subtitles: {
        type: Array,
        of: {
            start: Number,
            end: Number,
            text: String
        },
        required: 'Subtitles are required'
    }
})

module.exports = mongoose.model("videos", videoSchema)