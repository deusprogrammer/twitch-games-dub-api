const express = require('express');
var router = express.Router();

import {storeVideo, createPayloadZip, readFile} from '../utils/VideoTools';
var Videos = require('../models/videos');

import {authenticatedUserHasRole, getAuthenticatedTwitchUserId} from '../utils/SecurityHelper';

router.route("/")
    .get(async (request, response) => {
        try {
            let videos = [];
            console.log(request.query.twitchUserId);

            if (!request.query.twitchUserId) {
                console.log("ALL");
                videos = await Videos.find({}, null).exec();
            } else {
                console.log("ONE");
                videos = await Videos.find({twitchUserId: request.params.twitchUserId}, null).exec();
            }

            return response.json(videos);
        } catch (error) {
            console.error(error);
            response.status(500);
            return response.send(error);
        }
    })
    .post(async (request, response) => {
        if (!authenticatedUserHasRole(request, "TWITCH_BROADCASTER")) {
            response.status(401);
            return response.send("Forbidden");
        }

        let twitchUserId = getAuthenticatedTwitchUserId(request);

        let buffer = Buffer.from(request.body.videoPayload, "base64");
        
        try {
            let video = await storeVideo(request.body.name, buffer, twitchUserId, request.body.subtitles);
            return response.json(video);
        } catch (error) {
            console.error(error);
            response.status(500);
            return response.send(error);
        }
    });

router.route("/:id/zip")
    .get(async (request, response) => {
        try {
        let video = await Videos.find({_id: request.params.id})
        let byteStream = await readFile(video.videoPath);
        let dataUri = await createPayloadZip(byteStream, video.subtitles);
        return response.json({
            dataUri
        });
        } catch (error) {
            console.error(error);
            response.status(500);
            return response.send(error);
        }
    });

module.exports = router;